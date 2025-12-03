import express from "express";
import { sessionController } from "../controllers/sessionController.js";
import { languageController } from "../controllers/languageController.js";
import { executionController } from "../controllers/executionController.js";

const router = express.Router();

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Session routes
router.post("/sessions", sessionController.createSession);
router.get("/sessions/:sessionId", sessionController.getSession);
router.patch("/sessions/:sessionId", sessionController.updateSession);
router.delete("/sessions/:sessionId", sessionController.deleteSession);
router.get("/sessions/:sessionId/users", sessionController.getSessionUsers);

// Language routes
router.get("/languages", languageController.getSupportedLanguages);

// Execution routes
router.post("/execute", executionController.executeCode);

export default router;
