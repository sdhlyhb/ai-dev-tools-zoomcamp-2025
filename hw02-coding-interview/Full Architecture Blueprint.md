# Full Architecture Blueprint: Real-Time Collaborative Codepad

## 1. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React + Vite Frontend                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Code Editor  │  │  WebSocket   │  │   Session    │         │
│  │ (Monaco/ACE) │  │   Client     │  │  Management  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         HTTP / WebSocket
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   REST API   │  │   Socket.io  │  │ Rate Limiter │         │
│  │   Routes     │  │    Server    │  │   Middleware │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Session Mgmt │  │    Auth      │  │   CORS       │         │
│  │   Service    │  │  Middleware  │  │   Config     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Database (PostgreSQL/MongoDB)                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Sessions   │  │    Users     │  │   Activity   │         │
│  │    Table     │  │   (Optional) │  │     Logs     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Note: In-memory storage for active WebSocket rooms             │
│        (No Redis required for simple deployments)               │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Database Schema

### Sessions Table (PostgreSQL)

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id VARCHAR(12) UNIQUE NOT NULL, -- Short sharable ID
    title VARCHAR(255) DEFAULT 'Untitled Session',
    language VARCHAR(50) DEFAULT 'javascript',
    code TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    is_active BOOLEAN DEFAULT true,
    creator_ip VARCHAR(45), -- IPv6 compatible
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    active_users INTEGER DEFAULT 0,
    total_edits INTEGER DEFAULT 0
);

CREATE INDEX idx_session_id ON sessions(session_id);
CREATE INDEX idx_expires_at ON sessions(expires_at) WHERE is_active = true;
CREATE INDEX idx_created_at ON sessions(created_at);
```

### Activity Logs Table (Optional - for analytics)

```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(12) REFERENCES sessions(session_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'join', 'leave', 'edit', 'language_change'
    user_identifier VARCHAR(100), -- Could be socket ID or anonymous identifier
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB -- Additional event data
);

CREATE INDEX idx_activity_session ON activity_logs(session_id);
CREATE INDEX idx_activity_timestamp ON activity_logs(timestamp);
```

### MongoDB Alternative Schema

```javascript
// sessions collection
{
  _id: ObjectId,
  sessionId: String, // unique, indexed
  title: String,
  language: String,
  code: String,
  createdAt: Date,
  updatedAt: Date,
  expiresAt: Date,
  isActive: Boolean,
  creatorIp: String,
  lastActive: Date,
  activeUsers: Number,
  totalEdits: Number,
  history: [
    {
      timestamp: Date,
      code: String,
      userId: String
    }
  ] // Optional: Keep last N snapshots
}
```

## 3. API Routes

### REST API Endpoints

```javascript
// Session Management
POST   /api/sessions              // Create new session
GET    /api/sessions/:sessionId   // Get session data
PATCH  /api/sessions/:sessionId   // Update session (language, title)
DELETE /api/sessions/:sessionId   // Delete session
GET    /api/sessions/:sessionId/health // Check if session exists

// Session Discovery (Optional)
GET    /api/sessions              // List recent public sessions (paginated)

// Utility
GET    /api/health                // Server health check
GET    /api/languages             // Supported languages list
```

### Detailed Route Specifications

#### POST /api/sessions

**Request:**

```json
{
  "language": "javascript",
  "title": "My Code Session",
  "code": "// Initial code"
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "sessionId": "abc123xyz",
    "shareableLink": "https://codepad.app/abc123xyz",
    "language": "javascript",
    "title": "My Code Session",
    "code": "// Initial code",
    "createdAt": "2025-12-03T10:30:00Z",
    "expiresAt": "2025-12-04T10:30:00Z"
  }
}
```

#### GET /api/sessions/:sessionId

**Response:**

```json
{
  "success": true,
  "session": {
    "sessionId": "abc123xyz",
    "language": "javascript",
    "title": "My Code Session",
    "code": "console.log('Hello');",
    "activeUsers": 3,
    "createdAt": "2025-12-03T10:30:00Z",
    "lastActive": "2025-12-03T11:45:00Z"
  }
}
```

## 4. WebSocket Event Structure

### Socket.io Events

```javascript
// CLIENT -> SERVER Events
{
  // Join a session room
  "join_session": {
    sessionId: "abc123xyz",
    userId: "user_anonymous_123" // Generated on client
  },

  // Code update from user
  "code_update": {
    sessionId: "abc123xyz",
    code: "console.log('new code');",
    cursorPosition: { line: 1, column: 15 },
    timestamp: 1234567890
  },

  // Cursor position update
  "cursor_move": {
    sessionId: "abc123xyz",
    userId: "user_anonymous_123",
    position: { line: 5, column: 10 }
  },

  // Language change
  "language_change": {
    sessionId: "abc123xyz",
    language: "python"
  },

  // User typing indicator
  "user_typing": {
    sessionId: "abc123xyz",
    userId: "user_anonymous_123",
    isTyping: true
  },

  // Request full sync
  "sync_request": {
    sessionId: "abc123xyz"
  },

  // Leave session
  "leave_session": {
    sessionId: "abc123xyz",
    userId: "user_anonymous_123"
  }
}

