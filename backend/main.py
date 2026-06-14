import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, Header, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("backend")

from backend.db import init_pool, close_pool, get_connection
from backend.websocket.handler import handle_chat_websocket, decode_token

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up FastAPI application...")
    try:
        init_pool()
    except Exception as e:
        logger.error(f"Failed to initialize connection pool: {e}")
    yield
    # Shutdown
    logger.info("Shutting down FastAPI application...")
    close_pool()

app = FastAPI(
    title="Nexus AI Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper to verify token from Authorization header
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is missing",
        )
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
    
    token = parts[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
        
    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing userId",
        )
        
    return user_id

@app.get("/health")
def health_check():
    return {"status": "ok"}

# REST: List conversations
@app.get("/api/ai/conversations")
async def list_conversations(user_id: str = Depends(get_current_user_id)):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, title, created_at, updated_at 
                    FROM conversations 
                    WHERE user_id = %s 
                    ORDER BY updated_at DESC
                    """,
                    (user_id,),
                )
                rows = cur.fetchall()
                conversations = []
                for row in rows:
                    conversations.append({
                        "id": row[0],
                        "title": row[1],
                        "createdAt": row[2].isoformat() if row[2] else None,
                        "updatedAt": row[3].isoformat() if row[3] else None,
                    })
                return conversations
    except Exception as e:
        logger.error(f"Failed to fetch conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversations",
        )

# REST: Get conversation detail and its messages
@app.get("/api/ai/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    user_id: str = Depends(get_current_user_id)
):
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Get conversation
                cur.execute(
                    """
                    SELECT id, title, created_at, updated_at 
                    FROM conversations 
                    WHERE id = %s AND user_id = %s
                    """,
                    (conversation_id, user_id),
                )
                conv_row = cur.fetchone()
                if not conv_row:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Conversation not found",
                    )
                
                # Get messages
                cur.execute(
                    """
                    SELECT id, role, content, agent_name, created_at 
                    FROM messages 
                    WHERE conversation_id = %s 
                    ORDER BY created_at ASC
                    """,
                    (conversation_id,),
                )
                msg_rows = cur.fetchall()
                messages = []
                for row in msg_rows:
                    messages.append({
                        "id": row[0],
                        "role": row[1],
                        "content": row[2],
                        "agentName": row[3],
                        "createdAt": row[4].isoformat() if row[4] else None,
                    })
                
                return {
                    "id": conv_row[0],
                    "title": conv_row[1],
                    "createdAt": conv_row[2].isoformat() if conv_row[2] else None,
                    "updatedAt": conv_row[3].isoformat() if conv_row[3] else None,
                    "messages": messages,
                }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch conversation {conversation_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve conversation details",
        )

# WebSocket connection endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await handle_chat_websocket(websocket)
