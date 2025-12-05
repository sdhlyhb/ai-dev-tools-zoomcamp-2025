// API calls for backend communication

// In production (served by Nginx), use relative URLs
// In development, use localhost
const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? "/api"
    : import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Create a new code session
 * @param {Object} data - Session data (language, code, title)
 * @returns {Promise<Object>} Created session
 */
export const createSession = async (data = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log("📝 Session created", result);
    return result;
  } catch (error) {
    console.error("Failed to create session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get session data by ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Session data
 */
export const getSession = async (sessionId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
    const result = await response.json();

    if (!response.ok) {
      console.log("❌ Session not found", sessionId);
      return {
        success: false,
        error: result.error || "Session not found",
      };
    }

    console.log("✅ Session retrieved", result);
    return result;
  } catch (error) {
    console.error("Failed to get session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update session data
 * @param {string} sessionId - Session ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<Object>} Updated session
 */
export const updateSession = async (sessionId, updates) => {
  try {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || "Failed to update session",
      };
    }

    console.log("🔄 Session updated", result);
    return result;
  } catch (error) {
    console.error("Failed to update session:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get list of supported languages
 * @returns {Promise<Array>} Array of languages
 */
export const getSupportedLanguages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/languages`);
    const result = await response.json();

    console.log("📋 Languages retrieved", result);
    return result;
  } catch (error) {
    console.error("Failed to get languages:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