// SERVER -> CLIENT Events
{
  // Broadcast code changes to all users in room
  "code_sync": {
    code: "console.log('updated');",
    userId: "user_anonymous_456", // Who made the change
    timestamp: 1234567890
  },

  // User joined notification
  "user_joined": {
    userId: "user_anonymous_789",
    activeUsers: 3,
    timestamp: 1234567890
  },

  // User left notification
  "user_left": {
    userId: "user_anonymous_456",
    activeUsers: 2,
    timestamp: 1234567890
  },

  // Cursor position broadcast
  "cursor_update": {
    userId: "user_anonymous_123",
    position: { line: 5, column: 10 },
    color: "#FF5733" // Unique color per user
  },

  // Language changed
  "language_updated": {
    language: "python",
    userId: "user_anonymous_123"
  },

  // Full state sync response
  "full_sync": {
    code: "console.log('current state');",
    language: "javascript",
    activeUsers: 3,
    users: [
      { userId: "user_anonymous_123", color: "#FF5733" },
      { userId: "user_anonymous_456", color: "#33FF57" }
    ]
  },

  // Error events
  "error": {
    type: "session_not_found" | "rate_limit_exceeded" | "invalid_data",
    message: "Session does not exist"
  },

  // Session expired notification
  "session_expired": {
    sessionId: "abc123xyz",
    message: "This session has expired"
  }
}
```

## 5. Security Considerations

### Authentication & Authorization

```javascript
// No user authentication required (like sharepad.io)
// But implement:

1. Session Access Control
   - Anyone with link can access
   - Optional: Add password protection for sessions
   - Rate limit session creation per IP

2. Anonymous User Identification
   - Generate unique client IDs on frontend
   - Store in localStorage
   - Track in Redis for rate limiting

3. Input Validation
   - Sanitize all code input (prevent XSS in metadata)
   - Validate sessionId format (alphanumeric, 12 chars)
   - Limit code size (e.g., 1MB max)
   - Validate language against whitelist
```

### CORS Configuration

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
```

### WebSocket Security

```javascript
io.use((socket, next) => {
  // Validate origin
  const origin = socket.handshake.headers.origin;
  if (!isAllowedOrigin(origin)) {
    return next(new Error("Unauthorized origin"));
  }

  // Rate limiting per socket
  const clientIp = socket.handshake.address;
  if (isRateLimited(clientIp)) {
    return next(new Error("Rate limit exceeded"));
  }

  next();
});
```

### Data Protection

```javascript
// 1. Code Sanitization
const sanitizeCode = (code) => {
  // Remove potentially harmful patterns
  // Limit size
  if (code.length > 1048576) { // 1MB
    throw new Error('Code exceeds maximum size');
  }
  return code;
};

// 2. Session ID Generation (secure random)
const crypto = require('crypto');
const generateSessionId = () => {
  return crypto.randomBytes(6).toString('base64url'); // URL-safe 12 chars
};

// 3. SQL Injection Prevention
// Use parameterized queries with pg or ORM like Prisma

// 4. Environment Variables
// Store sensitive data in .env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=... (if adding auth later)
SESSION_SECRET=...
```

## 6. Rate Limiting Strategy

### Express Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

// Session creation rate limit (using in-memory store)
const createSessionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 sessions per IP per 15 min
  message: "Too many sessions created. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limit (using in-memory store)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: "Too many requests. Please slow down.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to routes
app.post("/api/sessions", createSessionLimiter, createSessionHandler);
app.use("/api", apiLimiter);

