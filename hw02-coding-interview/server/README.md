# CollabCodePad Server

Backend server for the real-time collaborative code editor. Built with Express.js, Socket.io, and mock in-memory database.

## Features

- ✅ RESTful API for session management
- ✅ WebSocket real-time synchronization (Socket.io)
- ✅ Code execution in sandboxed environment (mocked)
- ✅ Multi-language support (JavaScript, Python)
- ✅ User presence tracking
- ✅ Session expiration and cleanup
- ✅ Comprehensive test suite
- ✅ CORS and security middleware
- ✅ Health check endpoints

## Prerequisites

- Node.js 18+ and npm
- No database required (uses in-memory mock database)

## Installation

```bash
cd server
npm install
```

## Configuration

Create a `.env` file in the server directory (or copy from `.env.example`):

```bash
cp .env.example .env
```

Environment variables:

| Variable                    | Description             | Default                 |
| --------------------------- | ----------------------- | ----------------------- |
| `PORT`                      | Server port             | `3000`                  |
| `NODE_ENV`                  | Environment             | `development`           |
| `CLIENT_URL`                | Frontend URL for CORS   | `http://localhost:5173` |
| `SESSION_TTL_HOURS`         | Session expiration time | `24`                    |
| `MAX_ACTIVE_USERS`          | Max users per session   | `50`                    |
| `EXECUTION_TIMEOUT_MS`      | Code execution timeout  | `5000`                  |
| `EXECUTION_MEMORY_LIMIT_MB` | Memory limit            | `128`                   |

## Running the Server

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on `http://localhost:3000`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## API Endpoints

### Session Management

#### Create Session

```http
POST /api/sessions
Content-Type: application/json

{
  "language": "javascript",
  "code": "// Your code here",
  "title": "My Session"
}
```

**Response (201):**

```json
{
  "success": true,
  "session": {
    "sessionId": "abc123xyz",
    "language": "javascript",
    "code": "// Your code here",
    "title": "My Session",
    "createdAt": "2025-12-03T10:30:00Z",
    "updatedAt": "2025-12-03T10:30:00Z",
    "activeUsers": 0
  },
  "shareableLink": "http://localhost:5173/session/abc123xyz"
}
```

#### Get Session

```http
GET /api/sessions/:sessionId
```

**Response (200):**

```json
{
  "success": true,
  "session": {
    "sessionId": "abc123xyz",
    "language": "javascript",
    "code": "// Your code here",
    "title": "My Session",
    "activeUsers": 2
  }
}
```

#### Update Session

```http
PATCH /api/sessions/:sessionId
Content-Type: application/json

{
  "code": "console.log('Updated');",
  "language": "python",
  "title": "Updated Title"
}
```

**Response (200):**

```json
{
  "success": true,
  "session": {
    "sessionId": "abc123xyz",
    "code": "console.log('Updated');",
    "language": "python",
    "title": "Updated Title"
  }
}
```

#### Delete Session

```http
DELETE /api/sessions/:sessionId
```

**Response (200):**

```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

#### Get Active Users

```http
GET /api/sessions/:sessionId/users
```

**Response (200):**

```json
{
  "success": true,
  "users": [
    {
      "userId": "user_abc123",
      "connectedAt": "2025-12-03T10:30:00Z",
      "lastActivity": "2025-12-03T10:35:00Z"
    }
  ],
  "count": 1
}
```

### Languages

#### Get Supported Languages

```http
GET /api/languages
```

**Response (200):**

```json
{
  "success": true,
  "languages": [
    {
      "value": "javascript",
      "label": "JavaScript",
      "extension": "js",
      "version": "Node.js 20.x"
    },
    {
      "value": "python",
      "label": "Python",
      "extension": "py",
      "version": "Python 3.11"
    }
  ]
}
```

### Code Execution

#### Execute Code

```http
POST /api/execute
Content-Type: application/json

{
  "code": "console.log('Hello, World!');",
  "language": "javascript",
  "sessionId": "abc123xyz"
}
```

**Response (200):**

```json
{
  "success": true,
  "output": "Hello, World!\n",
  "executionTime": "124ms"
}
```

**Error Response (200):**

```json
{
  "success": false,
  "output": "",
  "error": "SyntaxError: Unexpected token",
  "executionTime": "45ms"
}
```

**Timeout Response (408):**

```json
{
  "success": false,
  "error": "Execution timeout after 5 seconds",
  "executionTime": "5000ms"
}
```

### Health Check

```http
GET /health
GET /api/health
```

**Response (200):**

```json
{
  "status": "ok",
  "timestamp": "2025-12-03T10:30:00Z",
  "uptime": 3600
}
```

## WebSocket Events

The server uses Socket.io on `/socket.io` path.

### Client → Server Events

#### join_session

Join a coding session room.

```javascript
socket.emit("join_session", {
  sessionId: "abc123xyz",
  userId: "user_abc123",
});
```

**Server Response:** `full_sync` event with session state

#### leave_session

Leave a coding session room.

```javascript
socket.emit("leave_session", {
  sessionId: "abc123xyz",
  userId: "user_abc123",
});
```

#### code_update

Send code changes to other users.

```javascript
socket.emit("code_update", {
  sessionId: "abc123xyz",
  code: 'console.log("Updated");',
  userId: "user_abc123",
  timestamp: Date.now(),
});
```

**Broadcast:** `code_sync` event to other users

#### language_change

Change programming language.

```javascript
socket.emit("language_change", {
  sessionId: "abc123xyz",
  language: "python",
  userId: "user_abc123",
});
```

**Broadcast:** `language_updated` event to all users

### Server → Client Events

#### connect

Connection established.

```javascript
socket.on("connect", () => {
  console.log("Connected:", socket.id);
});
```

#### disconnect

Connection closed.

```javascript
socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

