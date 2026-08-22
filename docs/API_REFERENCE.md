# API Reference: Complete Endpoint Documentation

This document provides comprehensive documentation for all REST and WebSocket endpoints, including request/response examples, status codes, and error handling.

---

## Table of Contents

1. [Express API (Port 3001)](#express-api-port-3001)
2. [FastAPI REST (Port 8000)](#fastapi-rest-port-8000)
3. [WebSocket API](#websocket-api)
4. [Error Codes & Status Codes](#error-codes--status-codes)
5. [Authentication Methods](#authentication-methods)
6. [Code Examples](#code-examples)

---

## Express API (Port 3001)

### Authentication Endpoints

#### POST /api/auth/register

Register a new user account.

**Request**:
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePassword123!",
  "name": "Alice Chen"
}
```

**Request Body Schema**:
```typescript
{
  email: string,      // Valid email format
  password: string,   // 8+ chars, 1 uppercase, 1 number, 1 special char
  name: string        // 1-255 characters
}
```

**Success Response** (201 Created):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwiaWF0IjoxNjkyMzc0NDAwLCJleHAiOjE2OTI0NjA4MDB9.signature",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Chen",
    "provider": "email",
    "emailVerified": false,
    "totalLifetimeQueries": 0,
    "createdAt": "2026-08-18T10:30:00Z"
  }
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 400 | "Invalid email format" | Email doesn't match RFC 5322 |
| 400 | "Password must be at least 8 characters" | Password too short |
| 400 | "Password must contain at least one uppercase letter" | Missing uppercase |
| 400 | "Password must contain at least one number" | Missing digit |
| 400 | "Password must contain at least one special character" | Missing special char |
| 409 | "Email already registered" | User exists with email |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePassword123!",
    "name": "Alice Chen"
  }'
```

**Notes**:
- JWT token valid for 24 hours
- Email verification not yet implemented (logged to console in dev)
- Password hashed with bcrypt (12 rounds)

---

#### POST /api/auth/login

Authenticate user and receive JWT token.

**Request**:
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePassword123!"
}
```

**Request Body Schema**:
```typescript
{
  email: string,      // User's email
  password: string    // User's password
}
```

**Success Response** (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJlbWFpbCI6ImFsaWNlQGV4YW1wbGUuY29tIiwiaWF0IjoxNjkyMzc0NDAwLCJleHAiOjE2OTI0NjA4MDB9.signature",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "alice@example.com",
    "name": "Alice Chen",
    "provider": "email",
    "emailVerified": false,
    "totalLifetimeQueries": 42,
    "createdAt": "2026-08-15T10:30:00Z"
  }
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 400 | "Invalid email format" | Invalid email |
| 400 | "Missing email or password" | Empty fields |
| 401 | "Invalid email or password" | Wrong credentials |
| 404 | "User not found" | Email doesn't exist |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePassword123!"
  }'
```

---

### User Endpoints

All user endpoints require authentication via `Authorization: Bearer <JWT_TOKEN>` header.

#### GET /api/user/profile

Retrieve authenticated user's profile.

**Request**:
```http
GET http://localhost:3001/api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "name": "Alice Chen",
  "avatarUrl": "https://avatars.example.com/alice.jpg",
  "provider": "email",
  "emailVerified": true,
  "totalLifetimeQueries": 156,
  "createdAt": "2026-08-15T10:30:00Z"
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Missing Authorization header" | No token provided |
| 401 | "Invalid or expired token" | Token invalid/expired |
| 404 | "User not found" | User deleted |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### PUT /api/user/profile

Update user profile information.

**Request**:
```http
PUT http://localhost:3001/api/user/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Alice Chen",
  "avatarUrl": "https://avatars.example.com/new-avatar.jpg"
}
```

**Request Body Schema** (all fields optional):
```typescript
{
  name?: string,        // Display name (1-255 chars)
  avatarUrl?: string    // Avatar URL
}
```

**Success Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "alice@example.com",
  "name": "Alice Chen",
  "avatarUrl": "https://avatars.example.com/new-avatar.jpg",
  "provider": "email",
  "emailVerified": true,
  "totalLifetimeQueries": 156,
  "createdAt": "2026-08-15T10:30:00Z"
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 400 | "Name must be 1-255 characters" | Invalid name length |
| 401 | "Invalid or expired token" | Token invalid/expired |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X PUT http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Chen Updated"
  }'
```

---

#### GET /api/usage/stats

Get user's API usage statistics.

**Request**:
```http
GET http://localhost:3001/api/usage/stats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "todayUsed": 15,
  "todayLimit": 30,
  "todayRemaining": 15,
  "totalLifetime": 156,
  "lastResetDate": "2026-08-18",
  "resetTime": "2026-08-19T00:00:00Z"
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Invalid or expired token" | Token invalid/expired |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X GET http://localhost:3001/api/usage/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### Preferences Endpoints

#### GET /api/preferences

Retrieve user's preferences.

**Request**:
```http
GET http://localhost:3001/api/preferences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200 OK):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "preferredCodingLanguage": "typescript",
  "preferredWritingStyle": "detailed",
  "favoriteAgents": ["openai", "anthropic"],
  "createdAt": "2026-08-15T10:30:00Z",
  "updatedAt": "2026-08-18T15:00:00Z"
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Invalid or expired token" | Token invalid/expired |
| 404 | "Preferences not found" | User has no preferences record |
| 500 | "Internal server error" | Database error |

---

#### PUT /api/preferences

Update user's preferences.

**Request**:
```http
PUT http://localhost:3001/api/preferences
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "preferredCodingLanguage": "python",
  "preferredWritingStyle": "concise",
  "favoriteAgents": ["anthropic", "groq"]
}
```

**Request Body Schema** (all fields optional):
```typescript
{
  preferredCodingLanguage?: string,  // e.g., "python", "javascript", "rust"
  preferredWritingStyle?: string,    // e.g., "concise", "detailed", "academic"
  favoriteAgents?: string[]          // Array of provider names
}
```

**Success Response** (200 OK):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "preferredCodingLanguage": "python",
  "preferredWritingStyle": "concise",
  "favoriteAgents": ["anthropic", "groq"],
  "createdAt": "2026-08-15T10:30:00Z",
  "updatedAt": "2026-08-18T15:30:00Z"
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 400 | "Invalid preference value" | Invalid coding language/style |
| 401 | "Invalid or expired token" | Token invalid/expired |
| 500 | "Internal server error" | Database error |

---

### Health Check Endpoints

#### GET /api/health

Application health check.

**Request**:
```http
GET http://localhost:3001/api/health
```

**Success Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2026-08-18T10:30:00Z"
}
```

---

## FastAPI REST (Port 8000)

### Health Endpoints

#### GET /health

FastAPI server readiness probe.

**Request**:
```http
GET http://localhost:8000/health
```

**Success Response** (200 OK):
```json
{
  "status": "ok"
}
```

---

#### GET /api/health/db

Database connectivity check.

**Request**:
```http
GET http://localhost:8000/api/health/db
```

**Success Response** (200 OK):
```json
{
  "database": "connected",
  "timestamp": "2026-08-18T10:30:00Z"
}
```

**Error Response** (500):
```json
{
  "detail": "Database connection failed"
}
```

---

### Conversation Endpoints

All endpoints require authentication via `Authorization: Bearer <JWT_TOKEN>` header.

#### GET /api/ai/conversations

List user's conversations (paginated).

**Request**:
```http
GET http://localhost:8000/api/ai/conversations?limit=20&offset=0
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**:
- `limit` (integer, optional, default=20): Maximum results per page (max 100)
- `offset` (integer, optional, default=0): Starting position

**Success Response** (200 OK):
```json
{
  "conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "React Questions",
      "createdAt": "2026-08-18T10:00:00Z",
      "updatedAt": "2026-08-18T12:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Python Debugging",
      "createdAt": "2026-08-17T14:30:00Z",
      "updatedAt": "2026-08-18T08:15:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Authorization header is missing" | No token provided |
| 401 | "Invalid or expired token" | Token invalid/expired |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/ai/conversations?limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

#### GET /api/ai/conversations/{conversation_id}

Fetch complete conversation with all messages.

**Request**:
```http
GET http://localhost:8000/api/ai/conversations/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Path Parameters**:
- `conversation_id` (UUID): ID of conversation to retrieve

**Success Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "React Questions",
  "createdAt": "2026-08-18T10:00:00Z",
  "updatedAt": "2026-08-18T12:00:00Z",
  "messages": [
    {
      "id": "message-uuid-1",
      "role": "user",
      "content": "How does React work?",
      "agentName": "openai",
      "createdAt": "2026-08-18T10:05:00Z"
    },
    {
      "id": "message-uuid-2",
      "role": "assistant",
      "content": "React is a JavaScript library for building user interfaces...",
      "agentName": "openai",
      "createdAt": "2026-08-18T10:06:00Z"
    },
    {
      "id": "message-uuid-3",
      "role": "user",
      "content": "Tell me about hooks",
      "agentName": "openai",
      "createdAt": "2026-08-18T10:10:00Z"
    },
    {
      "id": "message-uuid-4",
      "role": "assistant",
      "content": "Hooks are functions that let you use state and other React features...",
      "agentName": "openai",
      "createdAt": "2026-08-18T10:11:00Z"
    }
  ]
}
```

**Error Responses**:

| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Authorization header is missing" | No token provided |
| 401 | "Invalid or expired token" | Token invalid/expired |
| 404 | "Conversation not found" | ID doesn't exist or not owned by user |
| 500 | "Internal server error" | Database error |

**cURL Example**:
```bash
curl -X GET "http://localhost:8000/api/ai/conversations/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## WebSocket API

### ws://localhost:8000/ws/chat

Real-time streaming chat endpoint for AI responses.

#### Connection

**URL Format**:
```
ws://localhost:8000/ws/chat?token=JWT_TOKEN
```

**Examples**:
```javascript
// JavaScript
const token = localStorage.getItem("jwt_token");
const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);

ws.onopen = () => console.log("Connected");
ws.onmessage = (event) => console.log("Message:", event.data);
ws.onerror = (error) => console.error("Error:", error);
ws.onclose = () => console.log("Disconnected");

// Python
import websockets
import json

async def chat():
    token = "eyJ..."
    async with websockets.connect(f"ws://localhost:8000/ws/chat?token={token}") as ws:
        # Send message
        await ws.send(json.dumps({
            "type": "user_message",
            "content": "What is Python?",
            "provider": "openai"
        }))
        
        # Receive streaming response
        async for message in ws:
            print(message)
```

---

#### Sending Messages

**Message Format** (Client → Server):
```json
{
  "type": "user_message",
  "content": "Explain closures in JavaScript",
  "provider": "openai",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "systemPrompt": "You are a helpful programming tutor"
}
```

**Fields**:
- `type` (string, required): Always `"user_message"`
- `content` (string, required): User's message/question (max 10KB)
- `provider` (string, required): AI provider: `"openai"`, `"anthropic"`, `"gemini"`, or `"groq"`
- `conversationId` (string, optional): UUID of existing conversation (creates new if omitted)
- `systemPrompt` (string, optional): Custom system instructions for this request

**Example Request**:
```json
{
  "type": "user_message",
  "content": "Write a Python function that calculates Fibonacci numbers",
  "provider": "openai",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "systemPrompt": "You are a Python expert. Write clean, well-documented code."
}
```

---

#### Receiving Messages

**Response Format** (Server → Client):

1. **Status Message**:
```json
{
  "type": "status",
  "message": "Validating input..."
}
```

2. **Streaming Tokens** (Server-Sent Events format):
```
data: Closures
data: are
data: functions
data: [DONE]
```

Each token is sent as a separate line with `data: ` prefix. Stream ends with `data: [DONE]`.

3. **Complete Message Notification**:
```json
{
  "type": "message_complete",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "messageId": "message-uuid"
}
```

4. **Error Response**:
```json
{
  "type": "error",
  "message": "Daily limit exceeded. You have reached 30 queries today."
}
```

---

#### Connection Close Codes

| Code | Meaning | Action |
|------|---------|--------|
| 1000 | Normal closure | Connection closed normally |
| 1001 | Going away | Server shutting down |
| 4008 | Unauthenticated | JWT invalid/expired, re-login needed |
| 4009 | Rate limit exceeded | Daily limit reached, retry tomorrow |
| 4010 | Invalid JSON | Malformed message, fix and retry |
| 1011 | Server error | Internal error, retry with backoff |

**Example**:
```javascript
ws.onclose = (event) => {
  if (event.code === 4008) {
    console.log("Token expired, please login again");
  } else if (event.code === 4009) {
    console.log("Daily limit reached, try again tomorrow");
  }
};
```

---

#### Complete WebSocket Example

```javascript
class ChatClient {
  constructor(token) {
    this.token = token;
    this.ws = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${this.token}`);
      
      this.ws.onopen = () => {
        console.log("✓ Connected to chat server");
        resolve();
      };
      
      this.ws.onerror = (error) => {
        console.error("✗ Connection error:", error);
        reject(error);
      };
      
      this.ws.onmessage = (event) => this.handleMessage(event.data);
      this.ws.onclose = (event) => this.handleClose(event);
    });
  }

  async sendMessage(content, provider = "openai") {
    const message = {
      type: "user_message",
      content,
      provider
    };
    this.ws.send(JSON.stringify(message));
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      
      if (message.type === "status") {
        console.log(`[Status] ${message.message}`);
      } else if (message.type === "error") {
        console.error(`[Error] ${message.message}`);
      } else if (message.type === "message_complete") {
        console.log(`[Done] Conversation: ${message.conversationId}`);
      }
    } catch (e) {
      // Streaming token (not JSON)
      if (data.startsWith("data: ")) {
        const token = data.slice(6);
        if (token !== "[DONE]") {
          process.stdout.write(token);
        }
      }
    }
  }

  handleClose(event) {
    if (event.code === 4008) {
      console.log("Auth failed: Token expired");
    } else if (event.code === 4009) {
      console.log("Rate limited: Daily quota exceeded");
    } else {
      console.log(`Connection closed: ${event.code}`);
    }
  }
}

