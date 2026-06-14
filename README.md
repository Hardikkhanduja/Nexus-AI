# NexusAI

Nexus-style AI chat frontend + lightweight Python backend for streaming AI responses, conversation persistence, and rate limiting. This repo contains a Vite + React frontend (in `artifacts/nexus-ai`) and a FastAPI backend (in `backend`) that connects to a PostgreSQL database — Supabase is the recommended hosting option.

**What it does**
- Frontend: React app with chat UI, WebSocket client for streaming replies, conversation UI and user flows.
- Backend: FastAPI WebSocket endpoint that streams agent responses (OpenAI / Anthropic / Gemini providers), persists conversations/messages, and enforces per-user rate limits via `user_limits` table.

**Repository layout (important parts)**
- `artifacts/nexus-ai/` — React + Vite frontend
- `backend/` — FastAPI backend, DB helper, providers, rate limiter
- `lib/db/src/schema/` — Drizzle schema definitions (users, conversations, messages, user_limits)

---

## Prerequisites
- Node.js (18+), `pnpm` preferred (or `npm`) for frontend
- Python 3.11+ and `pip` for backend
- Supabase project (Postgres DB) or any PostgreSQL server
- Docker (optional, for local Postgres)

---

## Environment
Copy `.env.example` to `.env` and fill values.
Key variables used by the backend (put in `.env`):

```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres?sslmode=require
JWT_SECRET=... (dev default is in repo)
JWT_REFRESH_SECRET=...
FRONTEND_URL=http://localhost:5173
PORT=3000
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_URL=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-default
```

Notes:
- For Supabase, use the DB connection string from Project Settings → Database → Connection string. Ensure `?sslmode=require` is present (Supabase requires TLS).
- Do NOT commit `.env` to source control. `.gitignore` includes `.env` by default.

---

## Supabase setup (tables required)
Open the SQL editor in Supabase and run the following SQL (creates the schema the backend expects):

```sql
-- users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  name varchar(255),
  avatar_url text,
  provider varchar(50) NOT NULL DEFAULT 'email',
  password_hash text,
  email_verified boolean NOT NULL DEFAULT false,
  email_verification_token text,
  total_lifetime_queries integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

-- conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title varchar(500) NOT NULL DEFAULT 'New Conversation',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role varchar(50) NOT NULL,
  content text NOT NULL,
  agent_name varchar(100) NOT NULL DEFAULT 'GPT',
  created_at timestamp NOT NULL DEFAULT now()
);

-- user_limits
CREATE TABLE IF NOT EXISTS user_limits (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  queries_used_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT now()
);
```

If your Supabase project lacks the `pgcrypto` or `pgjwt` extensions used by some setups, follow Supabase docs to enable required extensions. The schema above uses `gen_random_uuid()` which requires `pgcrypto` — if unavailable, use `uuid_generate_v4()` or set UUIDs from the app.

---

## Backend: install & run
From repository root:

```bash
# create venv and install
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# or PowerShell (cmd): .\.venv\Scripts\activate
python -m pip install -r backend/requirements.txt

# start backend (development)
cd backend
uvicorn backend.main:app --reload --host 0.0.0.0 --port 3000
```

Health endpoints:
- General: `GET /health` → {"status":"ok"}
- DB check: `GET /api/health/db` → {"status":"ok","database":"connected"} if DB reachable

---

## Frontend: install & run
```
cd artifacts/nexus-ai
pnpm install
# or: npm install
# set env for Vite (example, on PowerShell)
$Env:PORT=5173; $Env:BASE_PATH='/' ; pnpm dev
```
If port 5173 is in use, change `PORT` or stop the other process.

---

## Common issues & debugging

- "Database error checking limits." (WebSocket shows this)
  - Cause: backend cannot connect to Postgres or an SQL operation failed during rate-limit check.
  - Steps:
    1. Ensure `.env` `DATABASE_URL` is correct and contains `?sslmode=require` for Supabase.
    2. From `backend/` run:
    ```powershell
    python -c "from dotenv import load_dotenv; import os; import psycopg2; load_dotenv(); print(os.environ.get('DATABASE_URL')); conn=psycopg2.connect(os.environ['DATABASE_URL']); print('connected'); conn.close()"
    ```
    3. Check Supabase SQL editor for the required tables (`users`, `conversations`, `messages`, `user_limits`).
    4. Inspect backend logs — startup now fails fast if DB init fails; check `backend/main.py` logs.

- WebSocket connection fails or streaming stalls
  - Ensure backend is running and WebSocket endpoint is reachable: `ws://localhost:3000/ws/chat` (or `wss` in production)
  - Inspect browser console for network errors, and backend logs for stack traces when streaming errors occur.

- Port conflict when starting frontend
  - If Vite reports port busy, change `PORT` env var before `pnpm dev` or kill the process holding that port.

- Provider API errors (OpenAI / Anthropic / Gemini)
  - Confirm API keys are set in `.env`. Check provider-specific logs in `backend/` — provider modules will log errors.

- `psycopg2` or dependency issues
  - If pip install fails on Windows, try `pip install psycopg2-binary` (already in `requirements.txt`) or use the prebuilt wheel.

---

## Useful commands summary

```powershell
# Backend
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn backend.main:app --reload --port 3000

# Frontend
cd artifacts/nexus-ai
pnpm install
$Env:PORT=5173; $Env:BASE_PATH='/'; pnpm dev

# Quick DB check
python -c "from dotenv import load_dotenv; import os, psycopg2; load_dotenv(); conn=psycopg2.connect(os.environ['DATABASE_URL']); cur=conn.cursor(); cur.execute('select 1'); print(cur.fetchone()); conn.close()"
```

---

## Next steps I can help with
- Run the DB connectivity test from the workspace now and list tables.
- Add Supabase Auth integration so JWT from Supabase can be used instead of the current `JWT_SECRET`.
- Create a GitHub Action to run backend tests and linting on push.

---

File reference: see `backend/main.py` for DB health endpoint and `lib/db/src/schema` for schema definitions.