#### full_sync

Initial session state after joining.

```javascript
socket.on("full_sync", (data) => {
  // data: { code, language, activeUsers }
});
```

#### code_sync

Code update from another user.

```javascript
socket.on("code_sync", (data) => {
  // data: { code, userId, timestamp }
});
```

#### user_joined

User joined the session.

```javascript
socket.on("user_joined", (data) => {
  // data: { userId, activeUsers }
});
```

#### user_left

User left the session.

```javascript
socket.on("user_left", (data) => {
  // data: { userId, activeUsers }
});
```

#### language_updated

Language changed.

```javascript
socket.on("language_updated", (data) => {
  // data: { language, userId }
});
```

#### error

Error occurred.

```javascript
socket.on("error", (data) => {
  // data: { message, code? }
});
```

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── index.js           # Configuration management
│   ├── controllers/
│   │   ├── sessionController.js
│   │   ├── languageController.js
│   │   └── executionController.js
│   ├── db/
│   │   └── index.js           # Mock database
│   ├── routes/
│   │   └── index.js           # API routes
│   ├── socket/
│   │   └── index.js           # WebSocket handlers
│   └── index.js               # Server entry point
├── __tests__/
│   ├── session.test.js
│   ├── language.test.js
│   ├── execution.test.js
│   ├── websocket.test.js
│   └── health.test.js
├── package.json
├── .env.example
└── README.md
```

## Database

Currently uses an **in-memory mock database** (`Map`-based) with the following features:

- Session CRUD operations
- User tracking per session
- Automatic session expiration
- Demo session (never expires)
- Background cleanup job

### Replacing with Real Database

To replace the mock database with a real one (PostgreSQL, MongoDB, etc.):

1. Install database driver:

   ```bash
   npm install pg  # PostgreSQL
   # or
   npm install mongoose  # MongoDB
   ```

2. Create new database module in `src/db/`:

   ```javascript
   // src/db/postgres.js or src/db/mongo.js
   ```

3. Implement the same interface:

   - `createSession(data)`
   - `getSession(sessionId)`
   - `updateSession(sessionId, updates)`
   - `deleteSession(sessionId)`
   - `addUser(sessionId, userId)`
   - `removeUser(sessionId, userId)`
   - `getSessionUsers(sessionId)`

4. Update import in controllers and socket handlers

## Security Considerations

### Current Implementation

- CORS enabled for specified client URL
- Helmet.js for security headers
- Request body size limited to 10MB
- Basic input validation

### Production Recommendations

- Add authentication (JWT, OAuth)
- Implement rate limiting
- Add API key validation
- Use HTTPS/WSS
- Implement proper code sandboxing (Docker, VM2)
- Add request logging and monitoring
- Database connection pooling
- Environment-based configuration
- Add input sanitization

## Code Execution Security

**⚠️ Current Implementation:** Mock execution for development

**Production Requirements:**

- Use Docker containers for isolation
- Implement resource limits (CPU, memory, time)
- Disable network access from code
- Restrict file system access
- Use dedicated execution service (e.g., Judge0, Piston)
- Log all executions for audit

## Performance Optimization

### Current Implementation

- In-memory database (fast but not persistent)
- Session cleanup every hour
- Compression middleware

### Production Recommendations

- Use Redis for session cache
- Implement database connection pooling
- Add CDN for static assets
- Use clustering (PM2)
- Add load balancing
- Implement WebSocket scaling (Redis adapter)
- Database indexing on sessionId

## Testing

Test coverage includes:

- ✅ Session CRUD operations (17 tests)
- ✅ Language API (4 tests)
- ✅ Code execution (9 tests)
- ✅ WebSocket events (10+ tests)
- ✅ Health checks (5 tests)
- ✅ Error handling
- ✅ Edge cases

Run with coverage:

```bash
npm run test:coverage
```

## Deployment

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY src ./src
EXPOSE 3000
CMD ["node", "src/index.js"]
```

Build and run:

```bash
docker build -t collabcodepad-server .
docker run -p 3000:3000 --env-file .env collabcodepad-server
```

### Cloud Platforms

- **Heroku:** `git push heroku main`
- **Railway:** Connect GitHub repo
- **Render:** Deploy from GitHub
- **AWS/GCP/Azure:** Use container services

## Troubleshooting

### Port Already in Use

```bash
# Change port in .env
PORT=3001
```

### WebSocket Connection Failed

- Check CORS settings in config
- Verify client URL matches
- Check firewall rules

### Tests Failing

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm test
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Ensure all tests pass
5. Submit pull request

## License

MIT

---

Built with Express.js + Socket.io
