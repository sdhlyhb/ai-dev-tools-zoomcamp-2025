import request from "supertest";
import { app } from "../src/index.js";

describe("Health Check Tests", () => {
  describe("GET /", () => {
    it("should return API info", async () => {
      const response = await request(app).get("/").expect(200);

      expect(response.body).toHaveProperty("name");
      expect(response.body).toHaveProperty("version");
      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("ok");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("timestamp");
      expect(response.body).toHaveProperty("uptime");
      expect(response.body.status).toBe("ok");
    });
  });

  describe("GET /api/health", () => {
    it("should return health status via API route", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("ok");
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app)
        .get("/non-existent-route")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("NOT_FOUND");
    });

    it("should return 404 for non-existent API routes", async () => {
      const response = await request(app).get("/api/non-existent").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("NOT_FOUND");
    });
  });
});
