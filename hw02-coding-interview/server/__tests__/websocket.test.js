import { io as Client } from "socket.io-client";
import { httpServer } from "../src/index.js";
import { db } from "../src/db/index.js";

describe("WebSocket Tests", () => {
  let clientSocket;
  let serverPort;

  beforeAll((done) => {
    // Start server on random port
    const server = httpServer.listen(0, () => {
      serverPort = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    httpServer.close(done);
  });

  beforeEach((done) => {
    // Clear database
    db.clear();

    // Create a test session
    db.createSession({
      language: "javascript",
      code: "// Test code",
      title: "Test Session",
    });

    // Connect client
    clientSocket = Client(`http://localhost:${serverPort}`);
    clientSocket.on("connect", done);
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  describe("Connection", () => {
    it("should connect successfully", (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  describe("Join Session", () => {
    it("should join session successfully", (done) => {
      const sessionId = "demo-session";
      const userId = "test-user-1";

      clientSocket.on("full_sync", (data) => {
        expect(data).toHaveProperty("code");
        expect(data).toHaveProperty("language");
        expect(data).toHaveProperty("activeUsers");
        expect(data.activeUsers).toBe(1);
        done();
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });

    it("should handle non-existent session", (done) => {
      const sessionId = "non-existent";
      const userId = "test-user-1";

      clientSocket.on("error", (data) => {
        expect(data.message).toContain("Session not found");
        done();
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });

    it("should require sessionId and userId", (done) => {
      clientSocket.on("error", (data) => {
        expect(data.message).toContain("required");
        done();
      });

      clientSocket.emit("join_session", {});
    });
  });

  describe("Code Updates", () => {
    it("should broadcast code updates to other users", (done) => {
      const sessionId = "demo-session";
      const userId1 = "test-user-1";
      const userId2 = "test-user-2";

      // Create second client
      const clientSocket2 = Client(`http://localhost:${serverPort}`);

      clientSocket2.on("connect", () => {
        // Both clients join session
        clientSocket.emit("join_session", { sessionId, userId: userId1 });
        clientSocket2.emit("join_session", { sessionId, userId: userId2 });
      });

      let joinCount = 0;
      const checkJoined = () => {
        joinCount++;
        if (joinCount === 2) {
          // Both joined, now send code update
          clientSocket.emit("code_update", {
            sessionId,
            code: 'console.log("Updated");',
            userId: userId1,
            timestamp: Date.now(),
          });
        }
      };

      clientSocket.on("full_sync", checkJoined);
      clientSocket2.on("full_sync", checkJoined);

      // Second client should receive the update
      clientSocket2.on("code_sync", (data) => {
        expect(data.code).toBe('console.log("Updated");');
        expect(data.userId).toBe(userId1);
        expect(data).toHaveProperty("timestamp");

        clientSocket2.disconnect();
        done();
      });
    });

    it("should not echo code updates to sender", (done) => {
      const sessionId = "demo-session";
      const userId = "test-user-1";

      let receivedSync = false;

      clientSocket.on("full_sync", () => {
        // Send code update
        clientSocket.emit("code_update", {
          sessionId,
          code: 'console.log("test");',
          userId,
          timestamp: Date.now(),
        });

        // Wait a bit to see if we receive code_sync (we shouldn't)
        setTimeout(() => {
          expect(receivedSync).toBe(false);
          done();
        }, 500);
      });

      clientSocket.on("code_sync", () => {
        receivedSync = true;
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });
  });

  describe("Language Change", () => {
    it("should broadcast language changes to all users", (done) => {
      const sessionId = "demo-session";
      const userId = "test-user-1";

      clientSocket.on("full_sync", () => {
        clientSocket.emit("language_change", {
          sessionId,
          language: "python",
          userId,
        });
      });

      clientSocket.on("language_updated", (data) => {
        expect(data.language).toBe("python");
        expect(data.userId).toBe(userId);
        done();
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });

    it("should reject invalid language", (done) => {
      const sessionId = "demo-session";
      const userId = "test-user-1";

      clientSocket.on("full_sync", () => {
        clientSocket.emit("language_change", {
          sessionId,
          language: "ruby",
          userId,
        });
      });

      clientSocket.on("error", (data) => {
        expect(data.message).toContain("Invalid language");
        done();
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });
  });

  describe("User Presence", () => {
    it("should notify when user joins", (done) => {
      const sessionId = "demo-session";
      const userId1 = "test-user-1";
      const userId2 = "test-user-2";

      // First client joins
      clientSocket.emit("join_session", { sessionId, userId: userId1 });

      clientSocket.on("full_sync", () => {
        // Create second client
        const clientSocket2 = Client(`http://localhost:${serverPort}`);

        // First client should be notified when second joins
        clientSocket.on("user_joined", (data) => {
          expect(data.userId).toBe(userId2);
          expect(data.activeUsers).toBe(2);

          clientSocket2.disconnect();
          done();
        });

        clientSocket2.on("connect", () => {
          clientSocket2.emit("join_session", { sessionId, userId: userId2 });
        });
      });
    });

    it("should notify when user leaves", (done) => {
      const sessionId = "demo-session";
      const userId1 = "test-user-1";
      const userId2 = "test-user-2";

      const clientSocket2 = Client(`http://localhost:${serverPort}`);

      let joinCount = 0;
      const checkJoined = () => {
        joinCount++;
        if (joinCount === 2) {
          // Both joined, now disconnect second client
          clientSocket2.disconnect();
        }
      };

      clientSocket.on("full_sync", checkJoined);
      clientSocket2.on("full_sync", checkJoined);

      clientSocket.on("user_left", (data) => {
        expect(data.userId).toBe(userId2);
        expect(data.activeUsers).toBe(1);
        done();
      });

      clientSocket.emit("join_session", { sessionId, userId: userId1 });
      clientSocket2.on("connect", () => {
        clientSocket2.emit("join_session", { sessionId, userId: userId2 });
      });
    });
  });

  describe("Disconnect Handling", () => {
    it("should handle graceful disconnect", (done) => {
      const sessionId = "demo-session";
      const userId = "test-user-1";

      clientSocket.on("full_sync", () => {
        clientSocket.emit("leave_session", { sessionId, userId });

        setTimeout(() => {
          const activeUsers = db.getActiveUserCount(sessionId);
          expect(activeUsers).toBe(0);
          done();
        }, 100);
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });

    it("should clean up on unexpected disconnect", (done) => {
      const sessionId = "demo-session";
      const userId = "test-user-1";

      clientSocket.on("full_sync", () => {
        // Force disconnect
        clientSocket.disconnect();

        setTimeout(() => {
          const activeUsers = db.getActiveUserCount(sessionId);
          expect(activeUsers).toBe(0);
          done();
        }, 100);
      });

      clientSocket.emit("join_session", { sessionId, userId });
    });
  });
});
