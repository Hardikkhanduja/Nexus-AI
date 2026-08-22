# Getting Started: Nexus AI Platform

Welcome to **Nexus AI**, a full-stack AI chat platform that unifies multiple AI providers in a single, intuitive interface.

This guide will help you set up the complete development environment and run all three services locally.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Installation](#installation)
6. [Running the Application](#running-the-application)
7. [First Steps: Your First API Call](#first-steps-your-first-api-call)
8. [Project Structure](#project-structure)
9. [Next Steps](#next-steps)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Nexus AI** is a conversational platform that allows users to:

- 💬 Chat with multiple AI providers (OpenAI, Anthropic, Google Gemini, Groq) through a unified interface
- 💾 Persist conversations and message history in PostgreSQL
- ⚡ Stream real-time AI responses via WebSocket
- 👤 Manage user profiles, authentication, and usage quotas
- 🔒 Enforce rate-limited access based on authentication status (5 queries/day for guests, 30 queries/day for registered users)

The platform is built as a **monorepo** with three interconnected services:

| Service | Port | Role | Stack |
|---------|------|------|-------|
| **Express API Server** | 3001 | REST API for auth, user profile, preferences, limits | Node.js + Express + TypeScript |
| **FastAPI Backend** | 8000 | WebSocket streaming, AI orchestration, database | Python + FastAPI + Async |
| **React Frontend** | 5173 | Chat UI and user interaction | React 19 + Vite + TypeScript + Tailwind |

---

## Tech Stack

### Frontend (React 19)
- **Framework**: React 19, Vite (dev server), TypeScript 5.9.3
- **UI Components**: Radix UI (26 component packages)
- **Styling**: Tailwind CSS 4.3.0
- **State**: React Context + React Query (TanStack)
- **Routing**: Wouter (lightweight client-side router)
- **Animations**: Framer Motion
- **Toast Notifications**: Sonner
- **Form Handling**: React Hook Form

### Express API Server (Node.js)
- **Framework**: Express 5.2.1
- **Runtime**: Node.js with TypeScript
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcrypt (6.0.0, 12 rounds)
- **Database ORM**: Drizzle ORM (type-safe SQL)
- **Validation**: Zod (runtime schema validation)
- **Logging**: Pino 9.14.0 (structured JSON logs)
- **Build**: esbuild (ES module bundling)
- **Package Manager**: pnpm 10.x (monorepo)

### FastAPI Backend (Python)
- **Framework**: FastAPI 0.115.12 (async)
- **ASGI Server**: Uvicorn 0.34.3
- **WebSocket**: websockets 15.0.1
- **AI SDKs**: openai 1.82.0, anthropic 0.52.0
- **Database**: psycopg2-binary 2.9.10 (PostgreSQL driver)
- **Security**: PyJWT 2.10.1, bleach 6.2.0 (HTML sanitization)
- **Configuration**: python-dotenv 1.1.0
- **HTTP Client**: httpx 0.25.1 (async requests)

### Database
- **Engine**: PostgreSQL 14+
- **ORM**: Drizzle ORM (Express), raw psycopg2 (Python)
- **Schema Tables**: users, conversations, messages, user_limits, user_preferences, user_memory

---

## Prerequisites

Before starting, ensure you have the following installed:

### System Requirements
- **Node.js** 18+ (verify: `node --version`)
- **Python** 3.11+ (verify: `python --version`)
- **PostgreSQL** 14+ (verify: `psql --version`)
- **pnpm** 10.x (verify: `pnpm --version`)
  - Install via: `npm install -g pnpm@10`

### Verify Installation

```bash
node --version        # Should be v18+
python --version      # Should be 3.11+
psql --version        # Should be 14+
pnpm --version        # Should be 10.x
```

---

## Environment Setup

### 1. Clone the Repository

```bash
cd ~/Desktop
git clone <repository-url>
cd "Nexu-Frontend (2)/Nexu-Frontend"
```

### 2. Create `.env` File

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nexus_ai

# Express API Server (Port 3001)
NODE_ENV=development
JWT_SECRET=your-secret-key-here-minimum-32-characters-long
EXPRESS_PORT=3001
FRONTEND_URL=http://localhost:5173

# FastAPI Backend (Port 8000)
FASTAPI_PORT=8000
LOG_LEVEL=info

# Rate Limiting
GUEST_DAILY_LIMIT=5
REGISTERED_DAILY_LIMIT=30

# AI Provider API Keys (optional - features disabled if not set)
OPENAI_API_KEY=sk-... (optional)
ANTHROPIC_API_KEY=sk-ant-... (optional)
GROQ_API_KEY=gsk-... (optional)
OPENROUTER_API_KEY=sk-or-... (optional)

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 3. Set Up PostgreSQL Database

#### On Windows (using PostgreSQL installed)

```powershell
# Connect to PostgreSQL
psql -U postgres

# Then execute these SQL commands:
CREATE DATABASE nexus_ai;
\c nexus_ai
\q
```

#### Or using Docker (if Docker is installed)

```bash
docker run --name postgres-nexus \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nexus_ai \
  -p 5432:5432 \
  -d postgres:14
```

### 4. Verify Database Connection

```bash
psql -U postgres -d nexus_ai -c "SELECT 1"
# Should return: 1
```

---

## Installation

### 1. Install Frontend & API Server Dependencies

```bash
# Install all monorepo packages (Node.js dependencies)
pnpm install

# This installs dependencies for:
# - Root workspace
# - artifacts/nexus-ai (frontend)
# - artifacts/api-server (Express API)
# - lib/* (shared libraries)
```

### 2. Install Python Dependencies

```bash
# Navigate to backend directory
cd backend

# Create Python virtual environment (recommended)
python -m venv .venv

# Activate virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1

# Or on Windows CMD:
.\.venv\Scripts\activate.bat

# Or on Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep -E "fastapi|uvicorn|psycopg2"
```

### 3. Build TypeScript Projects

```bash
# Return to project root
cd ..

# Typecheck and build all packages
pnpm build

# This runs: typecheck + artifact builds + lib builds
```

### 4. Run Database Migrations

```bash
# From project root
cd lib/db

# Push schema to PostgreSQL
pnpm drizzle-kit push

# This creates all required tables (users, conversations, messages, etc.)
```

---

## Running the Application

You'll need to run **three separate services** in three different terminal windows. Each must be kept running for the system to work.

### Terminal 1: Express API Server (Port 3001)

```bash
# From project root
cd artifacts/api-server

# Development mode (rebuilds and restarts on changes)
pnpm dev

# Or build and start separately:
pnpm build
pnpm start

# Expected output:
# [INFO] Server listening on http://localhost:3001
# [INFO] Database connected
```

### Terminal 2: FastAPI Backend (Port 8000)

```bash
# From project root, activate Python venv first
cd backend

# Activate virtual environment (if not already active)
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Linux/macOS: source .venv/bin/activate

# Start FastAPI server
python main.py

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Starting up FastAPI application...
```

### Terminal 3: React Frontend (Port 5173)

```bash
# From project root
cd artifacts/nexus-ai

# Set environment variables (Windows PowerShell)
$env:PORT="5173"
$env:BASE_PATH="/"

# Or (Linux/macOS Bash)
export PORT=5173
export BASE_PATH="/"

# Start dev server
pnpm dev

# Expected output:
# VITE v... ready in ... ms
# ➜  Local:   http://localhost:5173/
# ➜  Press q to quit
```

### Verify All Services Are Running

Open a fourth terminal and run health checks:

```bash
# Express API Server
curl http://localhost:3001/health
# Response: {"status":"ok"}

# FastAPI Backend
curl http://localhost:8000/health
# Response: {"status":"ok"}

# Frontend (opens in browser)
open http://localhost:5173
# Or:
start http://localhost:5173
```

---

## First Steps: Your First API Call

### Step 1: Register a New User

```bash
# POST /auth/register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "name": "Test User"
  }'

# Response (201 Created):
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "550e8400-e29b-41d4-a716-446655440000",
#     "email": "test@example.com",
#     "name": "Test User",
#     "provider": "email",
#     "emailVerified": false
#   }
# }
```

Save the `token` value from the response.

### Step 2: Connect WebSocket and Send a Message

```bash
# Install wscat if you don't have it
npm install -g wscat

# Connect to WebSocket (replace TOKEN with the JWT from Step 1)
wscat -c "ws://localhost:8000/ws/chat?token=YOUR_JWT_TOKEN"

# Once connected, send a JSON message:
# {"type": "user_message", "content": "What is React?", "provider": "openai"}

# Server responds with streaming tokens:
# {"type":"status","message":"Checking usage limit..."}
# data: React
# data: is
# data: a
# data: [DONE]
```

### Step 3: Verify User Profile

```bash
# GET /user/profile (requires auth)
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
# {
#   "id": "550e8400-e29b-41d4-a716-446655440000",
#   "email": "test@example.com",
#   "name": "Test User",
#   "totalLifetimeQueries": 1,
#   "emailVerified": false
# }
```

### Step 4: Check Usage Stats

```bash
# GET /usage/stats
curl -X GET http://localhost:3001/api/usage/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Response:
# {
#   "queriesUsedToday": 1,
#   "dailyLimit": 30,
#   "remainingQueries": 29,
#   "lastResetDate": "2026-08-18"
# }
```

---

## Project Structure

```
Nexu-Frontend/
├── artifacts/                          # Monorepo workspaces
│   ├── nexus-ai/                       # Frontend (React 19 + Vite)
│   │   ├── src/
│   │   │   ├── App.tsx                 # Root component + routing
│   │   │   ├── contexts/               # AuthContext, providers
│   │   │   ├── components/             # Radix UI + custom components
│   │   │   ├── pages/                  # Page components (Login, Chat, etc.)
│   │   │   ├── hooks/                  # Custom React hooks
│   │   │   └── lib/                    # Utilities
│   │   ├── vite.config.ts              # Vite config + proxies to backends
│   │   └── package.json
│   │
│   ├── api-server/                     # Express API (Node.js + TypeScript)
│   │   ├── src/
│   │   │   ├── app.ts                  # Express app factory
│   │   │   ├── index.ts                # Server entry point
│   │   │   ├── routes/                 # REST endpoints (auth, user, etc.)
│   │   │   │   ├── auth.routes.ts      # POST /register, /login
│   │   │   │   ├── user.routes.ts      # GET /profile, PUT /profile
│   │   │   │   └── health.ts           # GET /health
│   │   │   ├── middlewares/            # Auth, rate limiting, CORS
│   │   │   └── lib/                    # Utilities (JWT, bcrypt, logger)
│   │   ├── build.mjs                   # esbuild configuration
│   │   └── package.json
│   │
│   └── mockup-sandbox/                 # Component preview environment
│       └── (not used in production)
│
├── lib/                                # Shared packages (monorepo)
│   ├── db/                             # Database schema & ORM
│   │   ├── src/schema/
│   │   │   ├── users.ts                # users table definition
│   │   │   ├── conversations.ts        # conversations table
│   │   │   ├── messages.ts             # messages table
│   │   │   ├── user_limits.ts          # rate limiting table
│   │   │   ├── user_preferences.ts     # preferences table
│   │   │   └── user_memory.ts          # context storage table
│   │   ├── drizzle.config.ts           # Drizzle ORM config
│   │   └── package.json
│   │
│   ├── api-spec/                       # OpenAPI specification
│   │   ├── openapi.yaml                # API contract (incomplete)
│   │   ├── orval.config.ts             # Code generation config
│   │   └── package.json
│   │
│   ├── api-zod/                        # Zod validation schemas
│   │   ├── src/
│   │   │   ├── auth.ts                 # RegisterRequest, LoginRequest
│   │   │   └── index.ts                # All schemas
│   │   └── package.json
│   │
│   └── api-client-react/               # Generated React Query client
│       ├── src/
│       │   ├── custom-fetch.ts         # JWT token injection middleware
│       │   └── index.ts                # Generated React Query hooks
│       └── package.json
│
├── backend/                            # FastAPI Backend (Python)
│   ├── main.py                         # FastAPI app + endpoints
│   ├── db.py                           # PostgreSQL connection pooling
│   ├── websocket/
│   │   └── handler.py                  # WebSocket connection handler
│   ├── agents/
│   │   ├── providers/
│   │   │   ├── base.py                 # Abstract BaseProvider class
│   │   │   ├── openai_provider.py      # OpenAI integration (stub)
│   │   │   ├── anthropic_provider.py   # Anthropic Claude (stub)
│   │   │   ├── gemini_provider.py      # Google Gemini (partial)
│   │   │   ├── groq_provider.py        # Groq API (stub)
│   │   │   └── __init__.py             # Provider registry
│   │   └── __init__.py
│   ├── security/
│   │   └── sanitizer.py                # Prompt injection detection
│   ├── rate_limit/
│   │   └── limiter.py                  # Daily rate limiting logic
│   ├── requirements.txt                # Python dependencies
│   └── tests/                          # pytest test files
│
├── docs/                               # Documentation (this folder)
│   ├── GETTING_STARTED.md              # ← You are here
│   ├── ARCHITECTURE.md                 # System design & data flow
│   ├── BACKEND_INTEGRATION.md          # FastAPI & AI providers
│   ├── API_REFERENCE.md                # Complete API documentation
│   └── KNOWN_ISSUES.md                 # Issues & blockers
│
├── pnpm-workspace.yaml                 # Monorepo configuration
├── tsconfig.base.json                  # Shared TypeScript config
├── tsconfig.json                       # Root TypeScript project references
├── package.json                        # Root workspace package.json
├── .env                                # Environment variables (create this)
├── .env.example                        # Template (coming soon)
└── README.md                           # Project overview
```

---

## Next Steps

Now that you have the application running, here's what to explore:

### 1. **Understand the System Architecture**
   - Read [ARCHITECTURE.md](./ARCHITECTURE.md) to understand how frontend, Express API, and FastAPI communicate
   - Learn the database schema and data flow
   - Review authentication and WebSocket protocol

### 2. **Deep Dive into Backend Implementation**
   - Read [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for WebSocket details
   - Understand AI provider architecture
   - Review rate limiting and input sanitization logic

### 3. **Learn the API Contract**
   - Read [API_REFERENCE.md](./API_REFERENCE.md) for complete endpoint documentation
   - Try the cURL examples provided
   - Test each endpoint with different payloads

### 4. **Check Known Issues**
   - Read [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) to understand limitations
   - See which AI providers are not yet implemented
   - Identify areas that need contribution

### 5. **Explore the Code**
   - Start with [artifacts/nexus-ai/src/App.tsx](../artifacts/nexus-ai/src/App.tsx) to understand routing
   - Review [artifacts/api-server/src/routes/auth.routes.ts](../artifacts/api-server/src/routes/auth.routes.ts) for authentication
   - Study [backend/websocket/handler.py](../backend/websocket/handler.py) for real-time streaming

---

## Troubleshooting

### Issue: `pnpm install` fails with permission error

**Solution**: Make sure you have write permissions in the project directory
```bash
# On Windows
# Run PowerShell as Administrator
# Or check folder permissions
```

### Issue: PostgreSQL connection refused

**Solution**: Verify PostgreSQL is running and DATABASE_URL is correct
```bash
# Test connection
psql -U postgres -d nexus_ai -c "SELECT 1"

# If failed, ensure PostgreSQL service is running
# Windows: Services > PostgreSQL Server > right-click > Start
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
```

### Issue: `jwt.decode()` fails with "invalid token"

**Solution**: JWT tokens expire after 24 hours. Generate a new token by logging in again.

### Issue: WebSocket connection closes immediately with code 4008

**Solution**: The JWT token is invalid or expired. Register/login again and use the new token.

### Issue: FastAPI shows `ModuleNotFoundError`

**Solution**: Ensure Python virtual environment is activated:
```bash
# Windows PowerShell:
cd backend
.\.venv\Scripts\Activate.ps1

# Or Windows CMD:
.\.venv\Scripts\activate.bat

# Linux/macOS:
cd backend
source .venv/bin/activate
```

### Issue: Rate limit errors on every WebSocket message

**Solution**: Database might be unavailable. Check PostgreSQL:
```bash
# Verify database is running
psql -U postgres -c "SELECT 1"

# Check connection string in .env
echo $DATABASE_URL
```

### Issue: `pnpm dev` exits immediately in api-server

**Solution**: Check for port conflicts. Express server needs port 3001 free:
```bash
# Windows PowerShell - check if port 3001 is in use
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001

# If in use, change EXPRESS_PORT in .env or kill the process
```

### Issue: Frontend won't connect to Express API

**Solution**: Check Vite proxy configuration in vite.config.ts and FRONTEND_URL in .env:
```bash
# Verify Express is running on correct port
curl http://localhost:3001/health

# Check .env has correct FRONTEND_URL
grep FRONTEND_URL .env
```

---

## Getting Help

1. **Check [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)** - Your issue might already be documented
2. **Review [ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the system before debugging
3. **Check database** - Most issues relate to PostgreSQL connection or schema
4. **Review logs** - Express logs are in Pino JSON format, FastAPI logs are in console
5. **Verify .env file** - Missing environment variables cause silent failures

---

## Quick Reference: Common Commands

```bash
# Install all dependencies
pnpm install
pip install -r backend/requirements.txt

# Run database migrations
cd lib/db && pnpm drizzle-kit push

# Start all three services (in separate terminals)
cd artifacts/api-server && pnpm dev        # Terminal 1
cd backend && python main.py               # Terminal 2
cd artifacts/nexus-ai && pnpm dev          # Terminal 3

# Health checks
curl http://localhost:3001/health
curl http://localhost:8000/health
open http://localhost:5173

# Register and login
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123!","name":"Test"}'

# Test WebSocket (requires wscat)
wscat -c "ws://localhost:8000/ws/chat?token=YOUR_JWT_TOKEN"
```

---

**Next Documentation**: [→ ARCHITECTURE.md](./ARCHITECTURE.md) for system design and data flow