// Usage
(async () => {
  const token = "eyJ..."; // Your JWT
  const client = new ChatClient(token);
  
  await client.connect();
  await client.sendMessage("What is machine learning?", "openai");
  
  // Keep connection open to receive responses
  await new Promise(resolve => setTimeout(resolve, 5000));
})();
```

---

## Error Codes & Status Codes

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | User successfully registered |
| 400 | Bad Request | Invalid email format or body |
| 401 | Unauthorized | Missing/invalid JWT token |
| 404 | Not Found | User/conversation doesn't exist |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Database or server failure |

### WebSocket Close Codes

| Code | Meaning | When |
|------|---------|------|
| 1000 | Normal Closure | Client closes connection intentionally |
| 1001 | Going Away | Server shutting down |
| 1008 | Policy Violation | Server detected policy breach |
| 1011 | Server Error | Unexpected exception during handling |
| 4008 | Unauthenticated | JWT invalid, expired, or missing |
| 4009 | Rate Limit | Daily usage limit exceeded |
| 4010 | Invalid JSON | Message didn't parse as JSON |

---

## Authentication Methods

### Method 1: Bearer Token (Express & FastAPI REST)

**Header Format**:
```
Authorization: Bearer <JWT_TOKEN>
```

**Example**:
```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3001/api/user/profile
```

### Method 2: Query Parameter (WebSocket)

**URL Format**:
```
ws://localhost:8000/ws/chat?token=<JWT_TOKEN>
```

**Example**:
```javascript
const token = localStorage.getItem("jwt_token");
const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);
```

### Method 3: Guest Access (WebSocket only)

Connect without token for limited guest access:

```javascript
const ws = new WebSocket("ws://localhost:8000/ws/chat");
// Guest sessions have 5 queries/day limit
```

---

## Code Examples

### JavaScript / Node.js

#### Register & Login

```javascript
// Register
const registerResponse = await fetch("http://localhost:3001/api/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "SecurePass123!",
    name: "User Name"
  })
});

