"""
WebSocket Chat Handler for Nexus AI.
Supports Clerk Authentication, Freemium Tier Gating, Parallel Multi-Agent Debate,
and PostgreSQL JSONB persistence.
"""

import os
import json
import uuid
import logging
from typing import Optional, Dict, Any

from fastapi import WebSocket, WebSocketDisconnect

from backend.db import get_connection
from backend.security.clerk_auth import verify_clerk_token, get_or_create_user
from backend.security.sanitizer import sanitize_input, SecurityError
from backend.rate_limit.limiter import check_and_increment
from backend.agents.council import get_council
from backend.agents.orchestrator import MultiAgentOrchestrator

logger = logging.getLogger("backend.websocket")

def open_connection():
    try:
        return get_connection()
    except Exception as exc:
        logger.warning(f"Database connection temporary error: {exc}")
        return None

async def handle_chat_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # 1. Authenticate connection via Clerk Token
    token = websocket.query_params.get("token")
    user_info = None
    user_db_record = {"id": None, "clerk_id": "guest", "tier": "free"}
    
    if token:
        user_info = verify_clerk_token(token)
        if user_info:
            user_db_record = get_or_create_user(user_info)
            logger.info(f"Authenticated user: {user_db_record['email']} (Tier: {user_db_record['tier']})")
        else:
            logger.info("Unverified token; operating in guest mode.")
    else:
        logger.info("Guest WebSocket connection connected.")

    user_tier = user_db_record.get("tier", "free")
    clerk_id = user_db_record.get("clerk_id", "guest")
    user_id = user_db_record.get("id")

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "message": "Invalid JSON format."})
                continue
                
            if msg.get("type") != "user_message":
                await websocket.send_json({"type": "error", "message": f"Unsupported message type: {msg.get('type')}"})
                continue
                
            content = msg.get("content", "").strip()
            conversation_id = msg.get("conversationId")
            council_id = msg.get("councilId", "general")
            provider_name = msg.get("provider", "gemini")

            if not content:
                await websocket.send_json({"type": "error", "message": "Message content cannot be empty."})
                continue

            # 2. Sanitize Input
            try:
                sanitized_content = sanitize_input(content)
            except SecurityError as e:
                await websocket.send_json({"type": "error", "message": str(e)})
                continue

            # 3. Check Rate Limits
            await websocket.send_json({"type": "status", "message": "Checking usage limits..."})
            conn_ctx = open_connection()
            if conn_ctx:
                try:
                    with conn_ctx as conn:
                        allowed, remaining, limit = await check_and_increment(conn, clerk_id, user_tier=user_tier)

                except Exception:
                    allowed, remaining, limit = await check_and_increment(None, clerk_id)
            else:
                allowed, remaining, limit = await check_and_increment(None, clerk_id)

            await websocket.send_json({"type": "rate_limit_status", "remaining": remaining, "limit": limit})

            if not allowed:
                await websocket.send_json({"type": "error", "message": "Daily query limit reached."})
                continue

            # 4. Freemium Tier Gate Enforcement for Councils
            council = get_council(council_id)
            if council.requires_pro and user_tier != "pro":
                await websocket.send_json({
                    "type": "error",
                    "code": "PRO_REQUIRED",
                    "message": f"The '{council.name}' is a PRO feature. Upgrade to Pro to unlock domain councils! Falling back to General Council."
                })
                council_id = "general"

            # 5. Get or Create Conversation in PostgreSQL
            is_new_conversation = False
            if user_id:
                if not conversation_id:
                    conversation_id = str(uuid.uuid4())
                    is_new_conversation = True
                    conn_ctx = open_connection()
                    if conn_ctx:
                        try:
                            with conn_ctx as conn:
                                with conn.cursor() as cur:
                                    cur.execute(
                                        """
                                        INSERT INTO conversations (id, user_id, clerk_id, title, created_at, updated_at)
                                        VALUES (%s, %s, %s, %s, NOW(), NOW())
                                        """,
                                        (conversation_id, user_id, clerk_id, "New Discussion"),
                                    )
                                    conn.commit()
                        except Exception as e:
                            logger.error(f"Failed to create conversation in DB: {e}")
                else:
                    conn_ctx = open_connection()
                    if conn_ctx:
                        try:
                            with conn_ctx as conn:
                                with conn.cursor() as cur:
                                    cur.execute(
                                        "SELECT id FROM conversations WHERE id = %s AND clerk_id = %s",
                                        (conversation_id, clerk_id),
                                    )
                                    if not cur.fetchone():
                                        cur.execute(
                                            """
                                            INSERT INTO conversations (id, user_id, clerk_id, title, created_at, updated_at)
                                            VALUES (%s, %s, %s, %s, NOW(), NOW())
                                            """,
                                            (conversation_id, user_id, clerk_id, "New Discussion"),
                                        )
                                        conn.commit()
                                        is_new_conversation = True
                        except Exception as e:
                            logger.error(f"Failed to verify conversation in DB: {e}")
            else:
                if not conversation_id:
                    conversation_id = str(uuid.uuid4())

            # 6. Execute Multi-Agent Orchestration
            orchestrator = MultiAgentOrchestrator(provider_name=provider_name)
            final_synthesis_text = ""
            conflict_analysis_data = {}

            async for event in orchestrator.run_debate_and_synthesize(
                user_query=sanitized_content,
                council_id=council_id
            ):
                event["conversationId"] = conversation_id
                await websocket.send_json(event)
                
                if event.get("type") == "debate_complete":
                    final_synthesis_text = event.get("full_text", "")
                    conflict_analysis_data = event.get("conflict_analysis", {})

            # 7. Persist User Message & Assistant Response with JSONB Conflict Data
            if user_id and final_synthesis_text:
                conn_ctx = open_connection()
                if conn_ctx:
                    try:
                        user_msg_id = str(uuid.uuid4())
                        assistant_msg_id = str(uuid.uuid4())
                        with conn_ctx as conn:
                            with conn.cursor() as cur:
                                # Save user query
                                cur.execute(
                                    """
                                    INSERT INTO messages (id, conversation_id, role, content, agent_name, created_at)
                                    VALUES (%s, %s, 'user', %s, 'User', NOW())
                                    """,
                                    (user_msg_id, conversation_id, sanitized_content),
                                )
                                # Save synthesized response with JSONB conflict analysis
                                cur.execute(
                                    """
                                    INSERT INTO messages (id, conversation_id, role, content, agent_name, conflict_analysis, created_at)
                                    VALUES (%s, %s, 'assistant', %s, 'Nexus Synthesizer', %s, NOW())
                                    """,
                                    (assistant_msg_id, conversation_id, final_synthesis_text, json.dumps(conflict_analysis_data)),
                                )
                                # Update conversation timestamp
                                cur.execute(
                                    "UPDATE conversations SET updated_at = NOW() WHERE id = %s",
                                    (conversation_id,),
                                )
                                conn.commit()
                    except Exception as e:
                        logger.error(f"Failed to persist messages to DB: {e}")

            await websocket.send_json({"type": "status", "message": "Completed."})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"Error in websocket handler: {e}")
