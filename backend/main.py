import os
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, WebSocket, Header, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

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
        return {"id": None, "clerk_id": "guest", "tier": "free"}
        
    token = parts[1]
    user_info = verify_clerk_token(token)
    if not user_info:
        return {"id": None, "clerk_id": "guest", "tier": "free"}
        
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

@app.get("/api/health/providers")
def provider_health_check():
    """Non-invasive check of API key configurations for active providers."""
    providers = {
        "perplexity": "configured" if os.environ.get("PERPLEXITY_API_KEY") else "missing_key",
        "gemini": "configured" if os.environ.get("GEMINI_API_KEY") else "missing_key",
        "groq": "configured" if os.environ.get("GROQ_API_KEY") else "missing_key",
        "nvidia": "configured" if os.environ.get("NVIDIA_API_KEY") else "missing_key",
        "openai": "configured" if os.environ.get("OPENAI_API_KEY") else "missing_key",
        "anthropic": "configured" if os.environ.get("ANTHROPIC_API_KEY") else "missing_key",
        "deepseek": "configured" if os.environ.get("DEEPSEEK_API_KEY") else "missing_key",
    }
    return {
        "status": "ok",
        "configured_count": sum(1 for v in providers.values() if v == "configured"),
        "total_providers": len(providers),
        "providers": providers
    }

@app.post("/api/ai/test-orchestration")
async def test_orchestration_endpoint(payload: dict):
    """
    Controlled development endpoint for incremental testing:
    1. Single model test
    2. Parallel multi-agent orchestration
    3. Category classification
    """
    import time
    from backend.agents.orchestrator import MultiAgentOrchestrator
    from backend.agents.routing import get_routing_for_category
    
    query = payload.get("query", "What are key trade-offs in Microservices?")
    
    orchestrator = MultiAgentOrchestrator()
    
    classification = await orchestrator.classify_domain(query)
    
    return {
        "status": "success",
        "tested_query": query,
        "classification_result": classification,
        "routing_assigned": get_routing_for_category(classification["category"]),
        "timestamp": time.time()
    }

@app.get("/api/ai/councils")
def list_councils(current_user: dict = Depends(get_current_user)):
    is_pro = current_user.get("tier") == "pro"
    return {
        "user_tier": current_user.get("tier", "free"),
        "councils": get_available_councils(is_pro=is_pro)
    }

# Demo Mode Tier Switcher (Works in Guest & Auth mode)
@app.post("/api/user/toggle-tier")
def toggle_user_tier(current_user: dict = Depends(get_current_user)):
    clerk_id = current_user.get("clerk_id", "guest")
    new_tier = "pro" if current_user.get("tier") == "free" else "free"
    
    if clerk_id != "guest":
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE users SET tier = %s WHERE clerk_id = %s",
                        (new_tier, clerk_id)
                    )
                    conn.commit()
        except Exception as e:
            logger.error(f"Failed to update user tier in DB: {e}")
            
    return {"status": "success", "clerk_id": clerk_id, "new_tier": new_tier}

@app.get("/api/ai/conversations")
async def list_conversations(current_user: dict = Depends(get_current_user)):
    clerk_id = current_user.get("clerk_id", "guest")
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, title, created_at, updated_at 
                    FROM conversations 
                    WHERE clerk_id = %s OR clerk_id = 'guest'
                    ORDER BY updated_at DESC
                    LIMIT 50
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
        return []

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
                    "SELECT id, title, created_at FROM conversations WHERE id = %s AND (clerk_id = %s OR clerk_id = 'guest')",
                    (conversation_id, clerk_id),
                )
                conv_row = cur.fetchone()
                if not conv_row:
                    return {"id": conversation_id, "title": "New Discussion", "messages": []}
                
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
                        "conflictAnalysis": row[4],
                        "createdAt": row[5].isoformat() if row[5] else None,
                    })
                
                return {
                    "id": conv_row[0],
                    "title": conv_row[1],
                    "createdAt": conv_row[2].isoformat() if conv_row[2] else None,
                    "messages": messages,
                }
    except Exception as e:
        logger.error(f"Failed to fetch conversation: {e}")
        return {"id": conversation_id, "title": "New Discussion", "messages": []}