const { token, user } = await registerResponse.json();
localStorage.setItem("jwt_token", token);

// Login
const loginResponse = await fetch("http://localhost:3001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "SecurePass123!"
  })
});

const { token } = await loginResponse.json();
localStorage.setItem("jwt_token", token);
```

#### Get Profile

```javascript
const token = localStorage.getItem("jwt_token");
const response = await fetch("http://localhost:3001/api/user/profile", {
  headers: { "Authorization": `Bearer ${token}` }
});

const profile = await response.json();
console.log(`User: ${profile.name}, Queries: ${profile.totalLifetimeQueries}`);
```

#### WebSocket Chat

```javascript
const token = localStorage.getItem("jwt_token");
const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);

ws.onopen = () => {
  console.log("Connected!");
  ws.send(JSON.stringify({
    type: "user_message",
    content: "Explain React hooks",
    provider: "openai"
  }));
};

let response = "";
ws.onmessage = (event) => {
  const data = event.data;
  if (data.startsWith("data: ")) {
    const token = data.slice(6);
    if (token !== "[DONE]") {
      response += token;
      process.stdout.write(token);
    }
  }
};
```

### Python

#### Register & Login

```python
import requests

BASE_URL = "http://localhost:3001"

# Register
register_response = requests.post(f"{BASE_URL}/api/auth/register", json={
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "User Name"
})

