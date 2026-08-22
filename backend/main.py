import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, Header, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("backend")

from backend.db import init_pool, close_pool, get_connection
from backend.websocket.handler import handle_chat_websocket
from backend.security.clerk_auth import verify_clerk_token, get_or_create_user
from backend.agents.council import get_available_councils

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Nexus AI FastAPI application...")
    init_pool()
    yield
    logger.info("Shutting down Nexus AI FastAPI application...")
    close_pool()

app = FastAPI(
    title="Nexus AI Backend Engine",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS Configuration
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        return {"id": None, "clerk_id": "guest", "tier": "free"}
        
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )
        
    token = parts[1]
    user_info = verify_clerk_token(token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token",
        )
        
    return get_or_create_user(user_info)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Nexus AI Backend"}

@app.get("/api/health/db")
def db_health_check():
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed",
        )

# REST: Fetch available Domain Councils
@app.get("/api/ai/councils")
def list_councils(current_user: dict = Depends(get_current_user)):
    is_pro = current_user.get("tier") == "pro"
    return {
        "user_tier": current_user.get("tier", "free"),
        "councils": get_available_councils(is_pro=is_pro)
    }

# REST: Toggle User Tier (Demo Mode Switcher for Hackathon Presentation)
@app.post("/api/user/toggle-tier")
def toggle_user_tier(current_user: dict = Depends(get_current_user)):
    clerk_id = current_user.get("clerk_id")
    if not clerk_id or clerk_id == "guest":
        raise HTTPException(status_code=400, detail="Authentication required to toggle tier")
        
    new_tier = "pro" if current_user.get("tier") == "free" else "free"
    
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET tier = %s WHERE clerk_id = %s",
                    (new_tier, clerk_id)
                )
                conn.commit()
        return {"status": "success", "clerk_id": clerk_id, "new_tier": new_tier}
    except Exception as e:
        logger.error(f"Failed to toggle tier: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user tier")

# REST: List conversations
@app.get("/api/ai/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    clerk_id = current_user.get("clerk_id")
    if not clerk_id or clerk_id == "guest":
        return []
        
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, title, created_at, updated_at 
                    FROM conversations 
                    WHERE clerk_id = %s 
                    ORDER BY updated_at DESC
                    """,
                    (clerk_id,),
                )
                rows = cur.fetchall()
                return [{
                    "id": row[0],
                    "title": row[1],
                    "createdAt": row[2].isoformat() if row[2] else None,
                    "updatedAt": row[3].isoformat() if row[3] else None,
                } for row in rows]
    except Exception as e:
        logger.error(f"Failed to fetch conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversations")

# REST: Get conversation details & message history with conflict analysis
@app.get("/api/ai/conversations/{conversation_id}")
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    clerk_id = current_user.get("clerk_id")
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, title, created_at FROM conversations WHERE id = %s AND clerk_id = %s",
                    (conversation_id, clerk_id),
                )
                conv_row = cur.fetchone()
                if not conv_row:
                    raise HTTPException(status_code=404, detail="Conversation not found")
                
                cur.execute(
                    """
                    SELECT id, role, content, agent_name, conflict_analysis, created_at 
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
                        "conflictAnalysis": row[4], # JSONB data
                        "createdAt": row[5].isoformat() if row[5] else None,
                    })
                
                return {
                    "id": conv_row[0],
                    "title": conv_row[1],
                    "createdAt": conv_row[2].isoformat() if conv_row[2] else None,
                    "messages": messages,
                }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation details")

# WebSocket connection endpoint
@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await handle_chat_websocket(websocket)
