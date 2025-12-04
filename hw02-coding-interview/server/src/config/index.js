import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  session: {
    ttlHours: parseInt(process.env.SESSION_TTL_HOURS) || 24,
    maxActiveUsers: parseInt(process.env.MAX_ACTIVE_USERS) || 50,
  },

  execution: {
    timeoutMs: parseInt(process.env.EXECUTION_TIMEOUT_MS) || 5000,
    memoryLimitMb: parseInt(process.env.EXECUTION_MEMORY_LIMIT_MB) || 128,
  },

  security: {
    apiKey: process.env.API_KEY,
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
  },
};