token = register_response.json()["token"]

# Login
login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
    "email": "user@example.com",
    "password": "SecurePass123!"
})

token = login_response.json()["token"]
```

#### Get Profile

```python
import requests

token = "your_jwt_token_here"
headers = {"Authorization": f"Bearer {token}"}

response = requests.get("http://localhost:3001/api/user/profile", headers=headers)
profile = response.json()

print(f"User: {profile['name']}")
print(f"Queries: {profile['totalLifetimeQueries']}")
```

#### WebSocket Chat

```python
import asyncio
import websockets
import json

async def chat(token):
    async with websockets.connect(f"ws://localhost:8000/ws/chat?token={token}") as ws:
        # Send message
        await ws.send(json.dumps({
            "type": "user_message",
            "content": "Explain async/await in Python",
            "provider": "openai"
        }))
        
        # Receive streaming response
        response = ""
        async for message in ws:
            if message.startswith("data: "):
                token = message[6:]
                if token != "[DONE]":
                    response += token
                    print(token, end="", flush=True)
        
        print(f"\nFull response: {response}")

# Run
token = "your_jwt_token_here"
asyncio.run(chat(token))
```

### cURL

#### Register

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "User Name"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Get Profile (replace with your token)

```bash
curl -X GET http://localhost:3001/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### List Conversations

```bash
curl -X GET "http://localhost:8000/api/ai/conversations?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

**Related Documentation**: [← BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) | [→ KNOWN_ISSUES.md](./KNOWN_ISSUES.md)

