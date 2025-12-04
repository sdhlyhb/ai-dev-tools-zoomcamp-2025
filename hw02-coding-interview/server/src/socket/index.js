import { Server } from "socket.io";
import { db } from "../db/index.js";
import { config } from "../config/index.js";

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io",
  });

  // Track connected users
  const connectedUsers = new Map(); // socketId -> { userId, sessionId }

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    /**
     * Join session room
     */
    socket.on("join_session", async (data) => {
      try {
        const { sessionId, userId } = data;

        if (!sessionId || !userId) {
          socket.emit("error", {
            message: "Session ID and User ID are required",
          });
          return;
        }

        // Check if session exists
        const session = db.getSession(sessionId);
        if (!session) {
          socket.emit("error", { message: "Session not found" });
          return;
        }

        // Join the room
        socket.join(sessionId);
        connectedUsers.set(socket.id, { userId, sessionId });

        // Add user to session
        const activeUsers = db.addUser(sessionId, userId);

        console.log(`👤 User ${userId} joined session ${sessionId}`);

        // Send full sync to the joining user
        socket.emit("full_sync", {
          code: session.code,
          language: session.language,
          activeUsers,
        });

        // Notify other users in the room
        socket.to(sessionId).emit("user_joined", {
          userId,
          activeUsers,
        });
      } catch (error) {
        console.error("Error joining session:", error);
        socket.emit("error", { message: "Failed to join session" });
      }
    });

    /**
     * Leave session room
     */
    socket.on("leave_session", async (data) => {
      try {
        const { sessionId, userId } = data;

        if (!sessionId || !userId) {
          return;
        }

        // Leave the room
        socket.leave(sessionId);

        // Remove user from session
        const activeUsers = db.removeUser(sessionId, userId);

        console.log(`👤 User ${userId} left session ${sessionId}`);

        // Notify other users in the room
        socket.to(sessionId).emit("user_left", {
          userId,
          activeUsers,
        });

        // Remove from connected users
        connectedUsers.delete(socket.id);
      } catch (error) {
        console.error("Error leaving session:", error);
      }
    });

    /**
     * Code update
     */
    socket.on("code_update", async (data) => {
      try {
        const { sessionId, code, userId, timestamp } = data;

        if (!sessionId || code === undefined || !userId) {
          socket.emit("error", { message: "Invalid code update data" });
          return;
        }

        // Update session in database
        db.updateSession(sessionId, { code });

        // Broadcast to other users in the room (exclude sender)
        socket.to(sessionId).emit("code_sync", {
          code,
          userId,
          timestamp: timestamp || Date.now(),
        });

        console.log(`📝 Code updated in session ${sessionId} by ${userId}`);
      } catch (error) {
        console.error("Error updating code:", error);
        socket.emit("error", { message: "Failed to update code" });
      }
    });

    /**
     * Language change
     */
    socket.on("language_change", async (data) => {
      try {
        const { sessionId, language, userId } = data;

        if (!sessionId || !language || !userId) {
          socket.emit("error", { message: "Invalid language change data" });
          return;
        }

        // Validate language
        if (!["javascript", "python"].includes(language)) {
          socket.emit("error", { message: "Invalid language" });
          return;
        }

        // Update session in database
        db.updateSession(sessionId, { language });

        // Broadcast to all users in the room (including sender)
        io.to(sessionId).emit("language_updated", {
          language,
          userId,
          clearOutput: true,
        });

        console.log(
          `🔤 Language changed to ${language} in session ${sessionId} by ${userId}`
        );
      } catch (error) {
        console.error("Error changing language:", error);
        socket.emit("error", { message: "Failed to change language" });
      }
    });

    /**
     * Execution result
     */
    socket.on("execution_result", async (data) => {
      try {
        const { sessionId, result, userId, timestamp } = data;

        if (!sessionId || !result || !userId) {
          socket.emit("error", { message: "Invalid execution result data" });
          return;
        }

        // Broadcast to other users in the room (exclude sender)
        socket.to(sessionId).emit("execution_result_sync", {
          result,
          userId,
          timestamp: timestamp || Date.now(),
        });

        console.log(
          `⚡ Execution result broadcast in session ${sessionId} by ${userId}`
        );
      } catch (error) {
        console.error("Error broadcasting execution result:", error);
        socket.emit("error", {
          message: "Failed to broadcast execution result",
        });
      }
    });

    /**
     * Typing started
     */
    socket.on("typing_start", async (data) => {
      try {
        const { sessionId, userId } = data;

        if (!sessionId || !userId) {
          return;
        }

        // Broadcast to ALL users in the room (including sender for testing)
        io.to(sessionId).emit("typing_started", {
          userId,
        });

        console.log(
          `⌨️  User ${userId} started typing in session ${sessionId}`
        );
      } catch (error) {
        console.error("Error broadcasting typing start:", error);
      }
    });

    /**
     * Typing stopped
     */
    socket.on("typing_stop", async (data) => {
      try {
        const { sessionId, userId } = data;

        if (!sessionId || !userId) {
          return;
        }

        // Broadcast to ALL users in the room (including sender for testing)
        io.to(sessionId).emit("typing_stopped", {
          userId,
        });

        console.log(
          `⌨️  User ${userId} stopped typing in session ${sessionId}`
        );
      } catch (error) {
        console.error("Error broadcasting typing stop:", error);
      }
    });

    /**
     * Disconnect
     */
    socket.on("disconnect", (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} - ${reason}`);

      // Get user info
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        const { userId, sessionId } = userInfo;

        // Remove user from session
        const activeUsers = db.removeUser(sessionId, userId);

        // Notify other users in the room
        socket.to(sessionId).emit("user_left", {
          userId,
          activeUsers,
        });

        connectedUsers.delete(socket.id);
      }
    });

    /**
     * Error handling
     */
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  console.log("✅ WebSocket server initialized");

  return io;
}
