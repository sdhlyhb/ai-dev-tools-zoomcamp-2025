/**
 * Language Controller
 * Handles language-related operations
 */

const SUPPORTED_LANGUAGES = [
  {
    value: "javascript",
    label: "JavaScript",
    extension: "js",
    version: "Node.js 20.x",
  },
  {
    value: "python",
    label: "Python",
    extension: "py",
    version: "Python 3.11",
  },
];

export const languageController = {
  /**
   * Get supported languages
   * GET /api/languages
   */
  getSupportedLanguages: (req, res) => {
    try {
      res.json({
        success: true,
        languages: SUPPORTED_LANGUAGES,
      });
    } catch (error) {
      console.error("Error getting languages:", error);
      res.status(500).json({
        success: false,
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  },
};
