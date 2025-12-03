import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { config } from "./config/index.js";
import routes from "./routes/index.js";
import { initializeWebSocket } from "./socket/index.js";

// Create Express app
const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(compression());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check (root)
app.get("/", (req, res) => {
  res.json({
    name: "CollabCodePad API",
    version: "1.0.0",
    status: "ok",
  });
});

// API routes
app.use("/api", routes);

// Health check (alternative)
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    code: "NOT_FOUND",
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    error: "An unexpected error occurred",
    code: "INTERNAL_ERROR",
  });
});

// Initialize WebSocket
const io = initializeWebSocket(httpServer);

// Start server only if not in test mode
if (config.nodeEnv !== "test") {
  const PORT = config.port;

  httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 CollabCodePad Server                            ║
║                                                       ║
║   Environment: ${config.nodeEnv.padEnd(37)}║
║   Port: ${PORT.toString().padEnd(43)}║
║   API: http://localhost:${PORT}/api${" ".repeat(22)}║
║   WebSocket: ws://localhost:${PORT}/socket.io${" ".repeat(10)}║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully...");
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("SIGINT received, shutting down gracefully...");
    httpServer.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  });
}

export { app, httpServer, io };
