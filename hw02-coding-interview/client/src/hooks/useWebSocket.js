import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

/**
 * Custom hook for WebSocket connection with reconnection logic
 * @param {string} sessionId - Session ID to join
 * @param {Function} onCodeUpdate - Callback when code is updated
 * @param {Function} onUserJoined - Callback when user joins
 * @param {Function} onUserLeft - Callback when user leaves
 * @param {Function} onTypingStart - Callback when user starts typing
 * @param {Function} onTypingStop - Callback when user stops typing
 * @returns {Object} Socket instance and connection state
 */
export const useWebSocket = (
  sessionId,
  onCodeUpdate,
  onUserJoined,
  onUserLeft,
  onTypingStart,
  onTypingStop
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
      url: SOCKET_URL,
    });

    // Create real Socket.io connection
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

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
        onCodeUpdate({
          language: data.language,
          clearOutput: data.clearOutput,
        });
      }
    });

    // Execution result event
    socket.on("execution_result_sync", (data) => {
      console.log("⚡ Execution result received:", data);
      if (data.userId !== userIdRef.current && onCodeUpdate) {
        onCodeUpdate({ executionResult: data.result });
      }
    });

    // Typing started event
    socket.on("typing_started", (data) => {
      console.log("⌨️  User started typing:", data);
      if (onTypingStart) {
        onTypingStart(data);
      }
    });

    // Typing stopped event
    socket.on("typing_stopped", (data) => {
      console.log("⌨️  User stopped typing:", data);
      if (onTypingStop) {
        onTypingStop(data);
      }
    });

    // Error events
    socket.on("error", (data) => {
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
  }, [
    sessionId,
    onCodeUpdate,
    onUserJoined,
    onUserLeft,
    onTypingStart,
    onTypingStop,
  ]);

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

  // Send execution result
  const sendExecutionResult = useCallback(
    (result) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit("execution_result", {
          sessionId,
          result,
          userId: userIdRef.current,
          timestamp: Date.now(),
        });
      }
    },
    [sessionId, isConnected]
  );

  // Send typing start
  const sendTypingStart = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing_start", {
        sessionId,
        userId: userIdRef.current,
      });
    }
  }, [sessionId, isConnected]);

  // Send typing stop
  const sendTypingStop = useCallback(() => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing_stop", {
        sessionId,
        userId: userIdRef.current,
      });
    }
  }, [sessionId, isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    activeUsers,
    sendCodeUpdate,
    sendLanguageChange,
    sendExecutionResult,
    sendTypingStart,
    sendTypingStop,
    userId: userIdRef.current,
  };
};
