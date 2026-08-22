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
            logger.info(f"Authenticated user: {user_db_record.get('email')} (Tier: {user_db_record.get('tier')})")
        else:
            user_db_record = get_or_create_user({"clerk_id": "guest", "email": "guest@nexus.ai", "name": "Guest User", "username": "guest"})
            logger.info("Unverified token; operating in guest mode.")
    else:
        user_db_record = get_or_create_user({"clerk_id": "guest", "email": "guest@nexus.ai", "name": "Guest User", "username": "guest"})
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
            provider_name = msg.get("provider", "groq")

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
            allowed, remaining, limit = True, 10, 10
            try:
                with get_connection() as conn:
                    allowed, remaining, limit = await check_and_increment(conn, clerk_id, user_tier=user_tier)
            except Exception as exc:
                logger.warning(f"Database rate-limit check fallback: {exc}")
                allowed, remaining, limit = await check_and_increment(None, clerk_id, user_tier=user_tier)

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
            if user_id:
                if not conversation_id:
                    conversation_id = str(uuid.uuid4())
                    try:
                        with get_connection() as conn:
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
                    try:
                        with get_connection() as conn:
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
                    except Exception as e:
                        logger.error(f"Failed to verify conversation in DB: {e}")
            else:
                if not conversation_id:
                    conversation_id = str(uuid.uuid4())

            # 6. Execute Multi-Agent Orchestration
            import time
            start_time = time.time()
            orchestrator = MultiAgentOrchestrator(primary_provider=provider_name)
            final_synthesis_text = ""
            conflict_analysis_data = {}
            detected_category = "general_knowledge"
            collected_agent_stances = []

            async for event in orchestrator.run_debate_and_synthesize(
                user_query=sanitized_content,
                council_id=council_id
            ):
                event["conversationId"] = conversation_id
                if event.get("category"):
                    detected_category = event.get("category")
                if event.get("type") == "agent_stances_complete":
                    collected_agent_stances = event.get("agent_responses", [])
                await websocket.send_json(event)
                
                if event.get("type") == "debate_complete":
                    final_synthesis_text = event.get("full_text", "")
                    conflict_analysis_data = event.get("conflict_analysis", {})

            latency_ms = int((time.time() - start_time) * 1000)

            # 7. Persist User Message, Persona Stances, & Synthesized Response with real analytics metrics
            if user_id and final_synthesis_text:
                try:
                    user_msg_id = str(uuid.uuid4())
                    assistant_msg_id = str(uuid.uuid4())
                    with get_connection() as conn:
                        with conn.cursor() as cur:
                            # Save user query with detected category
                            cur.execute(
                                """
                                INSERT INTO messages (id, conversation_id, role, content, agent_name, category, created_at)
                                VALUES (%s, %s, 'user', %s, 'User', %s, NOW())
                                """,
                                (user_msg_id, conversation_id, sanitized_content, detected_category),
                            )

                            # Save each individual council persona response with its real provider
                            for stance in collected_agent_stances:
                                stance_msg_id = str(uuid.uuid4())
                                p_used = stance.get("provider_used", "groq").lower()
                                lat_str = str(stance.get("latency", "1.0s")).replace("s", "").strip()
                                try:
                                    p_lat_ms = int(float(lat_str) * 1000)
                                except:
                                    p_lat_ms = 1000

                                cur.execute(
                                    """
                                    INSERT INTO messages (id, conversation_id, role, content, agent_name, category, persona_role, provider, latency_ms, was_fallback, created_at)
                                    VALUES (%s, %s, 'assistant', %s, %s, %s, %s, %s, %s, false, NOW())
                                    """,
                                    (
                                        stance_msg_id,
                                        conversation_id,
                                        stance.get("content", ""),
                                        stance.get("role_name", "Council Agent"),
                                        detected_category,
                                        stance.get("role_id", "persona"),
                                        p_used,
                                        p_lat_ms,
                                    ),
                                )

                            # Save synthesized response with role, provider, latency, and conflict analysis
                            cur.execute(
                                """
                                INSERT INTO messages (id, conversation_id, role, content, agent_name, category, persona_role, provider, latency_ms, was_fallback, conflict_analysis, created_at)
                                VALUES (%s, %s, 'assistant', %s, 'Nexus Synthesizer', %s, 'synthesizer', %s, %s, false, %s, NOW())
                                """,
                                (assistant_msg_id, conversation_id, final_synthesis_text, detected_category, provider_name, latency_ms, json.dumps(conflict_analysis_data)),
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
