# Client-Server Integration Guide

This guide explains how to connect the React frontend to the Express.js backend.

## Current Status

- **Frontend**: Uses mock API calls and mock WebSocket
- **Backend**: Fully implemented with real endpoints and WebSocket

## Integration Steps

### 1. Start the Backend Server

```bash
cd server
npm install
npm run dev
```

Server will be running at `http://localhost:3000`

### 2. Update Client API Module

Replace the mock implementation in `client/src/api/session.js`:

```javascript
// client/src/api/session.js
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const createSession = async (data = {}) => {
  const response = await fetch(`${API_BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const getSession = async (sessionId) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
  return response.json();
};

export const updateSession = async (sessionId, updates) => {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return response.json();
};

export const getSupportedLanguages = async () => {
  const response = await fetch(`${API_BASE_URL}/languages`);
  return response.json();
};

export const executeCode = async (code, language, sessionId) => {
  const response = await fetch(`${API_BASE_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language, sessionId }),
  });
  return response.json();
};

// No need for initializeDemoSession - demo session exists on backend
```

### 3. Update WebSocket Hook

Replace the mock socket in `client/src/hooks/useWebSocket.js`:

```javascript
// client/src/hooks/useWebSocket.js
import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export const useWebSocket = (
  sessionId,
  onCodeUpdate,
  onUserJoined,
  onUserLeft
) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(0);
  const reconnectTimeoutRef = useRef(null);
  const userIdRef = useRef(null);

  // Generate or retrieve user ID
  useEffect(() => {
    if (!userIdRef.current) {
      userIdRef.current =
        localStorage.getItem("userId") ||
        `user_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("userId", userIdRef.current);
    }
  }, []);

  // Establish WebSocket connection
  useEffect(() => {
    if (!sessionId) return;

    console.log("🔌 Connecting to WebSocket...", {
      sessionId,
      userId: userIdRef.current,
    });

    // Real Socket.io connection
    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    // Connection established
    socket.on("connect", () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);

      // Join session room
      socket.emit("join_session", {
        sessionId,
        userId: userIdRef.current,
      });
    });

    // Connection error
    socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    });

    // Disconnection
    socket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
      setIsConnected(false);
    });

    // Listen for code sync events
    socket.on("code_sync", (data) => {
      console.log("📝 Code sync received:", data);
      if (data.userId !== userIdRef.current && onCodeUpdate) {
        onCodeUpdate(data);
      }
    });

    // Listen for full sync (initial state)
    socket.on("full_sync", (data) => {
      console.log("🔄 Full sync received:", data);
      if (onCodeUpdate) {
        onCodeUpdate(data);
      }
      setActiveUsers(data.activeUsers || 1);
    });

    // User joined event
    socket.on("user_joined", (data) => {
      console.log("👋 User joined:", data);
      setActiveUsers(data.activeUsers);
      if (onUserJoined) {
        onUserJoined(data);
      }
    });

    // User left event
    socket.on("user_left", (data) => {
      console.log("👋 User left:", data);
      setActiveUsers(data.activeUsers);
      if (onUserLeft) {
        onUserLeft(data);
      }
    });

    // Language updated event
    socket.on("language_updated", (data) => {
      console.log("🔤 Language updated:", data);
      if (onCodeUpdate) {
        onCodeUpdate({ language: data.language });
      }
    });

    // Error events
    socket.on("error", (data) => {
      console.error("⚠️ Socket error:", data);
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting WebSocket...");
      if (socket) {
        socket.emit("leave_session", {
          sessionId,
          userId: userIdRef.current,
        });
        socket.disconnect();
      }
    };
  }, [sessionId, onCodeUpdate, onUserJoined, onUserLeft]);

  // Send code update
  const sendCodeUpdate = useCallback(
    (code) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("code_update", {
          sessionId,
          code,
          userId: userIdRef.current,
          timestamp: Date.now(),
        });
      }
    },
    [sessionId, isConnected]
  );

  // Send language change
  const sendLanguageChange = useCallback(
    (language) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("language_change", {
          sessionId,
          language,
          userId: userIdRef.current,
        });
      }
    },
    [sessionId, isConnected]
  );

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    sendCodeUpdate,
    sendLanguageChange,
    userId: userIdRef.current,
  };
};
```

### 4. Update Code Execution in EditorPage

Replace the mock execution in `client/src/pages/EditorPage.jsx`:

```javascript
// In handleRunCode function
const handleRunCode = async () => {
  setIsRunning(true);
  showToast("Running code...", "info");

  try {
    const result = await executeCode(code, language, sessionId);

    if (result.success) {
      setOutput({
        success: true,
        output: result.output,
        executionTime: result.executionTime,
      });
      setShowOutput(true);
      showToast("Code executed successfully!", "success");
    } else {
      setOutput({
        success: false,
        output: result.error || "Execution failed",
        executionTime: result.executionTime || "0ms",
      });
      setShowOutput(true);
      showToast("Code execution failed", "error");
    }
  } catch (error) {
    console.error("Code execution failed:", error);
    setOutput({
      success: false,
      output: "Error: " + error.message,
      executionTime: "0ms",
    });
    setShowOutput(true);
    showToast("Code execution failed", "error");
  } finally {
    setIsRunning(false);
  }
};
```

### 5. Environment Configuration

Create `client/.env`:

```bash
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

