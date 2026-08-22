# System Architecture: Nexus AI Platform

This document describes the complete system architecture, including component relationships, data flow, database schema, authentication mechanisms, and rate limiting.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Model & Database Schema](#data-model--database-schema)
4. [Authentication & Authorization](#authentication--authorization)
5. [Request/Response Cycle](#requestresponse-cycle)
6. [Rate Limiting](#rate-limiting)
7. [WebSocket Communication Protocol](#websocket-communication-protocol)
8. [Input Validation & Security](#input-validation--security)
9. [Logging Strategy](#logging-strategy)

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEXUS AI PLATFORM DIAGRAM                       │
└─────────────────────────────────────────────────────────────────────────┘

                        ┌──────────────────────┐
                        │   React Frontend     │
                        │   (Port 5173)        │
                        │  - Vite Dev Server   │
                        │  - Tailwind CSS      │
                        │  - React Query       │
                        │  - Wouter Routing    │
                        └──────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
        ┌──────────▼──────────┐    ┌──────────▼──────────┐
        │ REST API Requests   │    │  WebSocket Stream   │
        │ (HTTP/JSON)         │    │  (WS Protocol)      │
        └──────────┬──────────┘    └──────────┬──────────┘
                   │                          │
        ┌──────────▼──────────────────────────▼──────────┐
        │                                                │
        │     ┌────────────────────────────────────┐    │
        │     │    Express API Server              │    │
        │     │    (Port 3001, Node.js)            │    │
        │     ├────────────────────────────────────┤    │
        │     │ Routes:                            │    │
        │     │ - POST   /auth/register            │    │
        │     │ - POST   /auth/login               │    │
        │     │ - GET    /user/profile             │    │
        │     │ - PUT    /user/profile             │    │
        │     │ - GET    /usage/stats              │    │
        │     │ - GET    /preferences              │    │
        │     │ - GET    /health                   │    │
        │     └────────────────────────────────────┘    │
        │                        │                      │
        │     ┌──────────────────▼──────────────────┐   │
        │     │    FastAPI Backend                 │   │
        │     │    (Port 8000, Python)             │   │
        │     ├──────────────────────────────────────┤  │
        │     │ REST Endpoints:                    │   │
        │     │ - GET    /health                   │   │
        │     │ - GET    /api/health/db            │   │
        │     │ - GET    /api/ai/conversations     │   │
        │     │ - GET    /api/ai/conversations/:id │   │
        │     │                                    │   │
        │     │ WebSocket:                         │   │
        │     │ - ws://localhost:8000/ws/chat      │   │
        │     │   (streaming AI responses)         │   │
        │     └──────────────────────────────────────┘  │
        │                        │                      │
        └────────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  PostgreSQL Database    │
                    │  (Port 5432)            │
                    ├────────────┬────────────┤
                    │ 6 Tables:  │            │
                    │ • users    │ Relational│
                    │ • conversa.│ Schema    │
                    │ • messages │ with      │
                    │ • limits   │ Foreign   │
                    │ • prefs    │ Keys      │
                    │ • memory   │            │
                    └────────────┴────────────┘
```

### Component Responsibilities

| Component | Port | Technology | Responsibility |
|-----------|------|-----------|-----------------|
| **React Frontend** | 5173 | React 19, Vite, TypeScript | UI rendering, user interaction, routing |
| **Express API** | 3001 | Node.js, Express 5.2, TypeScript | User auth, profile management, rate limit checks |
| **FastAPI Backend** | 8000 | Python 3.11+, FastAPI 0.115 | WebSocket streaming, AI orchestration, DB queries |
| **PostgreSQL** | 5432 | PostgreSQL 14+ | Persistent storage for all application data |

---

## Component Architecture

### Frontend (React 19 + Vite)

**Location**: [artifacts/nexus-ai/](../artifacts/nexus-ai/)

**Key Files**:
- [src/App.tsx](../artifacts/nexus-ai/src/App.tsx) - Root component, route definitions
- [src/contexts/AuthContext.tsx](../artifacts/nexus-ai/src/contexts/AuthContext.tsx) - Global auth state
- [src/pages/](../artifacts/nexus-ai/src/pages/) - Page components
- [src/components/ui/](../artifacts/nexus-ai/src/components/ui/) - Radix UI component wrappers
- [src/hooks/](../artifacts/nexus-ai/src/hooks/) - Custom React hooks

**Responsibilities**:
- Render chat interface with message history
- Handle user registration, login, profile management
- Manage JWT token storage and injection into API requests
- Establish WebSocket connection for real-time streaming
- Display AI responses as tokens arrive
- Manage authentication state across pages

### Express API Server

**Location**: [artifacts/api-server/](../artifacts/api-server/)

**Key Files**:
- [src/app.ts](../artifacts/api-server/src/app.ts) - Express app factory, middleware setup
- [src/index.ts](../artifacts/api-server/src/index.ts) - Server startup
- [src/routes/](../artifacts/api-server/src/routes/) - REST endpoint handlers
  - [auth.routes.ts](../artifacts/api-server/src/routes/auth.routes.ts) - Registration, login
  - [user.routes.ts](../artifacts/api-server/src/routes/user.routes.ts) - Profile, preferences
  - [health.ts](../artifacts/api-server/src/routes/health.ts) - Health checks
- [src/middlewares/auth.middleware.ts](../artifacts/api-server/src/middlewares/auth.middleware.ts) - Auth enforcement, rate limiting
- [src/lib/auth.config.ts](../artifacts/api-server/src/lib/auth.config.ts) - JWT, bcrypt, OAuth config

**Responsibilities**:
- User registration with password hashing (bcrypt 12 rounds)
- User login with JWT token generation (24h expiry)
- User profile and preferences management
- Daily usage quota tracking and enforcement
- Middleware stack: CORS, JSON parsing, auth validation, logging
- Database interactions via Drizzle ORM

**Request Middleware Stack**:
```
1. CORS Middleware        - Cross-origin header validation
2. JSON Parser           - Parse request body
3. Cookie Parser         - Parse cookies
4. Pino HTTP Logger      - Structured JSON logging
5. Auth Middleware       - JWT validation
6. Rate Limit Middleware - Daily query enforcement
```

### FastAPI Backend (Python)

**Location**: [backend/](../backend/)

**Key Files**:
- [main.py](../backend/main.py) - FastAPI app, routes, lifespan
- [websocket/handler.py](../backend/websocket/handler.py) - WebSocket connection handler
- [db.py](../backend/db.py) - PostgreSQL connection pooling
- [agents/providers/](../backend/agents/providers/) - AI provider implementations
- [security/sanitizer.py](../backend/security/sanitizer.py) - Input validation
- [rate_limit/limiter.py](../backend/rate_limit/limiter.py) - Rate limiting logic

**Responsibilities**:
- Accept WebSocket connections with JWT authentication
- Sanitize user input (prompt injection detection)
- Check rate limits against database
- Call appropriate AI provider (OpenAI, Anthropic, Gemini, Groq)
- Stream AI responses token-by-token to client
- Persist conversations and messages to PostgreSQL
- Provide REST endpoints for conversation history

### Shared Libraries (lib/)

**Database** ([lib/db/](../lib/db/))
- Drizzle ORM schema definitions
- Database migrations
- Type-safe query builders

**API Spec** ([lib/api-spec/](../lib/api-spec/))
- OpenAPI 3.0 specification
- Orval code generation config

**API Zod Schemas** ([lib/api-zod/](../lib/api-zod/))
- Zod runtime validation schemas
- Request/response types
- Auto-generated from OpenAPI spec

**API Client React** ([lib/api-client-react/](../lib/api-client-react/))
- Generated React Query hooks
- Custom fetch middleware for JWT injection
- Automatic token handling

---

## Data Model & Database Schema

### Complete Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA (PostgreSQL)               │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────────────────┐
    │  users                       │
    ├──────────────────────────────┤
    │ id (uuid, PK)                │◄─────┐
    │ email (varchar, UNIQUE)      │      │
    │ name (varchar)               │      │
    │ avatarUrl (text)             │      │
    │ provider (varchar)           │      │
    │ passwordHash (text)          │      │
    │ emailVerified (boolean)      │      │
    │ emailVerificationToken       │      │
    │ totalLifetimeQueries (int)   │      │
    │ createdAt (timestamp)        │      │
    └──────────────────────────────┘      │ 1:N
                                          │
         ┌────────────────────────────────┼───────────────────────────┐
         │                                │                           │
    ┌────┴───────────────────────┐  ┌───┴──────────────────────┐  ┌──┴──────────────────┐
    │ conversations              │  │ user_limits            │  │ user_preferences   │
    ├────────────────────────────┤  ├────────────────────────┤  ├────────────────────┤
    │ id (uuid, PK)              │  │ id (serial, PK)       │  │ id (serial, PK)   │
    │ userId (uuid, FK) ─────────┼─►│ userId (uuid, FK)────►│  │ userId (uuid, FK)─┼─┐
    │ title (varchar)            │  │ queriesUsedToday (int)│  │ codingLanguage    │ │
    │ createdAt (timestamp)      │  │ lastResetDate (date)  │  │ writingStyle      │ │
    │ updatedAt (timestamp)      │  │ UNIQUE(userId)        │  │ favoriteAgents[]  │ │
    └────┬───────────────────────┘  └────────────────────────┘  └────────────────────┘ │
         │                                                               UNIQUE(userId)  │
         │ 1:N                                                                           │
         │                                                                               │
    ┌────┴──────────────────────────┐                                                  │
    │ messages                       │                                                  │
    ├────────────────────────────────┤                                                  │
    │ id (uuid, PK)                  │                                                  │
    │ conversationId (uuid, FK)──────┼──┐                                              │
    │ role (enum: user|assistant)    │  │ CASCADE DELETE                                │
    │ content (text)                 │  │                                              │
    │ agentName (varchar)            │  │                                              │
    │ createdAt (timestamp)          │  │                                              │
    └────────────────────────────────┘  │                                              │
                                         │                                              │
                                    ┌────┴─────────────────────────┐                    │
                                    │ user_memory                  │                    │
                                    ├──────────────────────────────┤                    │
                                    │ id (serial, PK)              │                    │
                                    │ userId (uuid, FK) ──────────►├─────────────────────┘
                                    │ memoryKey (varchar)          │      N:1
                                    │ memoryValue (text)           │
                                    │ createdAt (timestamp)        │
                                    │ updatedAt (timestamp)        │
                                    │ UNIQUE(userId, memoryKey)    │
                                    └──────────────────────────────┘
```

### Table Definitions

#### 1. **users** Table
Stores user account information and authentication data.

```typescript
// Schema Definition (Drizzle ORM)
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  provider: varchar("provider", { length: 50 }).notNull().default("email"),
  passwordHash: text("password_hash"),
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerificationToken: text("email_verification_token"),
  totalLifetimeQueries: integer("total_lifetime_queries").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | UUID | PRIMARY KEY, DEFAULT random() | Unique user identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email (login identifier) |
| `name` | VARCHAR(255) | nullable | Display name |
| `avatarUrl` | TEXT | nullable | Profile picture URL |
| `provider` | VARCHAR(50) | DEFAULT 'email' | Auth provider: 'email', 'google', 'github' |
| `passwordHash` | TEXT | nullable | bcrypt hash (only for email provider) |
| `emailVerified` | BOOLEAN | DEFAULT false | Email verification status |
| `emailVerificationToken` | TEXT | nullable | Token for email verification link |
| `totalLifetimeQueries` | INTEGER | DEFAULT 0 | Cumulative AI queries ever made |
| `createdAt` | TIMESTAMP | DEFAULT now() | Account creation timestamp |

**Example Record**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "name": "Alice Chen",
  "avatarUrl": "https://avatars.example.com/alice.jpg",
  "provider": "email",
  "passwordHash": "$2b$12$...(bcrypt hash)...",
  "emailVerified": true,
  "emailVerificationToken": null,
  "totalLifetimeQueries": 156,
  "createdAt": "2026-08-15T10:30:00Z"
}
```

#### 2. **conversations** Table
Stores chat session metadata.

```typescript
export const conversationsTable = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("conversations_user_id_idx").on(table.userId),
  })
);
```

| Column | Type | Constraints | Purpose |
|--------|------|-----------|---------|
| `id` | UUID | PRIMARY KEY | Unique conversation identifier |
| `userId` | UUID | FK → users(id), CASCADE | Owner of conversation |
| `title` | VARCHAR(255) | NOT NULL | Conversation topic (e.g., "React Questions") |
| `createdAt` | TIMESTAMP | DEFAULT now() | When conversation started |
| `updatedAt` | TIMESTAMP | DEFAULT now() | Last message timestamp |

#### 3. **messages** Table
Stores individual chat messages (user + AI responses).

```typescript
export const messagesTable = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversationsTable.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(), // 'user' or 'assistant'
    content: text("content").notNull(),
    agentName: varchar("agent_name", { length: 100 }), // 'openai', 'anthropic', etc.
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    convIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  })
);
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Unique message identifier |
| `conversationId` | UUID | FK to conversations |
| `role` | VARCHAR(50) | "user" or "assistant" |
| `content` | TEXT | Full message text |
| `agentName` | VARCHAR(100) | AI provider used ("openai", "anthropic", etc.) |
| `createdAt` | TIMESTAMP | When message was created |

#### 4. **user_limits** Table
Tracks daily API usage for rate limiting.

```typescript
export const userLimitsTable = pgTable(
  "user_limits",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    queriesUsedToday: integer("queries_used_today").notNull().default(0),
    lastResetDate: date("last_reset_date").notNull(),
  },
  (table) => ({
    userIdFk: foreignKey({ columns: [table.userId], foreignColumns: [usersTable.id] })
      .onDelete("cascade"),
  })
);
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | SERIAL | Primary key |
| `userId` | UUID | FK to users (UNIQUE) |
| `queriesUsedToday` | INTEGER | Count of queries made today |
| `lastResetDate` | DATE | Date of last daily reset (UTC) |

#### 5. **user_preferences** Table
Stores user's saved settings and preferences.

```typescript
export const userPreferencesTable = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    preferredCodingLanguage: varchar("preferred_coding_language", { length: 50 }),
    preferredWritingStyle: varchar("preferred_writing_style", { length: 50 }),
    favoriteAgents: text("favorite_agents").array(), // PostgreSQL array
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | SERIAL | Primary key |
| `userId` | UUID | FK to users (UNIQUE) |
| `preferredCodingLanguage` | VARCHAR(50) | e.g., "typescript", "python" |
| `preferredWritingStyle` | VARCHAR(50) | e.g., "concise", "detailed" |
| `favoriteAgents` | TEXT[] | Array of preferred AI providers |

#### 6. **user_memory** Table
Stores user context and personalization data.

```typescript
export const userMemoryTable = pgTable(
  "user_memory",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull(),
    memoryKey: varchar("memory_key", { length: 255 }).notNull(),
    memoryValue: text("memory_value"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userIdFk: foreignKey({ columns: [table.userId], foreignColumns: [usersTable.id] })
      .onDelete("cascade"),
    uniqueMemory: unique("unique_user_memory").on(table.userId, table.memoryKey),
  })
);
```

| Column | Type | Purpose |
|--------|------|---------|
| `id` | SERIAL | Primary key |
| `userId` | UUID | FK to users |
| `memoryKey` | VARCHAR(255) | e.g., "user_background", "favorite_topics" |
| `memoryValue` | TEXT | Stored context value |
| `createdAt` | TIMESTAMP | When stored |
| `updatedAt` | TIMESTAMP | Last update time |

---

## Authentication & Authorization

### JWT Token Specification

**Token Type**: HS256 (HMAC with SHA-256)

**Payload**:
```typescript
interface JWTPayload {
  userId: string;      // UUID of authenticated user
  email: string;       // User's email address
  iat?: number;        // Issued at time (Unix timestamp)
  exp?: number;        // Expiration time (Unix timestamp)
}
```

**Example Decoded Token**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "iat": 1692374400,
  "exp": 1692460800
}
```

**Configuration** ([artifacts/api-server/src/lib/auth.config.ts](../artifacts/api-server/src/lib/auth.config.ts)):
- **Secret**: Environment variable `JWT_SECRET` (fallback: "nexus-dev-secret-change-in-production")
- **Expiry**: 24 hours from generation
- **Algorithm**: HS256
- **Bcrypt Rounds**: 12 (password hashing strength)

### Registration Flow

```
Client                          Express API                         Database
  │                                 │                                  │
  ├─ POST /auth/register ──────────►│                                  │
  │  {email, password, name}        │                                  │
  │                                 ├─ Zod Validation ─────────────►   │
  │                                 │ (email format, password strength)│
  │                                 │                                  │
  │                                 ├─ Check Email Exists ──────────► │
  │                                 │ SELECT * FROM users              │
  │                                 │ WHERE email = ?                  │
  │                                 │◄──────────────────────────────   │
  │                                 │                                  │
  │                                 ├─ Hash Password (bcrypt)          │
  │                                 │ $2b$12$...(hash)...              │
  │                                 │                                  │
  │                                 ├─ Generate Verification Token     │
  │                                 │ (64-char random)                 │
  │                                 │                                  │
  │                                 ├─ INSERT User ────────────────► │
  │                                 │ INSERT INTO users VALUES         │
  │                                 │ (id, email, passwordHash, ...)   │
  │                                 │◄──────────────────────────────   │
  │                                 │ RETURNING *                      │
  │                                 │                                  │
  │                                 ├─ INSERT user_limits ──────────► │
  │                                 │ INSERT INTO user_limits VALUES   │
  │                                 │ (userId, 0, today)               │
  │                                 │◄──────────────────────────────   │
  │                                 │                                  │
  │                                 ├─ INSERT user_preferences ──────►│
  │                                 │ INSERT INTO user_preferences...  │
  │                                 │◄──────────────────────────────   │
  │                                 │                                  │
  │                                 ├─ Generate JWT                    │
  │                                 │ jwt.sign({userId, email}, secret)│
  │                                 │                                  │
  │                                 ├─ Send Verification Email (dev)   │
  │                                 │ console.log(verification URL)    │
  │                                 │                                  │
  │◄─ 201 Created ─────────────────┤                                  │
  │   {token, user: {...}}          │                                  │
  │                                 │                                  │
```

**Code Reference**: [artifacts/api-server/src/routes/auth.routes.ts](../artifacts/api-server/src/routes/auth.routes.ts#L20)

### Login Flow

```
Client                        Express API                    Database
  │                               │                            │
  ├─ POST /auth/login ──────────►│                            │
  │  {email, password}           │                            │
  │                               ├─ Zod Validation ─────────►│
  │                               │                            │
  │                               ├─ SELECT User ───────────►│
  │                               │ WHERE email = ?           │
  │                               │◄──────────────────────────│
  │                               │ (returns user record)     │
  │                               │                           │
  │                               ├─ bcrypt.compare()         │
  │                               │ Compare password with hash│
  │                               │                           │
  │                               ├─ Generate JWT             │
  │                               │ jwt.sign({userId, email},│
  │                               │         JWT_SECRET, {    │
  │                               │           expiresIn:      │
  │                               │           "24h"          │
  │                               │         })               │
  │                               │                          │
  │◄─ 200 OK ──────────────────┤                            │
  │   {token, user: {...}}      │                            │
  │                             │                            │
```

**Code Reference**: [artifacts/api-server/src/routes/auth.routes.ts](../artifacts/api-server/src/routes/auth.routes.ts#L80)

### Token Verification (Middleware)

All protected Express routes use the `requireAuth()` middleware:

```typescript
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer") {
    res.status(401).json({ error: "Invalid Authorization scheme" });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
```

### WebSocket Authentication

WebSocket connections in FastAPI receive the JWT token as a query parameter:

```python
# backend/websocket/handler.py
async def handle_chat_websocket(websocket: WebSocket):
    await websocket.accept()
    
    # Extract token from query params
    token = websocket.query_params.get("token")
    user_id = None
    
    if token:
        payload = decode_token(token)  # Uses jwt.decode() with JWT_SECRET
        if not payload:
            await websocket.close(code=4008)  # Unauthenticated
            return
        user_id = payload.get("userId")
        email = payload.get("email")
```

**Connection URL**: `ws://localhost:8000/ws/chat?token=YOUR_JWT_TOKEN`

**Fallback**: If no token provided, connection is allowed as "guest" with user_id = None

---

## Request/Response Cycle

### Complete User Registration → First Message Flow

```
1. REGISTRATION
   ├─ User fills form: {email, password, name}
   ├─ POST http://localhost:3001/api/auth/register
   │  Request Header: Content-Type: application/json
   │  Body: {"email":"alice@example.com","password":"Secure!23","name":"Alice"}
   │
   ├─ Express Validation:
   │  ├─ Zod.safeParse(RegisterRequest) ─► Check format
   │  ├─ Query: SELECT * FROM users WHERE email = ? ─► Duplicate check
   │  ├─ bcrypt.hash(password, 12) ─► Hash password
   │  ├─ INSERT INTO users ─► Create user record
   │  ├─ INSERT INTO user_limits ─► Create quota tracker
   │  ├─ INSERT INTO user_preferences ─► Create preference stub
   │  └─ jwt.sign({userId, email}) ─► Generate JWT
   │
   └─ Response (201): {"token": "eyJ...", "user": {...}}

2. STORE TOKEN (Frontend)
   ├─ React: localStorage.setItem("jwt_token", token)
   └─ AuthContext: Update state with user info

3. GET USER PROFILE
   ├─ GET http://localhost:3001/api/user/profile
   ├─ Request Header: Authorization: Bearer eyJ...
   │
   ├─ Express Middleware:
   │  ├─ requireAuth() ─► Extract & verify JWT
   │  ├─ checkQueryLimit() ─► Query database for daily limit
   │  └─ Pass user to route handler
   │
   ├─ Route Handler:
   │  ├─ db.select() ─► Query users table
   │  └─ Return user record
   │
   └─ Response (200): {"id": "uuid", "email": "alice@example.com", ...}

4. CONNECT WEBSOCKET
   ├─ React: ws = new WebSocket("ws://localhost:8000/ws/chat?token=" + jwtToken)
   │
   ├─ FastAPI:
   │  ├─ await websocket.accept()
   │  ├─ Extract token from query_params
   │  ├─ jwt.decode(token, JWT_SECRET)
   │  └─ Validate user_id
   │
   └─ Connection Established (code 1000)

5. SEND FIRST MESSAGE
   ├─ Client: ws.send(JSON.stringify({
   │    type: "user_message",
   │    content: "What is React?",
   │    provider: "openai"
   │  }))
   │
   ├─ FastAPI Handler:
   │  ├─ Parse JSON
   │  ├─ sanitize_input(content) ─► Check for prompt injection
   │  ├─ check_and_increment(user_id) ─► Verify daily limit
   │  │  ├─ Query user_limits table
   │  │  ├─ Check if lastResetDate == today
   │  │  ├─ If reset needed: UPDATE queries_used_today = 0
   │  │  ├─ Check if queries_used_today < REGISTERED_DAILY_LIMIT (30)
   │  │  ├─ Increment queries_used_today
   │  │  └─ Commit transaction
   │  ├─ get_provider("openai") ─► Load provider from registry
   │  ├─ Query conversations table ─► Get message history
   │  ├─ provider.stream(content, context) ─► Call AI with streaming
   │  │  (Pulls from OpenAI, Anthropic, etc. based on provider)
   │  └─ Yield tokens as they arrive
   │
   └─ Server → Client: 
      data: React
      data: is
      data: a
      data: JavaScript
      data: library
      data: [DONE]

6. PERSIST CONVERSATION (FastAPI)
   ├─ After stream completes:
   ├─ INSERT INTO conversations (userId, title, createdAt)
   ├─ INSERT INTO messages (conversationId, role='user', content)
   ├─ INSERT INTO messages (conversationId, role='assistant', content)
   └─ UPDATE users SET totalLifetimeQueries = totalLifetimeQueries + 1

7. FRONTEND UPDATES
   ├─ React: Render streamed tokens in real-time
   ├─ Store full message in local state
   ├─ Display in chat UI
   └─ Update usage stats display
```

---

## Rate Limiting

### Architecture

**Daily Quota Model**:
- **Guests** (no token): 5 queries/day
- **Registered Users** (valid JWT): 30 queries/day
- **Reset**: Midnight UTC each day

### Database Persistence

The `user_limits` table stores per-user quota state:

```sql
-- Schema
CREATE TABLE user_limits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  queries_used_today INTEGER NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL
);

-- Example data
INSERT INTO user_limits VALUES
  (1, '550e8400-e29b-41d4-a716-446655440000', 15, '2026-08-18');
  -- User has used 15 of 30 queries today
```

### Check & Increment Logic

**File**: [backend/rate_limit/limiter.py](../backend/rate_limit/limiter.py)

```python
async def check_and_increment(
    conn: Optional[psycopg2.extensions.connection],
    user_id: Optional[str],
) -> Tuple[bool, int, int]:
    """
    Check if user can make a query, increment counter if allowed.
    
    Returns: (allowed: bool, remaining: int, limit: int)
    """
    # Guest users always allowed (with fallback limit)
    if user_id is None:
        return True, GUEST_DAILY_LIMIT, GUEST_DAILY_LIMIT

    if conn is None:
        # DB unavailable - allow in dev mode
        return True, REGISTERED_DAILY_LIMIT, REGISTERED_DAILY_LIMIT

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    with conn.cursor() as cur:
        # 1. Create record if doesn't exist
        cur.execute("""
            INSERT INTO user_limits (user_id, queries_used_today, last_reset_date)
            VALUES (%s, 0, %s)
            ON CONFLICT (user_id) DO NOTHING
        """, (user_id, today_str))

        # 2. Query current state
        cur.execute(
            "SELECT queries_used_today, last_reset_date FROM user_limits WHERE user_id = %s",
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            conn.commit()
            return True, REGISTERED_DAILY_LIMIT, REGISTERED_DAILY_LIMIT

        queries_used, last_reset = row

        # 3. Check if reset needed (new day)
        if str(last_reset) != today_str:
            cur.execute("""
                UPDATE user_limits
                SET queries_used_today = 0, last_reset_date = %s
                WHERE user_id = %s
            """, (today_str, user_id))
            queries_used = 0

        # 4. Check limit
        if queries_used >= REGISTERED_DAILY_LIMIT:
            conn.commit()
            return False, 0, REGISTERED_DAILY_LIMIT  # Limit exceeded

        # 5. Increment if under limit
        cur.execute("""
            UPDATE user_limits
            SET queries_used_today = queries_used_today + 1
            WHERE user_id = %s
        """, (user_id,))
        
        conn.commit()
        return True, REGISTERED_DAILY_LIMIT - (queries_used + 1), REGISTERED_DAILY_LIMIT
```

### Enforcement Points

**Express API** ([artifacts/api-server/src/middlewares/auth.middleware.ts](../artifacts/api-server/src/middlewares/auth.middleware.ts)):
```typescript
export async function checkQueryLimit(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.userId;
  const allowed = await checkLimit(userId);  // Drizzle ORM query
  
  if (!allowed) {
    res.status(429).json({ error: "Daily limit exceeded" });
    return;
  }
  next();
}
```

**FastAPI** ([backend/websocket/handler.py](../backend/websocket/handler.py)):
```python
allowed, remaining, limit = await check_and_increment(conn, user_id)

if not allowed:
    await websocket.send_json({"type": "error", "message": "Daily limit exceeded"})
    await websocket.close(code=4009)  # Rate limit exceeded
    return
```

---

## WebSocket Communication Protocol

### Connection Establishment

**Client-side** (React):
```javascript
const token = localStorage.getItem("jwt_token");
const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);

ws.onopen = () => console.log("Connected");
ws.onerror = (err) => console.error("Error:", err);
ws.onclose = () => console.log("Disconnected");
```

**Server-side** (FastAPI):
```python
@app.websocket("/ws/chat")
async def handle_chat_websocket(websocket: WebSocket):
    await websocket.accept()  # Accept connection first
    # ... authentication & handling logic ...
```

### Message Format

**Client → Server**:
```json
{
  "type": "user_message",
  "content": "Explain closures in JavaScript",
  "provider": "openai",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "systemPrompt": "You are a helpful JavaScript tutor"
}
```

**Server → Client (Streaming)**:
```
Server sends a series of messages:

1. Status message:
{"type": "status", "message": "Checking usage limit..."}

2. Streaming tokens (one per line):
data: Closures
data: are
data: JavaScript
data: functions
data: [DONE]

3. Complete message (after stream):
{"type": "message_complete", "conversationId": "uuid", "messageId": "uuid"}

4. Error (if applicable):
{"type": "error", "message": "Rate limit exceeded", "code": 4009}
```

### Connection Lifecycle States

```
INITIAL
   │
   ├─ Client sends: ws = new WebSocket("ws://...")
   │
CONNECTING
   │
   ├─ Server calls: await websocket.accept()
   │
OPEN (authenticated) ◄─── Ready for messages
   │
   ├─ Client sends: {"type": "user_message", ...}
   │
   ├─ Server validates:
   │  ├─ Zod parse JSON
   │  ├─ sanitize_input()
   │  ├─ check_and_increment()
   │  └─ get_provider()
   │
   ├─ Server streams response
   │  ├─ data: token1
   │  ├─ data: token2
   │  └─ data: [DONE]
   │
   ├─ Client receives all tokens
   │
   ├─ Server sends: {"type": "message_complete", ...}
   │
   ├─ Back to OPEN (awaiting next message)
   │
CLOSING
   │
   ├─ Client calls: ws.close()
   │  OR Server calls: await websocket.close()
   │
CLOSED
   │
   └─ Connection terminated, no further communication
```

### Close Codes

| Code | Meaning | When | Action |
|------|---------|------|--------|
| 1000 | Normal Closure | Client/Server closes intentionally | Reconnect optional |
| 1001 | Going Away | Server shutdown or client leaving | Reconnect after delay |
| 1002 | Protocol Error | Invalid WebSocket frame | Report bug |
| 1008 | Policy Violation | Server policy violated | User action needed |
| 4008 | Unauthenticated | JWT invalid or expired | Re-login required |
| 4009 | Rate Limit Exceeded | Daily limit reached | Retry tomorrow |
| 4010 | Invalid JSON | Malformed message | Fix client code |
| 1011 | Server Error | Unexpected server exception | Retry with backoff |

---

## Input Validation & Security

### Validation Layers

```
Client Input
    │
    ├─► Frontend Validation (React)
    │   └─ Basic format checks (email regex, password length)
    │
    ├─► REST API Validation (Express, Zod)
    │   ├─ Email format: RFC 5322 compliant
    │   ├─ Password: 8+ chars, 1 uppercase, 1 number, 1 special
    │   ├─ Name: 1-255 characters, no HTML
    │   └─ Safe parse: reject invalid and return detailed errors
    │
    ├─► WebSocket Input Validation (FastAPI)
    │   ├─ JSON structure: require {type, content, provider}
    │   ├─ Content length: max 10KB
    │   └─ Provider: one of {openai, anthropic, gemini, groq}
    │
    ├─► Prompt Injection Detection
    │   └─ Run regex checks against 8 injection patterns
    │
    ├─► HTML Sanitization
    │   └─ bleach.clean() removes all HTML tags
    │
    └─► Database Layer
        └─ Parameterized queries prevent SQL injection
```

### Prompt Injection Detection

**File**: [backend/security/sanitizer.py](../backend/security/sanitizer.py)

The system detects common prompt injection patterns:

```python
INJECTION_PATTERNS = [
    # Pattern 1: System prompt override
    r"(?i)(forget|ignore|override).*?(?:instruction|prompt|system)",
    
    # Pattern 2: Jailbreak attempts
    r"(?i)(jailbreak|bypass|trick|exploit)",
    
    # Pattern 3: Role reversal
    r"(?i)(you are now|pretend to be|act as).*?(?:developer|admin|root)",
    
    # Pattern 4: Token/API key requests
    r"(?i)(what is|show|reveal|display).*?(token|api|key|secret)",
    
    # Pattern 5: Direct instruction injection
    r"(?i)(do not|never|always).*?(respond|answer|tell)",
    
    # Pattern 6: Context extraction
    r"(?i)(extract|dump|show).*?(conversation|context|history)",
    
    # Pattern 7: Model info leakage
    r"(?i)(what model|what version|who built)",
    
    # Pattern 8: Function calling abuse
    r"(?i)(function|tool|action|execute).*?(?:\{|\[)"
]
```

### Password Requirements

Enforced via Zod schema in [lib/api-zod/src/auth.ts](../lib/api-zod/src/auth.ts):

```typescript
export const RegisterRequest = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "At least one uppercase letter")
    .regex(/[0-9]/, "At least one number")
    .regex(/[!@#$%^&*]/, "At least one special character"),
  name: z.string().min(1).max(255),
});
```

### bcrypt Hashing

**Configuration** ([artifacts/api-server/src/lib/auth.config.ts](../artifacts/api-server/src/lib/auth.config.ts)):

```typescript
const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

**Cost Analysis**: 12 rounds = ~250ms per hash operation (provides good security/performance tradeoff)

---

## Logging Strategy

### Express API Logging

**Logger**: Pino 9.14.0 with structured JSON output

**Configuration** ([artifacts/api-server/src/lib/logger.ts](../artifacts/api-server/src/lib/logger.ts)):

```typescript
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",  // Pretty-print in dev, JSON in production
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
});
```

**Middleware**: Pino HTTP middleware logs all requests/responses

```typescript
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) {
      return { id: req.id, method: req.method, url: req.url };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
}));
```

**Example Log Output**:
```json
{
  "level": 30,
  "time": 1692374400000,
  "pid": 12345,
  "hostname": "localhost",
  "req": {
    "id": "req-uuid",
    "method": "POST",
    "url": "/api/auth/login"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 125,
  "msg": "request completed"
}
```

### FastAPI Logging

**Logger**: Python `logging` module with ISO 8601 timestamps

**Configuration** ([backend/main.py](../backend/main.py)):

```python
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("backend")
```

**Example Log Output**:
```
2026-08-18 10:30:45,123 [INFO] backend: Starting up FastAPI application...
2026-08-18 10:30:45,456 [INFO] uvicorn.access: "GET /health HTTP/1.1" 200
2026-08-18 10:30:46,789 [INFO] websocket_handler: Authenticated connection: user_id=uuid
2026-08-18 10:30:47,012 [INFO] websocket_handler: Rate limit check: 15/30 used
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| ERROR | Critical failures | DB connection lost, JWT decode error |
| WARN | Unexpected but recoverable | DB unavailable, fallback used |
| INFO | Important events | User login, WebSocket connect, API errors |
| DEBUG | Detailed diagnostics | Function entry/exit, variable values |

---

**Next Documentation**: [→ BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for FastAPI, WebSocket, and AI provider implementation details