// Note: In-memory store is suitable for single-instance deployments.
// For multi-instance production with load balancers, consider using
// a shared store or implement sticky sessions at the load balancer level.
```

### WebSocket Rate Limiting

```javascript
const socketRateLimiter = new Map(); // In-memory rate limiter

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of socketRateLimiter.entries()) {
    if (now > value.resetTime) {
      socketRateLimiter.delete(key);
    }
  }
}, 60000); // Cleanup every minute

io.use((socket, next) => {
  const clientId = socket.handshake.auth.clientId || socket.id;
  const now = Date.now();

  if (!socketRateLimiter.has(clientId)) {
    socketRateLimiter.set(clientId, { count: 1, resetTime: now + 60000 });
    return next();
  }

  const limit = socketRateLimiter.get(clientId);

  if (now > limit.resetTime) {
    // Reset window
    socketRateLimiter.set(clientId, { count: 1, resetTime: now + 60000 });
    return next();
  }

  if (limit.count > 100) {
    // 100 events per minute
    return next(new Error("Rate limit exceeded"));
  }

  limit.count++;
  next();
});

// Per-event rate limiting
socket.on("code_update", async (data) => {
  // Implement debouncing on client side
  // Server-side: Only accept updates every 100ms minimum
  const lastUpdate = socket.data.lastCodeUpdate || 0;
  const now = Date.now();

  if (now - lastUpdate < 100) {
    return; // Ignore too frequent updates
  }

  socket.data.lastCodeUpdate = now;
  // Process update...
});
```

## 7. Implementation Steps

### Phase 1: Backend Setup (Week 1)

```bash
# 1. Initialize project
mkdir codepad-backend
cd codepad-backend
npm init -y

# 2. Install dependencies
npm install express socket.io cors dotenv
npm install pg
npm install express-rate-limit
npm install helmet compression morgan
npm install --save-dev nodemon

# 3. Project structure
backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── socket.js
│   ├── controllers/
│   │   └── sessionController.js
│   ├── middleware/
│   │   ├── rateLimiter.js
│   │   ├── validator.js
│   │   └── errorHandler.js
│   ├── models/
│   │   └── Session.js
│   ├── routes/
│   │   └── sessionRoutes.js
│   ├── services/
│   │   ├── sessionService.js
│   │   └── socketService.js
│   ├── utils/
│   │   ├── sessionIdGenerator.js
│   │   └── logger.js
│   └── app.js
├── .env
├── .env.example
├── package.json
└── server.js
```

### Phase 2: Frontend Setup (Week 1-2)

```bash
# 1. Create React + Vite app
npm create vite@latest codepad-frontend -- --template react
cd codepad-frontend

# 2. Install dependencies
npm install socket.io-client
npm install @monaco-editor/react  # Or use @uiw/react-codemirror
npm install axios
npm install react-router-dom
npm install zustand  # State management
npm install react-hot-toast  # Notifications

# 3. Project structure
frontend/
├── src/
│   ├── components/
│   │   ├── CodeEditor.jsx
│   │   ├── Header.jsx
│   │   ├── UserPresence.jsx
│   │   ├── LanguageSelector.jsx
│   │   └── ShareButton.jsx
│   ├── hooks/
│   │   ├── useSocket.js
│   │   ├── useSession.js
│   │   └── useCodeSync.js
│   ├── services/
│   │   ├── api.js
│   │   └── socketClient.js
│   ├── store/
│   │   └── sessionStore.js
│   ├── utils/
│   │   ├── userIdGenerator.js
│   │   └── colors.js
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Editor.jsx
│   │   └── NotFound.jsx
│   ├── App.jsx
│   └── main.jsx
├── .env
└── package.json
```

### Phase 3: Core Features Implementation (Week 2-3)

**Backend Core:**

```javascript
// src/services/sessionService.js
class SessionService {
  constructor() {
    // Optional: In-memory cache for frequently accessed sessions
    this.sessionCache = new Map();
    this.CACHE_TTL = 300000; // 5 minutes

    // Start periodic cache cleanup
    this.startCacheCleanup();
  }

