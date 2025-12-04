import { db } from "../db/index.js";

/**
 * Session Controller
 * Handles all session-related operations
 */

export const sessionController = {
  /**
   * Create a new session
   * POST /api/sessions
   */
  createSession: async (req, res) => {
    try {
      const { language, code, title } = req.body;

      const session = await db.createSession({
        language,
        code,
        title,
      });

      const shareableLink = `${req.protocol}://${req.get("host")}/session/${
        session.sessionId
      }`;

      res.status(201).json({
        success: true,
        session,
        shareableLink,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },

  /**
   * Get session by ID
   * GET /api/sessions/:sessionId
   */
  getSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      const session = await db.getSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          code: "SESSION_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        session,
      });
    } catch (error) {
      console.error("Error getting session:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },

  /**
   * Update session
   * PATCH /api/sessions/:sessionId
   */
  updateSession: async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { code, language, title } = req.body;

      // Validate at least one field is provided
      if (!code && !language && !title) {
        return res.status(400).json({
          success: false,
          error:
            "At least one field (code, language, or title) must be provided",
          code: "INVALID_REQUEST",
        });
      }

      // Validate language if provided
      if (language && !["javascript", "python"].includes(language)) {
        return res.status(400).json({
          success: false,
          error: "Invalid language specified",
          code: "INVALID_LANGUAGE",
        });
      }

      const session = await db.updateSession(sessionId, {
        ...(code !== undefined && { code }),
        ...(language !== undefined && { language }),
        ...(title !== undefined && { title }),
      });

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          code: "SESSION_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        session,
      });
    } catch (error) {
      console.error("Error updating session:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },

  /**
   * Delete session
   * DELETE /api/sessions/:sessionId
   */
  deleteSession: async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Prevent deleting demo session
      if (sessionId === "demo-session") {
        return res.status(400).json({
          success: false,
          error: "Cannot delete demo session",
          code: "INVALID_REQUEST",
        });
      }

      const deleted = await db.deleteSession(sessionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          code: "SESSION_NOT_FOUND",
        });
      }

      res.json({
        success: true,
        message: "Session deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },

  /**
   * Get active users in session
   * GET /api/sessions/:sessionId/users
   */
  getSessionUsers: async (req, res) => {
    try {
      const { sessionId } = req.params;

      // Check if session exists
      const session = await db.getSession(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          code: "SESSION_NOT_FOUND",
        });
      }

      const users = await db.getSessionUsers(sessionId);

      res.json({
        success: true,
        users,
        count: users.length,
      });
    } catch (error) {
      console.error("Error getting session users:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },
};
