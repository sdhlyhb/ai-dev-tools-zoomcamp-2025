import { nanoid } from "nanoid";
import { config } from "../config/index.js";

/**
 * Mock in-memory database
 * This will be replaced with a real database (e.g., PostgreSQL, MongoDB)
 */
class MockDatabase {
  constructor() {
    this.sessions = new Map();
    this.users = new Map(); // sessionId -> Set of userIds
    this.cleanupInterval = null;

    // Initialize demo session
    this.initializeDemoSession();

    // Start cleanup job
    this.startCleanupJob();
  }

  /**
   * Create a new session
   */
  createSession(data = {}) {
    const sessionId = nanoid(12);
    const language = data.language || "javascript";

    // Get default code based on language
    const getDefaultCode = (lang) => {
      switch (lang) {
        case "python":
          return "# Start coding here...\n";
        case "javascript":
        default:
          return "// Start coding here...\n";
      }
    };

    const session = {
      sessionId,
      language,
      code: data.code || getDefaultCode(language),
      title: data.title || "Untitled Session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeUsers: 0,
      expiresAt: new Date(
        Date.now() + config.session.ttlHours * 60 * 60 * 1000
      ).toISOString(),
    };

    this.sessions.set(sessionId, session);
    this.users.set(sessionId, new Set());

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Check if session expired
    if (new Date(session.expiresAt) < new Date()) {
      this.deleteSession(sessionId);
      return null;
    }

    return { ...session };
  }

  /**
   * Update session
   */
  updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const updatedSession = {
      ...session,
      ...updates,
      sessionId, // Prevent ID override
      updatedAt: new Date().toISOString(),
    };

    this.sessions.set(sessionId, updatedSession);
    return { ...updatedSession };
  }

  /**
   * Delete session
   */
  deleteSession(sessionId) {
    const deleted = this.sessions.delete(sessionId);
    this.users.delete(sessionId);
    return deleted;
  }

  /**
   * Get all sessions (for testing/admin)
   */
  getAllSessions() {
    return Array.from(this.sessions.values());
  }

  /**
   * Add user to session
   */
  addUser(sessionId, userId) {
    if (!this.users.has(sessionId)) {
      this.users.set(sessionId, new Set());
    }

    this.users.get(sessionId).add(userId);

    // Update active users count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.activeUsers = this.users.get(sessionId).size;
      this.sessions.set(sessionId, session);
    }

    return this.users.get(sessionId).size;
  }

  /**
   * Remove user from session
   */
  removeUser(sessionId, userId) {
    if (!this.users.has(sessionId)) {
      return 0;
    }

    this.users.get(sessionId).delete(userId);
    const activeUsers = this.users.get(sessionId).size;

    // Update active users count
    const session = this.sessions.get(sessionId);
    if (session) {
      session.activeUsers = activeUsers;
      this.sessions.set(sessionId, session);
    }

    return activeUsers;
  }

  /**
   * Get active users in session
   */
  getSessionUsers(sessionId) {
    if (!this.users.has(sessionId)) {
      return [];
    }

    return Array.from(this.users.get(sessionId)).map((userId) => ({
      userId,
      connectedAt: new Date().toISOString(), // Mock data
      lastActivity: new Date().toISOString(),
    }));
  }

  /**
   * Get active user count
   */
  getActiveUserCount(sessionId) {
    if (!this.users.has(sessionId)) {
      return 0;
    }
    return this.users.get(sessionId).size;
  }

  /**
   * Initialize demo session
   */
  initializeDemoSession() {
    const demoSessionId = "demo-session";
    const demoSession = {
      sessionId: demoSessionId,
      language: "javascript",
      code: `// Welcome to CodePad! 🚀
// This is a collaborative code editor
// Try changing the code and see it sync in real-time

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}
`,
      title: "Demo Session",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeUsers: 0,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    };

    this.sessions.set(demoSessionId, demoSession);
    this.users.set(demoSessionId, new Set());
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (sessionId === "demo-session") continue; // Keep demo session

      if (new Date(session.expiresAt) < now) {
        this.deleteSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired sessions`);
    }

    return cleaned;
  }

  /**
   * Start cleanup job
   */
  startCleanupJob() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop cleanup job
   */
  stopCleanupJob() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clear all data (for testing)
   */
  clear() {
    this.sessions.clear();
    this.users.clear();
    this.initializeDemoSession();
  }

  /**
   * Get database stats
   */
  getStats() {
    return {
      totalSessions: this.sessions.size,
      totalActiveUsers: Array.from(this.users.values()).reduce(
        (sum, set) => sum + set.size,
        0
      ),
    };
  }
}

// Export singleton instance
export const db = new MockDatabase();
