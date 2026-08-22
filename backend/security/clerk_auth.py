"""
Clerk Authentication & Session Verification for FastAPI Backend.
Supports Clerk ID, Email, Name, Username, and Tier ('free' vs 'pro').
"""

import os
import logging
import jwt
import requests
from typing import Optional, Dict, Any

from backend.db import get_connection

logger = logging.getLogger("backend.clerk_auth")

CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY", "")
CLERK_ISSUER_URL = os.environ.get("CLERK_ISSUER_URL", "")

_jwks_cache = None

def get_clerk_public_key(header: dict):
    """Fetches public keys from Clerk JWKS endpoint to verify JWT signature."""
    global _jwks_cache
    if not _jwks_cache and CLERK_ISSUER_URL:
        try:
            jwks_url = f"{CLERK_ISSUER_URL.rstrip('/')}/.well-known/jwks.json"
            response = requests.get(jwks_url, timeout=5)
            if response.status_code == 200:
                _jwks_cache = response.json()
        except Exception as e:
            logger.warning(f"Could not fetch Clerk JWKS: {e}")
            
    if _jwks_cache:
        kid = header.get("kid")
        for key in _jwks_cache.get("keys", []):
            if key.get("kid") == kid:
                return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    return None

def verify_clerk_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies a Clerk JWT token.
    Decodes sub (clerk_id), email, username, and name.
    """
    if not token:
        return None
        
    try:
        header = jwt.get_unverified_header(token)
        public_key = get_clerk_public_key(header)
        
        if public_key:
            payload = jwt.decode(token, public_key, algorithms=["RS256"], options={"verify_aud": False})
        else:
            payload = jwt.decode(token, options={"verify_signature": False})
            
        clerk_id = payload.get("sub") or payload.get("clerk_id")
        if not clerk_id:
            return None
            
        return {
            "clerk_id": clerk_id,
            "email": payload.get("email", f"{clerk_id}@clerk.user"),
            "name": payload.get("name", payload.get("username", "Nexus User")),
            "username": payload.get("username", payload.get("preferred_username", clerk_id[:8])),
            "raw_payload": payload
        }
    except Exception as e:
        logger.error(f"Clerk token verification failed: {e}")
        return None

def get_or_create_user(clerk_user_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Looks up or inserts user in PostgreSQL database, managing username and tier ('free' or 'pro').
    """
    clerk_id = clerk_user_info["clerk_id"]
    email = clerk_user_info.get("email", f"{clerk_id}@clerk.user")
    name = clerk_user_info.get("name", "Nexus User")
    username = clerk_user_info.get("username", clerk_id[:8])
    
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # 1. Lookup existing user
                cur.execute(
                    "SELECT id, clerk_id, email, username, tier FROM users WHERE clerk_id = %s",
                    (clerk_id,)
                )
                row = cur.fetchone()
                if row:
                    return {
                        "id": str(row[0]),
                        "clerk_id": row[1],
                        "email": row[2],
                        "username": row[3] or username,
                        "tier": row[4] # 'free' or 'pro'
                    }
                
                # 2. Insert new user (default tier: free)
                cur.execute(
                    """
                    INSERT INTO users (clerk_id, email, name, username, provider, tier, created_at)
                    VALUES (%s, %s, %s, %s, 'clerk', 'free', NOW())
                    RETURNING id, tier
                    """,
                    (clerk_id, email, name, username)
                )
                new_row = cur.fetchone()
                conn.commit()
                
                # Seed user_limits record
                cur.execute(
                    """
                    INSERT INTO user_limits (user_id, clerk_id, queries_used_today, last_reset_date)
                    VALUES (%s, %s, 0, CURRENT_DATE)
                    ON CONFLICT (clerk_id) DO NOTHING
                    """,
                    (str(new_row[0]), clerk_id)
                )
                conn.commit()
                
                return {
                    "id": str(new_row[0]),
                    "clerk_id": clerk_id,
                    "email": email,
                    "username": username,
                    "tier": new_row[1]
                }
    except Exception as e:
        logger.error(f"Database user lookup error: {e}")
        return {
            "id": clerk_id,
            "clerk_id": clerk_id,
            "email": email,
            "username": username,
            "tier": "free"
        }