### 6. Start Both Servers

**Terminal 1 - Backend:**

```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**

```bash
cd client
npm run dev
```

## Testing the Integration

### 1. Create a Session

- Open `http://localhost:5173`
- Click "Create New Session"
- Verify session is created on backend

### 2. Real-Time Collaboration

- Open the session URL in two browser windows
- Type in one window
- Verify changes appear in the other window

### 3. Language Switching

- Change language from JavaScript to Python
- Verify both clients update

### 4. Code Execution

- Write some code
- Click "Run" button
- Verify output appears in side panel

### 5. User Presence

- Watch the active user count
- Open/close windows to see count change

## Troubleshooting

### CORS Errors

If you see CORS errors, verify:

- Backend CORS is configured for `http://localhost:5173`
- Check `server/src/config/index.js` - `clientUrl` setting

### WebSocket Connection Failed

- Check backend is running on port 3000
- Verify no firewall blocking
- Check browser console for connection errors

### Session Not Found

- Backend initializes with demo-session
- For new sessions, verify POST /api/sessions works
- Check network tab in DevTools

### Code Not Syncing

- Open browser console on both clients
- Look for WebSocket messages
- Verify both clients joined same session

## Production Deployment

### Backend

```bash
# Build and deploy backend
cd server
npm install --production
pm2 start src/index.js --name collabcodepad-api

# Or use Docker
docker build -t collabcodepad-api .
docker run -p 3000:3000 --env-file .env collabcodepad-api
```

### Frontend

```bash
# Build frontend
cd client
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - AWS S3 + CloudFront
# - Your own server
```

### Environment Variables (Production)

**Backend:**

```
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-frontend-domain.com
DATABASE_URL=postgres://...
REDIS_URL=redis://...
```

**Frontend:**

```
VITE_API_URL=https://api.your-domain.com/api
VITE_WS_URL=https://api.your-domain.com
```

## API Endpoints Reference

| Method | Endpoint                  | Description    |
| ------ | ------------------------- | -------------- |
| GET    | `/`                       | API info       |
| GET    | `/health`                 | Health check   |
| POST   | `/api/sessions`           | Create session |
| GET    | `/api/sessions/:id`       | Get session    |
| PATCH  | `/api/sessions/:id`       | Update session |
| DELETE | `/api/sessions/:id`       | Delete session |
| GET    | `/api/sessions/:id/users` | Get users      |
| GET    | `/api/languages`          | Get languages  |
| POST   | `/api/execute`            | Execute code   |

## WebSocket Events Reference

### Client → Server

- `join_session` - Join room
- `leave_session` - Leave room
- `code_update` - Send code
- `language_change` - Change language

### Server → Client

- `connect` - Connected
- `disconnect` - Disconnected
- `full_sync` - Initial state
- `code_sync` - Code update
- `user_joined` - User joined
- `user_left` - User left
- `language_updated` - Language changed
- `error` - Error occurred

## Next Steps

1. ✅ Remove all mock implementations
2. ✅ Test real-time collaboration
3. ✅ Test code execution
4. ✅ Test error handling
5. 🔜 Add authentication
6. 🔜 Replace mock database
7. 🔜 Deploy to production

The integration is straightforward - just replace the mock implementations with real API calls!