@app.post("/api/ai/conversations/{conversation_id}/generate-title")
async def generate_conversation_title(conversation_id: str, current_user: dict = Depends(get_current_user)):
    """Auto-generate a 3-4 word title for a conversation using first prompt content."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT content FROM messages WHERE conversation_id = %s AND role = 'user' ORDER BY created_at ASC LIMIT 1",
                    (conversation_id,)
                )
                row = cur.fetchone()
                if not row or not row[0]:
                    return {"title": "New Discussion"}
                
                first_prompt = row[0].strip().replace("\n", " ")
                # Extract clean 8-10 word concise title (up to 65 chars)
                words = first_prompt.split()
                clean_title = " ".join(words[:10]).upper()
                if len(clean_title) > 65:
                    clean_title = clean_title[:62] + "..."

                cur.execute(
                    "UPDATE conversations SET title = %s, updated_at = NOW() WHERE id = %s",
                    (clean_title, conversation_id)
                )
                conn.commit()
                return {"id": conversation_id, "title": clean_title}
    except Exception as e:
        logger.error(f"Failed to generate conversation title: {e}")
        return {"id": conversation_id, "title": "NEW CONVERSATION"}

from backend.config import GUEST_DAILY_LIMIT, REGISTERED_FREE_DAILY_LIMIT, PRO_DAILY_LIMIT
from backend.rate_limit.limiter import check_and_increment

@app.get("/api/user/usage")
async def get_user_usage_endpoint(current_user: dict = Depends(get_current_user)):
    """Fetch usage quota data for authenticated or guest users."""
    clerk_id = current_user.get("clerk_id", "guest")
    tier = current_user.get("tier", "free")
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    queries_used = 0
    total_lifetime = 0
    
    if clerk_id != "guest":
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT queries_used_today FROM user_limits WHERE clerk_id = %s", (clerk_id,))
                    row = cur.fetchone()
                    if row:
                        queries_used = row[0]
                    cur.execute(
                        """
                        SELECT COUNT(*) FROM messages 
                        WHERE conversation_id IN (
                            SELECT id FROM conversations WHERE clerk_id = %s OR user_id IN (SELECT id FROM users WHERE clerk_id = %s)
                        ) 
                        AND role = 'user'
                        """,
                        (clerk_id, clerk_id),
                    )
                    total_lifetime = cur.fetchone()[0] or 0
        except Exception as e:
            logger.warning(f"Failed to query DB user usage: {e}")
            
    limit = PRO_DAILY_LIMIT if tier == "pro" else (REGISTERED_FREE_DAILY_LIMIT if clerk_id != "guest" else GUEST_DAILY_LIMIT)
    return {
        "queriesUsedToday": queries_used,
        "dailyQueryLimit": limit,
        "totalLifetimeQueries": max(total_lifetime, queries_used),
        "lastResetDate": today_str,
        "isAuthenticated": clerk_id != "guest",
        "plan": "Pro Agent" if tier == "pro" else ("Registered Agent" if clerk_id != "guest" else "Guest Sandbox")
    }

@app.post("/api/user/query-increment")
async def increment_user_query_endpoint(request: Request, current_user: dict = Depends(get_current_user)):
    """Dedicated query increment endpoint for live quota updates."""
    clerk_id = current_user.get("clerk_id", "guest")
    tier = current_user.get("tier", "free")
    client_ip = request.client.host if request.client else "127.0.0.1"

    with get_connection() as conn:
        allowed, remaining, limit = await check_and_increment(conn, clerk_id, user_tier=tier, client_ip=client_ip)

    return {
        "allowed": allowed,
        "remaining": remaining,
        "queriesUsedToday": limit - remaining if limit > 0 else 0,
        "limit": limit
    }

@app.get("/api/ai/analytics")
async def get_analytics_metrics(current_user: dict = Depends(get_current_user)):
    """Fetch user-scoped real-time analytics telemetry strictly from database queries."""
    clerk_id = current_user.get("clerk_id") or "guest"

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # 1. Total conversations & query count for THIS user
                cur.execute("SELECT COUNT(*) FROM conversations WHERE clerk_id = %s", (clerk_id,))
                total_conversations = cur.fetchone()[0] or 0

                cur.execute(
                    """
                    SELECT COUNT(*) FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND role = 'user'
                    """,
                    (clerk_id,),
                )
                total_queries = cur.fetchone()[0] or 0

                cur.execute(
                    """
                    SELECT COUNT(*) FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND role = 'assistant'
                    """,
                    (clerk_id,),
                )
                total_assistant_msgs = cur.fetchone()[0] or 0

                # 2. Persona Disagreement Rate (% where conflict_analysis is populated and contains disagreements)
                cur.execute(
                    """
                    SELECT COUNT(*) FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND role = 'assistant'
                    AND conflict_analysis IS NOT NULL 
                    AND conflict_analysis::text NOT IN ('', '{}', 'null', '[]')
                    """,
                    (clerk_id,),
                )
                disagreement_count = cur.fetchone()[0] or 0
                disagreement_rate = f"{(disagreement_count / total_assistant_msgs * 100):.1f}%" if total_assistant_msgs > 0 else "0.0%"

                # 3. Fallback Events count for THIS user
                cur.execute(
                    """
                    SELECT COUNT(*) FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND was_fallback = true
                    """,
                    (clerk_id,),
                )
                fallback_events_count = cur.fetchone()[0] or 0

                # 4. Average Latency & Sparkline per provider
                cur.execute(
                    """
                    SELECT AVG(latency_ms) FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND latency_ms IS NOT NULL
                    """,
                    (clerk_id,),
                )
                raw_avg_val = cur.fetchone()[0]
                avg_latency_val = float(raw_avg_val) if raw_avg_val is not None else None
                avg_latency_str = f"{(avg_latency_val / 1000.0):.2f}s" if avg_latency_val is not None else "N/A"

                cur.execute(
                    """
                    SELECT provider, AVG(latency_ms) 
                    FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND provider IS NOT NULL AND latency_ms IS NOT NULL
                    GROUP BY provider
                    """,
                    (clerk_id,),
                )
                sparkline_rows = cur.fetchall()
                provider_latency_sparkline = [
                    {
                        "name": r[0].capitalize(),
                        "latency": f"{(float(r[1]) / 1000.0):.2f}s" if r[1] is not None else "0.00s",
                        "ms": int(float(r[1])) if r[1] is not None else 0,
                        "color": "#00FFB3" if "groq" in r[0].lower() else "#00C8FF" if "gemini" in r[0].lower() else "#FF4FD8"
                    }
                    for r in sparkline_rows
                ]

                # 5. Provider Reliability Matrix (from real user messages)
                cur.execute(
                    """
                    SELECT provider, COUNT(*), SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END), AVG(latency_ms)
                    FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND provider IS NOT NULL
                    GROUP BY provider
                    """,
                    (clerk_id,),
                )
                rel_rows = cur.fetchall()
                provider_reliability = []
                for r in rel_rows:
                    total_cnt = float(r[1] or 1)
                    fallback_cnt = float(r[2] or 0)
                    avg_lat = float(r[3]) if r[3] is not None else 0.0
                    provider_reliability.append({
                        "provider": r[0].upper(),
                        "latencyMs": int(avg_lat),
                        "fallbacks": int(fallback_cnt),
                        "successRate": round(100.0 - (fallback_cnt / total_cnt * 100.0), 1),
                        "status": "Optimal" if fallback_cnt == 0 else "Active",
                        "color": "#00FFB3"
                    })

                # 6. 7-Day Volume by Category for THIS user
                cur.execute(
                    """
                    SELECT DATE(created_at) as day_date, category, COUNT(*) 
                    FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND role = 'user' 
                    AND created_at >= NOW() - INTERVAL '7 days'
                    GROUP BY DATE(created_at), category
                    ORDER BY day_date ASC
                    """,
                    (clerk_id,),
                )
                volume_rows = cur.fetchall()
                volume_by_day = {}
                for r in volume_rows:
                    day_str = r[0].strftime("%a") if r[0] else "Day"
                    if day_str not in volume_by_day:
                        volume_by_day[day_str] = {"day": day_str, "queries": 0}
                    volume_by_day[day_str]["queries"] += r[2]
                    cat_key = (r[1] or "general").split("_")[0]
                    volume_by_day[day_str][cat_key] = volume_by_day[day_str].get(cat_key, 0) + r[2]

                volume_data = list(volume_by_day.values())

                # 7. Category Distribution for THIS user
                cur.execute(
                    """
                    SELECT category, COUNT(*) 
                    FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND category IS NOT NULL
                    GROUP BY category
                    ORDER BY COUNT(*) DESC
                    """,
                    (clerk_id,),
                )
                cat_rows = cur.fetchall()
                colors = ["#00FFB3", "#00C8FF", "#FF4FD8", "#F59E0B", "#8B5CF6", "#10B981"]
                category_distribution = [
                    {
                        "name": r[0].replace("_", " ").title(),
                        "value": r[1],
                        "color": colors[i % len(colors)]
                    }
                    for i, r in enumerate(cat_rows)
                ]

                # 8. Persona Model Assignments for THIS user
                cur.execute(
                    """
                    SELECT persona_role, provider, COUNT(*), SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END)
                    FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND persona_role IS NOT NULL
                    GROUP BY persona_role, provider
                    """,
                    (clerk_id,),
                )
                persona_rows = cur.fetchall()
                persona_assignments = [
                    {
                        "persona": r[0].replace("_", " ").title(),
                        "model": r[1].upper() if r[1] else "Auto",
                        "primaryUses": r[2],
                        "fallbacks": int(r[3]) if r[3] else 0,
                        "color": "#00C8FF" if "fact" in r[0].lower() else "#00FFB3" if "opt" in r[0].lower() else "#FF4FD8"
                    }
                    for r in persona_rows
                ]

                # 9. Real Activity Feed for THIS user
                cur.execute(
                    """
                    SELECT c.id, c.title, c.updated_at,
                           (SELECT m.category FROM messages m WHERE m.conversation_id = c.id AND m.category IS NOT NULL LIMIT 1) as cat
                    FROM conversations c
                    WHERE c.clerk_id = %s
                    ORDER BY c.updated_at DESC
                    LIMIT 12
                    """,
                    (clerk_id,),
                )
                recent_convs = cur.fetchall()
                activity_feed = [
                    {
                        "id": r[0],
                        "title": r[1] or "Discussion",
                        "category": (r[3] or "General").replace("_", " ").title(),
                        "timestamp": r[2].strftime("%I:%M:%S %p") if r[2] else "Just now",
                        "status": "Synthesized Verdict"
                    }
                    for r in recent_convs
                ]

                return {
                    "isGuest": False,
                    "hasData": total_conversations > 0 or total_queries > 0,
                    "totalConversations": total_conversations,
                    "totalQueries": total_queries,
                    "disagreementRate": disagreement_rate,
                    "fallbackEventsThisWeek": fallback_events_count,
                    "avgLatency": avg_latency_str,
                    "providerLatencySparkline": provider_latency_sparkline,
                    "providerReliability": provider_reliability,
                    "volumeData": volume_data,
                    "categoryDistribution": category_distribution,
                    "personaAssignments": persona_assignments,
                    "activityFeed": activity_feed
                }
    except Exception as e:
        logger.error(f"Failed to fetch user analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load analytics: {str(e)}"
        )

@app.get("/api/ai/performance")
async def get_agent_performance_metrics(current_user: dict = Depends(get_current_user)):
    """Fetch user-scoped real model performance telemetry strictly from database queries."""
    clerk_id = current_user.get("clerk_id") or "guest"

    # Static Specs Reference Metadata for All Supported Providers
    MODEL_SPECS = [
        {
            "id": "groq",
            "name": "Groq LPU (Llama 3.3 70B)",
            "provider": "Groq LPU Engine",
            "iconName": "Zap",
            "color": "#00FFB3",
            "contextWindow": "128,000 tokens",
            "description": "Ultra-fast inference via Groq LPUs. Specializes in adversarial debate evaluation."
        },
        {
            "id": "gemini",
            "name": "Google Gemini (1.5 / 2.0 Flash)",
            "provider": "Google AI Studio",
            "iconName": "Sparkles",
            "color": "#00C8FF",
            "contextWindow": "1,000,000 tokens",
            "description": "Massive 1M token context window for multi-perspective synthesis & reasoning."
        },
        {
            "id": "perplexity",
            "name": "Perplexity Sonar Online",
            "provider": "Perplexity AI",
            "iconName": "Target",
            "color": "#10B981",
            "contextWindow": "32,000 tokens",
            "description": "Real-time web search grounding engine. Verifies claims against live web search indexes."
        },
        {
            "id": "nvidia",
            "name": "NVIDIA NIM (Qwen & Nemotron)",
            "provider": "NVIDIA NIM Infrastructure",
            "iconName": "Layers",
            "color": "#F59E0B",
            "contextWindow": "64,000 tokens",
            "description": "High-performance enterprise open models (Qwen 2.5 Coder & Nemotron 4)."
        },
        {
            "id": "openai",
            "name": "OpenAI GPT-4o Mini",
            "provider": "OpenAI API",
            "iconName": "Bot",
            "color": "#8B5CF6",
            "contextWindow": "128,000 tokens",
            "description": "Balanced reasoning engine. Well-suited for code architecture and API evaluation."
        },
        {
            "id": "anthropic",
            "name": "Anthropic Claude 3.5 Sonnet",
            "provider": "Anthropic API",
            "iconName": "Brain",
            "color": "#FF4FD8",
            "contextWindow": "200,000 tokens",
            "description": "Industry-leading reasoning accuracy and edge-case risk detection."
        }
    ]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # Query user-scoped metrics per provider/agent
                cur.execute(
                    """
                    SELECT 
                        LOWER(COALESCE(provider, agent_name)) as provider_key,
                        COUNT(*) as call_count,
                        AVG(latency_ms) as avg_latency,
                        MAX(created_at) as last_active,
                        SUM(CASE WHEN was_fallback THEN 1 ELSE 0 END) as fallback_count
                    FROM messages 
                    WHERE conversation_id IN (SELECT id FROM conversations WHERE clerk_id = %s)
                    AND role = 'assistant'
                    AND (provider IS NOT NULL OR agent_name IS NOT NULL)
                    GROUP BY LOWER(COALESCE(provider, agent_name))
                    """,
                    (clerk_id,),
                )
                rows = cur.fetchall()

                # Build dictionary of real DB metrics
                db_stats = {}
                total_user_assistant_msgs = 0
                for r in rows:
                    p_key = r[0].lower()
                    cnt = r[1] or 0
                    avg_lat = float(r[2]) if r[2] is not None else None
                    max_dt = r[3]
                    fb_cnt = int(r[4]) if r[4] is not None else 0
                    
                    total_user_assistant_msgs += cnt

                    # Match p_key to canonical spec ID
                    matched_id = "groq" if "groq" in p_key or "llama" in p_key else \
                                 "gemini" if "gemini" in p_key or "google" in p_key else \
                                 "perplexity" if "perplexity" in p_key or "sonar" in p_key else \
                                 "nvidia" if "nvidia" in p_key or "qwen" in p_key or "nemotron" in p_key else \
                                 "openai" if "openai" in p_key or "gpt" in p_key else \
                                 "anthropic" if "anthropic" in p_key or "claude" in p_key else p_key

                    db_stats[matched_id] = {
                        "call_count": cnt,
                        "avg_latency": avg_lat,
                        "last_active": max_dt,
                        "fallback_count": fb_cnt
                    }

                # Construct real benchmarks response
                benchmarks = []
                sorted_spec_ids = sorted(
                    [spec["id"] for spec in MODEL_SPECS],
                    key=lambda sid: db_stats.get(sid, {}).get("call_count", 0),
                    reverse=True
                )

                for spec in MODEL_SPECS:
                    sid = spec["id"]
                    stats = db_stats.get(sid)

                    if stats and stats["call_count"] > 0:
                        has_data = True
                        calls = stats["call_count"]
                        avg_lat_ms = stats["avg_latency"]
                        latency_str = f"{(avg_lat_ms / 1000.0):.2f}s" if avg_lat_ms else "0.00s"
                        win_rate = round((calls / total_user_assistant_msgs * 100.0), 1) if total_user_assistant_msgs > 0 else 0.0
                        
                        last_active_dt = stats["last_active"]
                        if last_active_dt:
                            # Handle timezone conversion for comparison
                            if last_active_dt.tzinfo is None:
                                now_dt = datetime.now()
                            else:
                                now_dt = datetime.now(timezone.utc)
                            diff_sec = (now_dt - last_active_dt).total_seconds()
                            if diff_sec < 60:
                                last_active_str = "Just now"
                            elif diff_sec < 3600:
                                last_active_str = f"{int(diff_sec // 60)}m ago"
                            elif diff_sec < 86400:
                                last_active_str = f"{int(diff_sec // 3600)}h ago"
                            else:
                                last_active_str = f"{int(diff_sec // 86400)}d ago"
                        else:
                            last_active_str = "Recently"

                        status = "Optimal" if stats["fallback_count"] == 0 else "Active"
                        rank = sorted_spec_ids.index(sid) + 1 if calls > 0 else None
                    else:
                        has_data = False
                        calls = 0
                        latency_str = "N/A"
                        avg_lat_ms = 0
                        win_rate = 0.0
                        last_active_str = None
                        status = "Standby"
                        rank = None

                    benchmarks.append({
                        "id": sid,
                        "name": spec["name"],
                        "provider": spec["provider"],
                        "iconName": spec["iconName"],
                        "color": spec["color"],
                        "hasData": has_data,
                        "totalCalls": calls,
                        "latency": latency_str,
                        "latencyMs": int(avg_lat_ms) if avg_lat_ms else 0,
                        "winRate": win_rate,
                        "lastActive": last_active_str,
                        "status": status,
                        "rank": rank,
                        "contextWindow": spec["contextWindow"],
                        "description": spec["description"]
                    })

                return {
                    "isGuest": clerk_id == "guest",
                    "hasData": total_user_assistant_msgs > 0,
                    "totalCalls": total_user_assistant_msgs,
                    "benchmarks": benchmarks
                }
    except Exception as e:
        logger.error(f"Failed to fetch agent performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load performance metrics: {str(e)}"
        )

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await handle_chat_websocket(websocket)