  async createSession(data) {
    const sessionId = generateSessionId();
    const result = await db.query(
      `
      INSERT INTO sessions (session_id, language, code, title, creator_ip)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [sessionId, data.language, data.code, data.title, data.ip]
    );

    const session = result.rows[0];

    // Cache in memory for quick access
    this.sessionCache.set(sessionId, {
      data: session,
      timestamp: Date.now(),
    });

    return session;
  }

  async getSession(sessionId) {
    // Try in-memory cache first
    const cached = this.sessionCache.get(sessionId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Query database
    const result = await db.query(
      "SELECT * FROM sessions WHERE session_id = $1 AND is_active = true",
      [sessionId]
    );

    if (result.rows.length === 0) return null;

    // Update in-memory cache
    this.sessionCache.set(sessionId, {
      data: result.rows[0],
      timestamp: Date.now(),
    });

    return result.rows[0];
  }

  async updateCode(sessionId, code, userId) {
    await db.query(
      `
      UPDATE sessions 
      SET code = $1, updated_at = NOW(), last_active = NOW(), total_edits = total_edits + 1
      WHERE session_id = $2
    `,
      [code, sessionId]
    );

    // Invalidate cache on update
    this.sessionCache.delete(sessionId);
  }

  // Clean up old cache entries periodically
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.sessionCache.entries()) {
        if (now - value.timestamp > this.CACHE_TTL) {
          this.sessionCache.delete(key);
        }
      }
    }, 60000); // Run every minute
  }
}
```

**Socket Server:**

```javascript
// src/services/socketService.js
class SocketService {
  constructor(io) {
    this.io = io;
    this.setupListeners();
  }

  setupListeners() {
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join_session", async (data) => {
        const { sessionId, userId } = data;

        // Validate session exists
        const session = await sessionService.getSession(sessionId);
        if (!session) {
          socket.emit("error", { type: "session_not_found" });
          return;
        }

        // Join room
        socket.join(sessionId);
        socket.data.sessionId = sessionId;
        socket.data.userId = userId;

        // Update active users count
        const roomSize =
          this.io.sockets.adapter.rooms.get(sessionId)?.size || 0;

        // Update database with active user count (optional)
        await db.query(
          "UPDATE sessions SET active_users = $1, last_active = NOW() WHERE session_id = $2",
          [roomSize, sessionId]
        );

        // Notify others
        socket.to(sessionId).emit("user_joined", {
          userId,
          activeUsers: roomSize,
          timestamp: Date.now(),
        });

        // Send current state to new user
        socket.emit("full_sync", {
          code: session.code,
          language: session.language,
          activeUsers: roomSize,
        });
      });

      socket.on("code_update", async (data) => {
        const { sessionId, code, cursorPosition } = data;
        const userId = socket.data.userId;

        // Update database (debounced)
        await sessionService.updateCode(sessionId, code, userId);

        // Broadcast to others in room
        socket.to(sessionId).emit("code_sync", {
          code,
          userId,
          cursorPosition,
          timestamp: Date.now(),
        });
      });

      socket.on("cursor_move", (data) => {
        const { sessionId, position } = data;
        const userId = socket.data.userId;

        socket.to(sessionId).emit("cursor_update", {
          userId,
          position,
          color: getUserColor(userId),
        });
      });

      socket.on("language_change", async (data) => {
        const { sessionId, language } = data;
        const userId = socket.data.userId;

        await sessionService.updateLanguage(sessionId, language);

        this.io.to(sessionId).emit("language_updated", {
          language,
          userId,
        });
      });

      socket.on("disconnect", async () => {
        const sessionId = socket.data.sessionId;
        const userId = socket.data.userId;

        if (sessionId) {
          const roomSize =
            this.io.sockets.adapter.rooms.get(sessionId)?.size || 0;

          socket.to(sessionId).emit("user_left", {
            userId,
            activeUsers: roomSize,
          });

          // Update database with active user count (optional)
          await db.query(
            "UPDATE sessions SET active_users = $1, last_active = NOW() WHERE session_id = $2",
            [roomSize, sessionId]
          );
        }
      });
    });
  }
}
```

**Frontend Editor Component:**

```javascript
// src/components/CodeEditor.jsx
import { Editor } from "@monaco-editor/react";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState } from "react";

export default function CodeEditor({ sessionId }) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const socket = useSocket();

  useEffect(() => {
    if (!socket || !sessionId) return;

    // Join session
    socket.emit("join_session", {
      sessionId,
      userId: localStorage.getItem("userId"),
    });

    // Listen for code updates
    socket.on("code_sync", (data) => {
      if (data.userId !== localStorage.getItem("userId")) {
        setCode(data.code);
      }
    });

    socket.on("full_sync", (data) => {
      setCode(data.code);
      setLanguage(data.language);
    });

    return () => {
      socket.off("code_sync");
      socket.off("full_sync");
    };
  }, [socket, sessionId]);

  const handleCodeChange = (value) => {
    setCode(value);

    // Emit change with debouncing
    if (socket) {
      socket.emit("code_update", {
        sessionId,
        code: value,
        cursorPosition: { line: 0, column: 0 }, // Get from editor
      });
    }
  };

  return (
    <Editor
      height="90vh"
      language={language}
      value={code}
      onChange={handleCodeChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
```

### Phase 4: Testing & Optimization (Week 3-4)

1. **Load Testing**

   - Use Artillery or k6 for WebSocket load testing
   - Test with 100+ concurrent users per session
   - Measure latency and throughput

2. **Database Optimization**

   - Add indexes on frequently queried columns
   - Set up automatic session cleanup (cron job for expired sessions)
   - Implement connection pooling
   - Consider read replicas for high-traffic scenarios

3. **Client Optimization**
   - Debounce code updates (300ms)
   - Implement operational transformation or CRDT for conflict resolution
   - Lazy load Monaco editor

## 8. Deployment Recommendations

### Architecture

```
                    ┌──────────────┐
                    │   Cloudflare │
                    │   /  Nginx   │
                    └──────┬───────┘
                           │
                ┌──────────┴──────────┐
                │                     │
          ┌─────▼─────┐         ┌────▼────┐
          │  Frontend │         │ Backend │
          │   Vercel  │         │  Railway│
          │  /Netlify │         │ /Render │
          └───────────┘         └────┬────┘
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                    ┌─────▼──────┐             │
                    │ PostgreSQL │             │
                    │  /MongoDB  │             │
                    └────────────┘             │
```

### Platform Recommendations

**Frontend (React + Vite):**

- **Vercel** (recommended) - Zero config, auto SSL, CDN
- **Netlify** - Alternative, similar features
- **Cloudflare Pages** - Best global CDN

**Backend (Express + Socket.io):**

- **Railway** (recommended) - Easy deployment, WebSocket support
- **Render** - Good alternative, free tier available
- **Fly.io** - Global edge deployment
- **AWS ECS/Fargate** - For production scale

**Database:**

- **Neon** (PostgreSQL) - Serverless, auto-scaling
- **Supabase** - PostgreSQL with real-time features
- **MongoDB Atlas** - If using MongoDB
- **SQLite** - For development and simple single-instance deployments

### Deployment Configuration

**Docker Compose (for local development):**

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/codepad
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3000
      - VITE_WS_URL=ws://localhost:3000
    volumes:
      - ./frontend:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=codepad
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

**Production Environment Variables:**

```bash
# Backend .env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
FRONTEND_URL=https://codepad.app
SESSION_DURATION=86400  # 24 hours in seconds
MAX_CODE_SIZE=1048576   # 1MB
RATE_LIMIT_WINDOW=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10
DB_POOL_SIZE=20  # Database connection pool size

# Frontend .env
VITE_API_URL=https://api.codepad.app
VITE_WS_URL=wss://api.codepad.app
VITE_SESSION_EXPIRY=86400000  # 24 hours in milliseconds
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: cd backend && npm install && npm test
      - run: cd frontend && npm install && npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g railway
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          npm install -g vercel
          cd frontend && vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 9. Additional Enhancements

### Future Features (Post-MVP)

1. **Version History** - Track code changes with timestamps
2. **Code Execution** - Run code in sandboxed environment
3. **Export Options** - Download code as file
4. **Themes** - Multiple editor themes
5. **Auto-save to Cloud** - Optional user accounts
6. **Voice Chat** - WebRTC integration for collaboration
7. **Permissions** - Read-only mode, admin controls
8. **Templates** - Pre-configured code snippets
9. **Analytics Dashboard** - Session statistics
10. **Mobile App** - React Native companion app

### Monitoring & Analytics

```javascript
// Use services like:
- Sentry - Error tracking
- LogRocket - Session replay
- PostHog - Product analytics
- Datadog - Infrastructure monitoring
```

This architecture provides a solid foundation for building a production-ready collaborative code editor. Start with the MVP features and iterate based on user feedback!
