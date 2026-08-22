<div align="center">

  # ⚡ NEXUS AI ⚡
  ### Multi-Agent Consensus & Adversarial Reasoning Platform

  [![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
  [![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
  [![Vite](https://img.shields.io/badge/Vite-7.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
  [![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://render.com)
  [![Zerops](https://img.shields.io/badge/Deploy-Zerops-00C8FF?style=for-the-badge&logo=zerops&logoColor=black)](https://zerops.io)

  <p align="center">
    <strong>An advanced multi-LLM orchestration platform featuring parallel agent debates, conflict detection, consensus synthesis, and real-time streaming telemetry.</strong>
  </p>

  [Live Demo](https://nexus-ai-frontend.onrender.com) • [Report Issue](https://github.com/Hardikkhanduja/Nexus-AI/issues) • [API Documentation](#-api-reference)

</div>

---

## 🌟 Overview

**Nexus AI** is a state-of-the-art Multi-Agent Intelligence Engine designed to eliminate AI hallucination, single-model bias, and tunnel vision. Instead of relying on a single language model, Nexus AI deploys specialized councils of AI personas (e.g. *Optimist*, *Skeptic*, *Domain Specialist*, and *Synthesizer*) that debate complex queries concurrently, analyze points of agreement vs. disagreement, and synthesize a single, highly refined consensus verdict.

```mermaid
graph TD
    A["👤 User Input Query"] --> B["⚡ FastAPI Multi-Agent Orchestrator"]
    B --> C1["🧠 Groq LPU (Llama 3.3 70B)"]
    B --> C2["✨ Google Gemini 2.0 Flash"]
    B --> C3["🎯 Perplexity Sonar (Web Grounding)"]
    B --> C4["⚡ NVIDIA NIM / OpenAI / Claude"]
    
    C1 --> D["⚔️ Adversarial Stance Extraction"]
    C2 --> D
    C3 --> D
    C4 --> D
    
    D --> E["📊 Conflict & Consensus Analyzer"]
    E --> F["🏆 Final Synthesized Verdict Stream"]
    F --> G["💬 React Cyberpunk UI (WebSockets)"]
```

---

## ✨ Key Features

### 🧠 Adversarial Multi-Agent Debates
- **Parallel Multi-Model Execution**: Queries are evaluated concurrently across **Groq LPU**, **Google Gemini 2.0 Flash**, **Perplexity Sonar**, **NVIDIA NIM**, **OpenAI GPT-4o**, and **Anthropic Claude 3.5 Sonnet**.
- **Role-Based Personas**: Dynamically assigns roles (Optimist, Skeptic, Security Auditor, Systems Architect) based on query domain classification (Coding, Architecture, Finance, Science, Writing).
- **Conflict Analysis & Verdict Synthesis**: Automatically extracts key points of agreement, points of disagreement, and produces a balanced summary.

### ⚡ Real-Time WebSockets Engine
- **Sub-Second Token Streaming**: Real-time WebSocket connection (`/ws/chat`) streams individual agent responses and synthesis chunks directly to the UI.
- **Fail-Safe Fallbacks**: Built-in automatic provider routing. If a primary API endpoint experiences rate-limits or downtime, requests seamlessly failover to alternative high-speed models without interrupting the session.

### 🛡️ Enterprise Security & Safe Auth
- **Clerk SSO & Local JWT Support**: Dual support for Clerk authentication and local JWT tokens.
- **Safe Fallback Wrappers**: Custom `SafeSignedIn`, `SafeSignedOut`, and `SafeUserButton` components prevent runtime exceptions when third-party auth keys are missing or uninitialized.
- **Strict Rate Limiting**: Tier-based daily query quotas (Guest, Registered Free, Pro) enforced via PostgreSQL connection pooling.

### 📊 Agent Telemetry & Analytics
- **Live Performance Dashboard**: Real-time monitoring of model latencies, token throughput, session usage shares, and fallback event frequencies.
- **Interactive Analytics**: Visual distribution of queries by domain category using Recharts.

### 🎨 Neo-Brutalist Cyberpunk Design System
- Built with **TailwindCSS v4**, **Framer Motion**, and **Lucide Icons**.
- Smooth dark mode glassmorphism, responsive drawer sidebars, custom code block syntax highlighting, and interactive micro-animations.

---

## 🛠️ Technology Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | UI Architecture & Type Safety |
| **Build Tool** | Vite 7 | Lightning-Fast Bundling & HMR |
| **Styling & Motion** | TailwindCSS v4 + Framer Motion | Cyberpunk Theme & Micro-animations |
| **Authentication** | Clerk Auth + Custom JWT | Authentication & Access Control |
| **Backend Framework** | Python 3.11 + FastAPI | Async REST API & WebSockets Server |
| **ASGI Web Server** | Uvicorn | High-Performance Asynchronous Server |
| **Database** | PostgreSQL / Supabase | Session, Chat History, & Quota Storage |
| **ORM / Migrations** | Drizzle ORM / Psycopg2 | Database Schema Management & Pooling |
| **AI LLM Engine** | Groq, Gemini, Perplexity, NVIDIA | Multi-Model Parallel Inference |
| **Deployment** | Render / Zerops / Vercel | Production Infrastructure & CI/CD |

---

## 📂 Repository Structure

```text
Nexus-AI/
├── artifacts/
│   └── nexus-ai/             # React 19 + Vite Frontend
│       ├── src/
│       │   ├── components/    # Reusable UI Components & Safe Clerk Wrappers
│       │   ├── contexts/      # AuthContext & Dynamic API Base Resolvers
│       │   ├── hooks/         # useWebSocket, useUsage, useProfile
│       │   ├── lib/           # Centralized API, WebSocket & Clerk Helpers
│       │   └── pages/         # Landing, Workspace, Performance, Analytics, History
│       ├── package.json
│       └── vite.config.ts
├── backend/                   # FastAPI Python Backend
│   ├── main.py                # App Initialization, CORS Middleware & Routes
│   ├── db.py                  # PostgreSQL Pool & Schema Auto-Migrations
│   ├── config.py              # System Limits & Model Configs
│   ├── agents/                # Orchestrator, Routing, & Council Implementations
│   ├── rate_limit/            # Per-User Rate Limiting Engine
│   ├── security/              # Clerk & JWT Verification Helpers
│   ├── websocket/             # Real-Time Chat WebSocket Handler
│   └── requirements.txt       # Python Dependencies
├── render.yaml                # Render Blueprint (1-Click Full-Stack Deployment)
├── zerops.yaml                # Zerops Multi-Service Infrastructure Blueprint
├── pnpm-workspace.yaml        # Workspace Configuration
└── README.md                  # Project Documentation
```

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** 20.x or higher
- **pnpm** (recommended) or `npm`
- **Python** 3.11 or higher
- **PostgreSQL** instance (Supabase or local Postgres)

---

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
# Database & Auth Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
JWT_SECRET=nexus_ai_secure_jwt_key_2026

# AI LLM Provider API Keys
GROQ_API_KEY=gsk_your_groq_key_here
GEMINI_API_KEY=your_gemini_key_here
PERPLEXITY_API_KEY=pplx-your_perplexity_key_here
NVIDIA_API_KEY=nvapi-your_nvidia_key_here
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here

# Optional Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Frontend API Targets (Dev Mode)
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000/ws/chat
```

---

### 3. Backend Setup (FastAPI)

```bash
# Navigate to repository root
cd Nexus-AI

# Create & activate a Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Launch FastAPI backend on port 8000
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 4. Frontend Setup (React + Vite)

Open a second terminal window:

```bash
# Install workspace dependencies
pnpm install

# Start Vite development server
pnpm --filter @workspace/nexus-ai dev
```

Open `http://localhost:5173` in your browser to access **Nexus AI**!

---

## 🗄️ Database Setup (SQL Schema)

Execute the following SQL in your PostgreSQL / Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  name varchar(255),
  avatar_url text,
  provider varchar(50) NOT NULL DEFAULT 'email',
  password_hash text,
  email_verified boolean NOT NULL DEFAULT false,
  total_lifetime_queries integer NOT NULL DEFAULT 0,
  tier varchar(20) NOT NULL DEFAULT 'free',
  clerk_id varchar(100) UNIQUE,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  clerk_id varchar(100),
  title varchar(500) NOT NULL DEFAULT 'New Discussion',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Messages Table with Analytics Columns
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role varchar(50) NOT NULL,
  content text NOT NULL,
  agent_name varchar(100) NOT NULL DEFAULT 'Nexus AI',
  category varchar(100),
  persona_role varchar(50),
  provider varchar(50),
  latency_ms integer,
  was_fallback boolean DEFAULT false,
  conflict_analysis text,
  created_at timestamp NOT NULL DEFAULT now()
);

-- Daily Rate Limits Table
CREATE TABLE IF NOT EXISTS user_limits (
  id serial PRIMARY KEY,
  clerk_id varchar(100) UNIQUE,
  queries_used_today integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT now()
);
```

---

## 🌐 Production Deployment

### Option 1: 1-Click Deployment on Render.com (Recommended)

Nexus AI includes a pre-configured [`render.yaml`](file:///d:/Nexus-AI/render.yaml) blueprint:

1. Sign in to [Render.com](https://render.com) using your GitHub account.
2. Click **New +** ➡️ **Blueprint**.
3. Connect repository `Hardikkhanduja/Nexus-AI`.
4. Enter your API keys under environment variables for `nexus-ai-backend`.
5. Click **Apply**. Render will automatically build both Python Backend & React Frontend!

### Option 2: Deployment on Zerops.io

Nexus AI includes a pre-configured [`zerops.yaml`](file:///d:/Nexus-AI/zerops.yaml) blueprint:

1. Import repository into Zerops.
2. Link PostgreSQL service `db`, Python service `api`, and Static service `app`.
3. Set `DATABASE_URL` as `${db_connectionString}`.

---

## 📡 API Reference

### REST Endpoints
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Core System Health Check | ❌ |
| `GET` | `/api/ai/councils` | Available Domain Councils & Tiers | ❌ |
| `GET` | `/api/ai/analytics` | Real-time System Telemetry & Aggregates | 🛡️ Optional |
| `GET` | `/api/ai/performance` | Live Model Benchmarks & Latencies | 🛡️ Optional |
| `GET` | `/api/user/usage` | Current User Daily Quota & Lifetime Queries | 🛡️ Optional |
| `POST` | `/api/user/toggle-tier` | Switch Between Free & Pro Demo Tier | 🛡️ Optional |
| `GET` | `/api/ai/conversations` | Fetch Saved User Conversations | 🛡️ Optional |

### WebSocket Endpoint
| Endpoint | Protocol | Description |
| :--- | :--- | :--- |
| `/ws/chat` | `ws://` / `wss://` | Real-time multi-agent debate stream & synthesizer output |

---

## 🛡️ License

This project is open-source under the [MIT License](file:///d:/Nexus-AI/LICENSE).

---

<div align="center">
  <sub>Built with ❤️ by Hardik & The Nexus AI Engineering Team.</sub>
</div>
