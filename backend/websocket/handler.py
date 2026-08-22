import os
import jwt
import json
import uuid
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect

from backend.db import get_connection
from backend.security.sanitizer import sanitize_input, SecurityError
from backend.rate_limit.limiter import check_and_increment
from backend.agents.providers import get_provider

logger = logging.getLogger(__name__)

JWT_SECRET = os.environ.get("JWT_SECRET", "nexus-ai-super-secret-key-development-mode-2026")

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception as e:
        logger.error(f"Failed to decode token: {e}")
        return None


def open_connection():
    """Return a DB connection context manager, or None if the DB is unavailable."""
    try:
        return get_connection()
    except Exception as exc:
        logger.warning(f"Database unavailable: {exc}")
        return None


async def handle_chat_websocket(websocket: WebSocket):
    # Accept the connection first
    await websocket.accept()
    
    # Extract token from query params
    token = websocket.query_params.get("token")
    user_id = None
    email = None
    
    if token:
        payload = decode_token(token)
        if not payload:
            await websocket.send_json({"type": "error", "message": "Invalid or expired token."})
            await websocket.close(code=4008)
            return
        user_id = payload.get("userId")
        email = payload.get("email")
        logger.info(f"Authenticated connection: user_id={user_id}, email={email}")
    else:
        logger.info("Guest connection (no token provided)")

    try:
        while True:
            # Receive message from client
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
            provider_name = msg.get("provider", "openai") # default to openai

            if not content:
                await websocket.send_json({"type": "error", "message": "Message content cannot be empty."})
                continue

            # 1. Sanitize input
            try:
                sanitized_content = sanitize_input(content)
            except SecurityError as e:
                await websocket.send_json({"type": "error", "message": str(e)})
                continue

            # 2. Check rate limit
            await websocket.send_json({"type": "status", "message": "Checking usage limit..."})

            conn_ctx = open_connection()
            if conn_ctx is not None:
                try:
                    with conn_ctx as conn:
                        allowed, remaining, limit = await check_and_increment(conn, user_id)
                except Exception as e:
                    logger.warning(f"Rate-limit DB unavailable; using fallback limits: {e}")
                    allowed, remaining, limit = await check_and_increment(None, user_id)
            else:
                allowed, remaining, limit = await check_and_increment(None, user_id)

            await websocket.send_json({"type": "rate_limit_status", "remaining": remaining, "limit": limit})

            if not allowed:
                await websocket.send_json({"type": "error", "message": "Daily query limit reached."})
                continue

            # 3. Get or create conversation (only for authenticated users)
            # For guests, we skip db persistence and generate transient UUID
            is_new_conversation = False
            title = "New Conversation"
            
            if user_id:
                if not conversation_id:
                    conversation_id = str(uuid.uuid4())
                    is_new_conversation = True
                    conn_ctx = open_connection()
                    if conn_ctx is not None:
                        try:
                            with conn_ctx as conn:
                                with conn.cursor() as cur:
                                    cur.execute(
                                        """
                                        INSERT INTO conversations (id, user_id, title, created_at, updated_at)
                                        VALUES (%s, %s, %s, NOW(), NOW())
                                        """,
                                        (conversation_id, user_id, title),
                                    )
                                    conn.commit()
                        except Exception as e:
                            logger.error(f"Failed to create conversation: {e}")
                            logger.warning("Proceeding without persisted conversation due to DB error.")
                    else:
                        logger.warning("Skipping conversation creation because the database is unavailable.")
                else:
                    # Verify conversation exists and belongs to the user
                    conn_ctx = open_connection()
                    if conn_ctx is not None:
                        try:
                            with conn_ctx as conn:
                                with conn.cursor() as cur:
                                    cur.execute(
                                        "SELECT id, title FROM conversations WHERE id = %s AND user_id = %s",
                                        (conversation_id, user_id),
                                    )
                                    row = cur.fetchone()
                                    if not row:
                                        # Create it if it doesn't exist (or was created client side)
                                        cur.execute(
                                            """
                                            INSERT INTO conversations (id, user_id, title, created_at, updated_at)
                                            VALUES (%s, %s, %s, NOW(), NOW())
                                            """,
                                            (conversation_id, user_id, title),
                                        )
                                        conn.commit()
                                        is_new_conversation = True
                                    else:
                                        title = row[1]
                        except Exception as e:
                            logger.error(f"Failed to verify/create conversation: {e}")
                            logger.warning("Proceeding without conversation verification due to DB error.")
                    else:
                        logger.warning("Skipping conversation verification because the database is unavailable.")
            else:
                # Guest user
                if not conversation_id:
                    conversation_id = str(uuid.uuid4())

            # Load message history context (only for authenticated users)
            context = []
            if user_id and not is_new_conversation:
                conn_ctx = open_connection()
                if conn_ctx is not None:
                    try:
                        with conn_ctx as conn:
                            with conn.cursor() as cur:
                                cur.execute(
                                    """
                                    SELECT role, content FROM messages 
                                    WHERE conversation_id = %s 
                                    ORDER BY created_at ASC 
                                    LIMIT 20
                                    """,
                                    (conversation_id,),
                                )
                                rows = cur.fetchall()
                                for r in rows:
                                    context.append({"role": r[0], "content": r[1]})
                    except Exception as e:
                        logger.error(f"Failed to load messages context: {e}")
                        # Non-fatal: log and proceed with empty context
                else:
                    logger.warning("Skipping message history load because the database is unavailable.")

            # 4. Connect to agent and stream response
            await websocket.send_json({"type": "status", "message": "Connecting to agent..."})
            
            try:
                provider = get_provider(provider_name)
            except Exception as e:
                logger.error(f"Provider load error: {e}")
                await websocket.send_json({"type": "error", "message": f"Provider error: {str(e)}"})
                continue

            await websocket.send_json({"type": "status", "message": "Agent responding..."})

            full_response_parts = []
            try:
                # Stream the response
                async for chunk in provider.stream(sanitized_content, context):
                    full_response_parts.append(chunk)
                    await websocket.send_json({
                        "type": "agent_response_chunk",
                        "content": chunk,
                        "agent": provider.name
                    })
            except Exception as e:
                logger.error(f"Streaming error: {e}")
                await websocket.send_json({"type": "error", "message": f"Error during generation: {str(e)}"})
                continue

            full_response = "".join(full_response_parts)
            await websocket.send_json({"type": "agent_completed", "agent": provider.name})

            # Save the message pair in database (only for authenticated users)
            if user_id:
                conn_ctx = open_connection()
                if conn_ctx is not None:
                    try:
                        user_msg_id = str(uuid.uuid4())
                        agent_msg_id = str(uuid.uuid4())
                        with conn_ctx as conn:
                            with conn.cursor() as cur:
                                # Save user message
                                cur.execute(
                                    """
                                    INSERT INTO messages (id, conversation_id, role, content, agent_name, created_at)
                                    VALUES (%s, %s, 'user', %s, %s, NOW())
                                    """,
                                    (user_msg_id, conversation_id, sanitized_content, provider.name),
                                )
                                # Save assistant message
                                cur.execute(
                                    """
                                    INSERT INTO messages (id, conversation_id, role, content, agent_name, created_at)
                                    VALUES (%s, %s, 'assistant', %s, %s, NOW())
                                    """,
                                    (agent_msg_id, conversation_id, full_response, provider.name),
                                )
                                # Update conversation updated_at
                                cur.execute(
                                    """
                                    UPDATE conversations 
                                    SET updated_at = NOW() 
                                    WHERE id = %s
                                    """,
                                    (conversation_id,),
                                )
                                conn.commit()
                    except Exception as e:
                        logger.error(f"Failed to save messages to DB: {e}")
                        # Non-fatal to streaming, but user won't see history
                else:
                    logger.warning("Skipping saving messages because the database is unavailable.")

                # Generate title in the background if it's a new conversation
                if is_new_conversation:
                    try:
                        # LLM title generation
                        title_prompt = f"Summarize the following prompt in 4-5 words. Output ONLY the short summary, no quotes, no markdown: {sanitized_content}"
                        generated_title = await provider.generate(title_prompt)
                        generated_title = generated_title.strip().strip('"').strip("'")
                        if generated_title and open_connection() is not None:
                            title = generated_title
                            try:
                                with open_connection() as conn:
                                    with conn.cursor() as cur:
                                        cur.execute(
                                            "UPDATE conversations SET title = %s WHERE id = %s",
                                            (title, conversation_id),
                                        )
                                        conn.commit()
                            except Exception as e:
                                logger.error(f"Failed to persist generated conversation title: {e}")
                    except Exception as e:
                        logger.error(f"Failed to generate conversation title: {e}")

            # Send final response message
            await websocket.send_json({
                "type": "final_response",
                "content": full_response,
                "conversationId": conversation_id,
                "title": title
            })
            await websocket.send_json({"type": "status", "message": "Completed."})

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"Error in websocket handler: {e}")
        try:
            await websocket.send_json({"type": "error", "message": "An unexpected error occurred."})
        except:
            pass
