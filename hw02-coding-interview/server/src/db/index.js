import { nanoid } from "nanoid";
import { config } from "../config/index.js";
import { query, testConnection, initializeSchema } from "./postgres.js";

/**
 * PostgreSQL database implementation
 */
class Database {
  constructor() {
    this.cleanupInterval = null;
    this.initialized = false;
  }

  /**
   * Initialize database
   */
  async initialize() {
    if (this.initialized) return;

    const connected = await testConnection();
    if (!connected) {
      throw new Error("Failed to connect to database");
    }

    await initializeSchema();
    await this.initializeDemoSession();
    this.startCleanupJob();

    this.initialized = true;
    console.log("✅ Database initialized");
  }

  /**
   * Create a new session
   */
  async createSession(data = {}) {
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

    const code = data.code || getDefaultCode(language);
    const title = data.title || "Untitled Session";
    const expiresAt = new Date(
      Date.now() + config.session.ttlHours * 60 * 60 * 1000
    );

    const result = await query(
      `INSERT INTO sessions (session_id, language, code, title, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sessionId, language, code, title, expiresAt]
    );

    const session = this.mapSessionFromDb(result.rows[0]);
    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId) {
    const result = await query(
      `SELECT s.*, COUNT(DISTINCT su.user_id) as active_users
       FROM sessions s
       LEFT JOIN session_users su ON s.session_id = su.session_id
       WHERE s.session_id = $1 AND s.expires_at > NOW()
       GROUP BY s.id`,
      [sessionId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSessionFromDb(result.rows[0]);
  }

  /**
   * Update session
   */
  async updateSession(sessionId, updates) {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    if (updates.code !== undefined) {
      setClauses.push(`code = $${paramCount++}`);
      values.push(updates.code);
    }
    if (updates.language !== undefined) {
      setClauses.push(`language = $${paramCount++}`);
      values.push(updates.language);
    }
    if (updates.title !== undefined) {
      setClauses.push(`title = $${paramCount++}`);
      values.push(updates.title);
    }

    if (setClauses.length === 0) {
      return await this.getSession(sessionId);
    }

    values.push(sessionId);

    const result = await query(
      `UPDATE sessions SET ${setClauses.join(", ")}
       WHERE session_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSessionFromDb(result.rows[0]);
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId) {
    const result = await query("DELETE FROM sessions WHERE session_id = $1", [
      sessionId,
    ]);
    return result.rowCount > 0;
  }

  /**
   * Get all sessions (for testing/admin)
   */
  async getAllSessions() {
    const result = await query(
      `SELECT s.*, COUNT(DISTINCT su.user_id) as active_users
       FROM sessions s
       LEFT JOIN session_users su ON s.session_id = su.session_id
       WHERE s.expires_at > NOW()
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    );
    return result.rows.map((row) => this.mapSessionFromDb(row));
  }

  /**
   * Add user to session
   */
  async addUser(sessionId, userId) {
    await query(
      `INSERT INTO session_users (session_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (session_id, user_id) DO NOTHING`,
      [sessionId, userId]
    );

    return await this.getActiveUserCount(sessionId);
  }

  /**
   * Remove user from session
   */
  async removeUser(sessionId, userId) {
    await query(
      "DELETE FROM session_users WHERE session_id = $1 AND user_id = $2",
      [sessionId, userId]
    );

    return await this.getActiveUserCount(sessionId);
  }

  /**
   * Get active users in session
   */
  async getSessionUsers(sessionId) {
    const result = await query(
      `SELECT user_id, joined_at
       FROM session_users
       WHERE session_id = $1
       ORDER BY joined_at`,
      [sessionId]
    );

    return result.rows.map((row) => ({
      userId: row.user_id,
      connectedAt: row.joined_at,
      lastActivity: row.joined_at,
    }));
  }

  /**
   * Get active user count
   */
  async getActiveUserCount(sessionId) {
    const result = await query(
      `SELECT COUNT(*) as count
       FROM session_users
       WHERE session_id = $1`,
      [sessionId]
    );
    return parseInt(result.rows[0].count);
  }

  /**
   * Initialize demo session
   */
  async initializeDemoSession() {
    const demoSessionId = "demo-session";
    const demoCode = `// Welcome to CodeSyncPad! 🚀
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
`;

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

    await query(
      `INSERT INTO sessions (session_id, language, code, title, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (session_id) DO UPDATE
       SET code = EXCLUDED.code, title = EXCLUDED.title`,
      [demoSessionId, "javascript", demoCode, "Demo Session", expiresAt]
    );
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions() {
    const result = await query(
      `DELETE FROM sessions
       WHERE expires_at < NOW()
       AND session_id != 'demo-session'`
    );

    const cleaned = result.rowCount;

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
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        console.error("Cleanup job error:", error.message);
      }
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
  async clear() {
    await query("DELETE FROM sessions WHERE session_id != 'demo-session'");
    await query("DELETE FROM session_users");
    await this.initializeDemoSession();
  }

  /**
   * Get database stats
   */
  async getStats() {
    const sessionsResult = await query(
      "SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()"
    );
    const usersResult = await query(
      "SELECT COUNT(*) as count FROM session_users"
    );

    return {
      totalSessions: parseInt(sessionsResult.rows[0].count),
      totalActiveUsers: parseInt(usersResult.rows[0].count),
    };
  }

  /**
   * Map database row to session object
   */
  mapSessionFromDb(row) {
    return {
      sessionId: row.session_id,
      language: row.language,
      code: row.code,
      title: row.title,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      activeUsers: parseInt(row.active_users || 0),
    };
  }
}

// Export singleton instance
export const db = new Database();
