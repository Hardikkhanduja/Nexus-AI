# Known Issues, Gaps & Roadmap

This document catalogs known issues, incomplete features, and recommended improvements for the Nexus AI platform. Organized by priority and category.

---

## Table of Contents

1. [Critical Blockers](#critical-blockers)
2. [High Priority Issues](#high-priority-issues)
3. [Medium Priority Issues](#medium-priority-issues)
4. [Low Priority Issues](#low-priority-issues)
5. [Testing Checklist](#testing-checklist)
6. [Recommendations for New Team Members](#recommendations-for-new-team-members)

---

## Critical Blockers

These issues prevent core functionality from working. **Must be fixed before production**.

### 🔴 AI Provider Implementations Are Stubs

**Status**: All 4 providers (OpenAI, Anthropic, Groq, Gemini) are non-functional  
**Severity**: CRITICAL  
**Impact**: WebSocket chat endpoint returns "Provider not configured" for all users  
**Location**: [backend/agents/providers/](../backend/agents/providers/)

**Current State**:
```python
# Current (doesn't work)
class OpenAIProvider(BaseProvider):
    async def stream(self, prompt, context, system_prompt):
        raise NotImplementedError("OpenAI provider not yet implemented")
```

**What's Needed**:

| Provider | SDK | Setup Steps | Effort |
|----------|-----|-----------|--------|
| **OpenAI** | `openai` | 1. Get API key from platform.openai.com<br>2. Set OPENAI_API_KEY env var<br>3. Implement stream() method with ChatCompletion.create(stream=True)<br>4. Test with curl/WebSocket | ~2 hours |
| **Anthropic** | `anthropic` | 1. Get API key from console.anthropic.com<br>2. Set ANTHROPIC_API_KEY env var<br>3. Implement stream() method with messages.stream()<br>4. Test with curl/WebSocket | ~2 hours |
| **Groq** | `groq` | 1. Get API key from console.groq.com<br>2. Set GROQ_API_KEY env var<br>3. Implement stream() method with chat.completions.create(stream=True)<br>4. Test with curl/WebSocket | ~2 hours |
| **Gemini** | Already uses OpenRouter API | 1. Get OPENROUTER_API_KEY<br>2. Verify endpoint URL<br>3. Test with WebSocket<br>4. Debug token streaming format | ~1 hour |

**Workaround**: None (feature completely non-functional)

**Next Steps**:
1. Start with OpenAI (most widely used)
2. Refer to [BACKEND_INTEGRATION.md provider templates](./BACKEND_INTEGRATION.md#implementing-ai-providers)
3. Test with WebSocket endpoint first
4. Add error handling for API quota limits
5. Implement retry logic with exponential backoff

---

### 🔴 Incomplete OpenAPI Specification

**Status**: Only `/healthz` endpoint documented  
**Severity**: CRITICAL  
**Impact**: Orval code generation fails; can't auto-generate API clients  
**Location**: [lib/api-spec/openapi.yaml](../lib/api-spec/openapi.yaml)

**Current State**:
```yaml
paths:
  /healthz:
    get:
      summary: Health check
      # ... rest is empty
```

**What's Needed**:
- [ ] Document all 8 Express endpoints (auth, user, preferences, usage)
- [ ] Document all 2 FastAPI REST endpoints (conversations list, get single)
- [ ] Document WebSocket endpoint with schema for messages
- [ ] Define all request/response schemas with examples
- [ ] Include error responses (401, 404, 429, 500)
- [ ] Run `pnpm orval` to re-generate API clients

**Workaround**: Use manual TypeScript types (already defined in [lib/api-zod/](../lib/api-zod/))

**Next Steps**:
1. Copy existing endpoint documentation from [API_REFERENCE.md](./API_REFERENCE.md)
2. Convert to OpenAPI 3.0 schema format
3. Add request/response examples from actual API tests
4. Run Orval code generation
5. Commit generated files

---

### 🔴 WebSocket Real-Time Streaming Not Verified in Frontend

**Status**: Implementation exists but not tested end-to-end  
**Severity**: CRITICAL  
**Impact**: Users may not see token-by-token responses in real-time  
**Location**: [artifacts/nexus-ai/src/pages/](../artifacts/nexus-ai/src/pages/) (chat component)

**What's Needed**:
- [ ] Test WebSocket connection with valid JWT in browser
- [ ] Verify tokens stream in real-time (not buffered)
- [ ] Test error handling (4008, 4009, 4010 close codes)
- [ ] Test reconnection after disconnect
- [ ] Verify message persistence in database
- [ ] Load test with multiple concurrent connections

**Current Uncertainty**:
```javascript
// Does this actually stream tokens or buffer them?
ws.onmessage = (event) => {
  // Need to verify token-by-token vs bulk delivery
  console.log(event.data);
};
```

**Testing Steps**:
```bash
# 1. Start all services
pnpm dev:backend  # FastAPI
pnpm dev:api      # Express
pnpm dev:frontend # React

# 2. In browser console:
const token = localStorage.getItem("jwt_token");
const ws = new WebSocket(`ws://localhost:8000/ws/chat?token=${token}`);

ws.onopen = () => {
  console.log("✓ Connected");
  ws.send(JSON.stringify({
    type: "user_message",
    content: "Say 'Hello' and then 'World' with pauses between",
    provider: "openai"
  }));
};

let messageCount = 0;
ws.onmessage = (event) => {
  console.log(`Message ${++messageCount}:`, event.data);
};

# 3. Expected: 10+ separate messages, each with 1-3 tokens
# 4. If see 1 message with entire response: streaming broken
```

---

## High Priority Issues

Important features missing or partially implemented. **Should be fixed before beta release**.

### 🟡 Email Verification Not Implemented

**Status**: Stub only (logs to console)  
**Severity**: HIGH  
**Impact**: Users can register with fake emails; no way to verify ownership  
**Location**: [artifacts/api-server/src/routes/auth.routes.ts](../artifacts/api-server/src/routes/auth.routes.ts) (lines ~40-50)

**Current Implementation**:
```typescript
// Dev-only: log verification URL to console
if (process.env.NODE_ENV === "production") {
  console.warn("⚠️ Email verification not configured!");
} else {
  console.log("📧 Verification URL:", verificationLink);
}
```

**What's Needed**:
1. Choose SMTP provider:
   - **SendGrid** (easiest for production): $0.10/1K emails
   - **AWS SES** (cheapest): $0.10/1K emails  
   - **Resend** (developer-friendly): Free tier available
   - **Mailgun** (robust): $0.50/1K emails

2. Implement email sending:
```typescript
// Example with Resend
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const sent = await resend.emails.send({
  from: "noreply@nexusai.app",
  to: user.email,
  subject: "Verify your Nexus AI account",
  html: `Click here to verify: <a href="...${token}">Verify Email</a>`
});
```

3. Implement verification endpoint:
```typescript
// POST /api/auth/verify-email?token=...
// Sets emailVerified = true in users table
```

**Timeline**: ~4 hours (choose provider + implement)

---

### 🟡 OAuth Not Implemented (Google/GitHub)

**Status**: Config scaffolded, no callback routes  
**Severity**: HIGH  
**Impact**: Social login unavailable; users must use email+password  
**Location**: [artifacts/api-server/src/lib/auth.config.ts](../artifacts/api-server/src/lib/auth.config.ts)

**Current State**:
```typescript
// Config exists but routes missing
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
// ❌ No OAuth flow implementation
```

**What's Needed**:
1. Install: `npm install passport passport-google-oauth20 passport-github2`
2. Add routes:
   - `GET /api/auth/google` → redirect to Google
   - `GET /api/auth/google/callback` → handle token
   - `GET /api/auth/github` → redirect to GitHub
   - `GET /api/auth/github/callback` → handle token
3. Store provider info in `users.provider` field
4. Link to existing email accounts if already registered

**Timeline**: ~6 hours (OAuth setup + testing)

---

### 🟡 WebSocket Error Recovery Not Implemented

**Status**: No reconnection logic  
**Severity**: HIGH  
**Impact**: Network interruptions drop chat; users lose progress  
**Location**: [artifacts/nexus-ai/src/components/ChatWindow.tsx](../artifacts/nexus-ai/src/components/ChatWindow.tsx) (hypothetical)

**What's Needed**:

```typescript
class ChatClient {
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;  // ms

  async connect() {
    try {
      this.ws = new WebSocket(this.wsUrl);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    } catch (error) {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Reconnecting in ${this.reconnectDelay}ms...`);
        await new Promise(r => setTimeout(r, this.reconnectDelay));
        this.reconnectAttempts++;
        this.reconnectDelay *= 1.5;  // Exponential backoff
        return this.connect();
      } else {
        console.error("Max reconnection attempts reached");
        throw error;
      }
    }
  }
}
```

**Timeline**: ~3 hours (implement + test)

---

### 🟡 Rate Limiting Lacks Burst Protection

**Status**: Only daily limits implemented  
**Severity**: HIGH  
**Impact**: User could make 30 queries in 1 second, then hit limit  
**Location**: [backend/rate_limit/limiter.py](../backend/rate_limit/limiter.py)

**Current Limits**:
- Guest: 5 queries/day
- Registered: 30 queries/day
- ❌ No per-minute limits (bursting)
- ❌ No per-second limits (abuse protection)

**What's Needed**:

Add token-bucket rate limiting:
```python
# New schema
CREATE TABLE rate_limit_tokens (
  user_id UUID PRIMARY KEY,
  tokens FLOAT DEFAULT 10.0,  # Max 10 queries per minute
  last_refill TIMESTAMP DEFAULT NOW()
);

# Check logic
async def check_rate_limit(user_id):
  now = datetime.utcnow()
  row = db.query("SELECT tokens, last_refill FROM rate_limit_tokens WHERE user_id = ?")
  
  # Refill tokens (1 per 6 seconds = 10/min)
  time_since_refill = (now - row.last_refill).seconds
  new_tokens = min(10.0, row.tokens + time_since_refill / 6.0)
  
  if new_tokens < 1.0:
    return False  # Rate limited
  
  db.execute("UPDATE rate_limit_tokens SET tokens = ?, last_refill = ? WHERE user_id = ?",
             (new_tokens - 1.0, now, user_id))
  return True
```

**Timeline**: ~4 hours (design + implementation + testing)

---

## Medium Priority Issues

Technical debt and quality gaps. **Fix before production launch**.

### 🟡 No ESLint Configuration

**Status**: Not installed  
**Severity**: MEDIUM  
**Impact**: Inconsistent code style; hard to catch bugs  
**Location**: N/A (project root)

**What's Needed**:
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react

# Create .eslintrc.json with TypeScript + React rules
# Run: npm run lint (add to package.json)
```

**Timeline**: ~2 hours

---

### 🟡 No Frontend Tests

**Status**: Zero test coverage  
**Severity**: MEDIUM  
**Impact**: Regressions undetected; risky refactoring  
**Location**: [artifacts/nexus-ai/](../artifacts/nexus-ai/)

**What's Needed**:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/dom

# Suggested test files:
# - src/contexts/AuthContext.test.tsx
# - src/pages/Chat.test.tsx (mock WebSocket)
# - src/components/ChatMessage.test.tsx
# - src/hooks/use-toast.test.tsx

# Target: 60%+ coverage
```

**Timeline**: ~12 hours (write 20+ tests)

---

### 🟡 No CI/CD Pipeline

**Status**: Missing  
**Severity**: MEDIUM  
**Impact**: Manual deployment; no automated testing on push  
**Location**: N/A (create `.github/workflows/`)

**What's Needed**:
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '20' }
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

**Timeline**: ~3 hours (setup + test configuration)

---

### 🟡 Backend Logs Not Aggregated

**Status**: Logs only go to stdout  
**Severity**: MEDIUM  
**Impact**: Can't track errors after container restart  
**Location**: [backend/main.py](../backend/main.py), [artifacts/api-server/src/lib/logger.ts](../artifacts/api-server/src/lib/logger.ts)

**What's Needed**:
```python
# Send logs to ElasticSearch or CloudWatch
import logging
from pythonjsonlogger import jsonlogger

handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
handler.setFormatter(formatter)
logger.addHandler(handler)
```

**Timeline**: ~4 hours (choose provider + integrate)

---

## Low Priority Issues

Polish items and future improvements. **Can defer until post-launch**.

### 🟢 Missing .env.example Template

**Status**: N/A  
**Severity**: LOW  
**Impact**: New developers unsure what env vars are needed  

**What's Needed**:
```bash
# Create .env.example with all variables and defaults
# Add to README with setup instructions
```

**Timeline**: ~30 minutes

---

### 🟢 Database Connection Pooling Undocumented

**Status**: Implemented but not explained  
**Severity**: LOW  
**Impact**: Difficult to debug connection issues  

**What's Needed**:
Add documentation to [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md#database-connectivity):
- Pool size tuning (min 5, max 20)
- Connection timeout handling
- Monitoring pool utilization
- Debugging connection leaks

**Timeline**: ~1 hour

---

### 🟢 Conversation Titles Not Auto-Generated

**Status**: Uses first message as title  
**Severity**: LOW  
**Impact**: Long/unwieldy conversation titles  

**What's Needed**:
```python
# After first message stored, call AI to generate title
async def generate_title(first_message: str) -> str:
  prompt = f"Generate a short (5-word max) title for a chat about: {first_message}"
  title = await openai.complete(prompt)
  # Update conversations.title
```

**Timeline**: ~2 hours

---

### 🟢 user_memory Table Unused

**Status**: Schema exists, no queries  
**Severity**: LOW  
**Impact**: Lost opportunity for personalization  

**What's Needed**:
- Populate with user preferences (favorite topics, coding style, etc.)
- Pass to AI providers as context
- Update from conversations over time
- Use for recommendations

**Timeline**: ~8 hours (design + implementation)

---

## Testing Checklist

Before declaring MVP "ready", verify these scenarios:

### User Registration & Authentication

- [ ] **Register** with valid email/password → returns JWT token
- [ ] **Register** with duplicate email → 409 Conflict error
- [ ] **Register** with weak password → 400 Bad Request (specific error)
- [ ] **Login** with correct credentials → returns JWT token
- [ ] **Login** with wrong password → 401 Unauthorized
- [ ] **Login** with non-existent email → 401 Unauthorized
- [ ] JWT token expires after 24 hours
- [ ] Expired token returns 401 on API calls

### User Profile & Preferences

- [ ] **GET /api/user/profile** returns logged-in user's data
- [ ] **PUT /api/user/profile** updates name/avatar
- [ ] **GET /api/preferences** returns defaults for new user
- [ ] **PUT /api/preferences** persists coding language/style
- [ ] **GET /api/usage/stats** shows correct daily/lifetime counts
- [ ] Usage stats reset at midnight UTC

### Rate Limiting

- [ ] Guest users allowed 5 queries/day
- [ ] Registered users allowed 30 queries/day
- [ ] Exceeding limit returns 429 with "limit exceeded" message
- [ ] WebSocket closes with code 4009 when limit exceeded
- [ ] Daily counter resets at UTC midnight (not local time)
- [ ] Manual daily reset works (admin endpoint)

### WebSocket & AI Chat

- [ ] **Connect** to WebSocket with valid JWT → connection accepted
- [ ] **Connect** with invalid JWT → 4008 unauthenticated code
- [ ] **Connect** without token → guest session allowed
- [ ] **Send message** with valid provider → receives streaming tokens
- [ ] **Receive tokens** in real-time (not buffered)
- [ ] Stream ends with `[DONE]` message
- [ ] **Invalid JSON** message → 4010 close code
- [ ] **Provider not configured** → error message, no crash
- [ ] **Message persisted** to database after stream completes
- [ ] **Conversation history** retrievable via GET endpoint

### Database & Persistence

- [ ] New user record created in users table
- [ ] Conversation creates records in conversations + messages tables
- [ ] Messages linked to conversation via foreign key
- [ ] Database reachable from both Express & FastAPI
- [ ] Connection pool not exhausted under load (20 concurrent)
- [ ] Deleted user cascades to conversations/messages

### Error Handling

- [ ] 500 errors include actionable error message (not stack trace)
- [ ] 401 errors prompt re-login
- [ ] 429 errors suggest when limit resets
- [ ] Network errors in WebSocket don't crash frontend
- [ ] Server recovers from database transient errors
- [ ] Invalid input doesn't cause SQL injection

### Security

- [ ] Passwords hashed with bcrypt (not plain text)
- [ ] JWT secret not committed to git
- [ ] SQL queries parameterized (no string concatenation)
- [ ] CORS only allows localhost:5173 (in dev)
- [ ] Prompt injection patterns detected and rejected
- [ ] HTML tags stripped from user input
- [ ] Rate limiting prevents brute force (5 attempts/min on login)

### Performance

- [ ] WebSocket message arrives within 200ms
- [ ] First token from AI arrives within 2 seconds
- [ ] Database query completes within 100ms
- [ ] Frontend loads in under 3 seconds (Lighthouse)
- [ ] No N+1 queries on conversation list
- [ ] Connection pooling reuses connections (not new per request)

---

## Recommendations for New Team Members

### Getting Started

1. **Read documentation in order**:
   - [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup all 3 services
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand components
   - [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) - Deep dive into FastAPI
   - [API_REFERENCE.md](./API_REFERENCE.md) - Endpoint reference

2. **Get services running**:
   ```bash
   # Terminal 1: React frontend
   cd artifacts/nexus-ai && pnpm dev
   
   # Terminal 2: Express API
   cd artifacts/api-server && pnpm dev
   
   # Terminal 3: FastAPI
   cd backend && python -m uvicorn main:app --reload
   
   # Terminal 4: Database
   docker run -d -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:14
   ```

3. **Complete first task**: Fix or implement one of the critical blockers

### Common Tasks

**To add a new API endpoint**:
1. Define Zod schema in [lib/api-zod/](../lib/api-zod/)
2. Add route in [artifacts/api-server/src/routes/](../artifacts/api-server/src/routes/)
3. Update OpenAPI spec in [lib/api-spec/openapi.yaml](../lib/api-spec/openapi.yaml)
4. Run `pnpm orval` to re-generate API client
5. Add tests (eventually)

**To implement an AI provider**:
1. Copy template from [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md#implementing-ai-providers)
2. Add to [backend/agents/providers/](../backend/agents/providers/)
3. Register in [backend/agents/providers/__init__.py](../backend/agents/providers/__init__.py)
4. Set API key in .env
5. Test with WebSocket endpoint

**To debug WebSocket connection**:
1. Open browser DevTools → Network tab
2. Find ws:// connection
3. Check frames tab for messages
4. Close code tells you failure reason (1000=normal, 4008=auth, 4009=rate limit)

**To debug database issues**:
```bash
# Connect to PostgreSQL
psql postgresql://postgres:postgres@localhost:5432/nexus_ai

# Check users table
SELECT id, email, total_lifetime_queries FROM users;

# Check rate limiting
SELECT user_id, queries_used_today, last_reset_date FROM user_limits;

# Check connections
SELECT count(*) FROM pg_stat_activity;
```

### Code Quality

- **Always use TypeScript** in Express/React (no `any` types)
- **Always validate input** with Zod before using
- **Always hash passwords** with bcrypt
- **Always use parameterized queries** (never string concatenation)
- **Always close database connections** (return to pool)
- **Always log errors** with structured logging (Pino/Python logging)
- **Never commit secrets** (.env, API keys, etc.)

### Running Tests

```bash
# Type checking
pnpm typecheck

# Linting (when configured)
pnpm lint

# Unit tests (when configured)
pnpm test

# End-to-end tests
# (Not yet configured - see Medium Priority)
```

### Asking for Help

When stuck:
1. Check [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) (this file)
2. Search issue tracker on GitHub
3. Read related code + comments
4. Write minimal reproduction example
5. Ask in #dev Slack channel with example code

---

**Document Version**: 1.0  
**Last Updated**: 2026-08-18  
**Maintained By**: Development Team  

**Feedback**: Found a gap or outdated info? Update this document or open an issue.

