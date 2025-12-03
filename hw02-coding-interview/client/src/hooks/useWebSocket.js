import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

/**
 * Custom hook for WebSocket connection with reconnection logic
 * @param {string} sessionId - Session ID to join
 * @param {Function} onCodeUpdate - Callback when code is updated
 * @param {Function} onUserJoined - Callback when user joins
 * @param {Function} onUserLeft - Callback when user leaves
 * @returns {Object} Socket instance and connection state
 */
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

    // MOCK: Simulate socket connection
    // In real implementation, this would be: socketRef.current = io(SOCKET_URL);

    const mockSocket = createMockSocket(sessionId, userIdRef.current);
    socketRef.current = mockSocket;

    // Connection established
    mockSocket.on("connect", () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);

      // Join session room
      mockSocket.emit("join_session", {
        sessionId,
        userId: userIdRef.current,
      });
    });

    // Connection error
    mockSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    });

    // Disconnection
    mockSocket.on("disconnect", (reason) => {
      console.log("🔌 WebSocket disconnected:", reason);
      setIsConnected(false);

      // Attempt reconnection
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        handleReconnect();
      }
    });

    // Listen for code sync events
    mockSocket.on("code_sync", (data) => {
      console.log("📝 Code sync received:", data);
      if (data.userId !== userIdRef.current && onCodeUpdate) {
        onCodeUpdate(data);
      }
    });

    // Listen for full sync (initial state)
    mockSocket.on("full_sync", (data) => {
      console.log("🔄 Full sync received:", data);
      if (onCodeUpdate) {
        onCodeUpdate(data);
      }
      setActiveUsers(data.activeUsers || 1);
    });

    // User joined event
    mockSocket.on("user_joined", (data) => {
      console.log("👋 User joined:", data);
      setActiveUsers(data.activeUsers);
      if (onUserJoined) {
        onUserJoined(data);
      }
    });

    // User left event
    mockSocket.on("user_left", (data) => {
      console.log("👋 User left:", data);
      setActiveUsers(data.activeUsers);
      if (onUserLeft) {
        onUserLeft(data);
      }
    });

    // Language updated event
    mockSocket.on("language_updated", (data) => {
      console.log("🔤 Language updated:", data);
      if (onCodeUpdate) {
        onCodeUpdate({ language: data.language });
      }
    });

    // Error events
    mockSocket.on("error", (data) => {
      console.error("⚠️ Socket error:", data);
    });

    // Cleanup on unmount
    return () => {
      console.log("🔌 Disconnecting WebSocket...");
      if (socketRef.current) {
        socketRef.current.emit("leave_session", {
          sessionId,
          userId: userIdRef.current,
        });
        socketRef.current.disconnect();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId, onCodeUpdate, onUserJoined, onUserLeft]);

  // Reconnection handler
  const handleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("🔄 Attempting to reconnect...");
      if (socketRef.current) {
        socketRef.current.connect();
      }
    }, 3000); // Retry after 3 seconds
  }, []);

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

/**
 * Create a mock socket for development without backend
 * This simulates real Socket.io behavior
 */
function createMockSocket(sessionId, userId) {
  const eventHandlers = new Map();
  let connected = false;

  const mockSocket = {
    on: (event, handler) => {
      if (!eventHandlers.has(event)) {
        eventHandlers.set(event, []);
      }
      eventHandlers.get(event).push(handler);
    },

    emit: (event, data) => {
      console.log(`📤 Mock emit: ${event}`, data);

      // Simulate server responses
      if (event === "join_session") {
        setTimeout(() => {
          trigger("full_sync", {
            code: "// Welcome to the session!\n",
            language: "javascript",
            activeUsers: 1,
          });
        }, 500);
      }

      if (event === "code_update") {
        // Simulate broadcasting to other users
        // In reality, this would come from the server
        // For mock, we don't echo back to self
      }

      if (event === "language_change") {
        setTimeout(() => {
          trigger("language_updated", {
            language: data.language,
            userId: data.userId,
          });
        }, 200);
      }
    },

    connect: () => {
      console.log("🔌 Mock: Connecting...");
      setTimeout(() => {
        connected = true;
        trigger("connect");
      }, 1000);
    },

    disconnect: () => {
      console.log("🔌 Mock: Disconnecting...");
      connected = false;
      trigger("disconnect", "client disconnect");
    },

    connected: () => connected,
  };

  // Trigger event handlers
  function trigger(event, data) {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  // Auto-connect
  setTimeout(() => {
    connected = true;
    trigger("connect");
  }, 1000);

  return mockSocket;
}
