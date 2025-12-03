import request from "supertest";
import { app } from "../src/index.js";
import { db } from "../src/db/index.js";

describe("Session API Tests", () => {
  beforeEach(() => {
    // Clear database before each test
    db.clear();
  });

  describe("POST /api/sessions", () => {
    it("should create a new session with default values", async () => {
      const response = await request(app)
        .post("/api/sessions")
        .send({})
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.session).toHaveProperty("sessionId");
      expect(response.body.session.language).toBe("javascript");
      expect(response.body.session.code).toBe("// Start coding here...\n");
      expect(response.body.session.title).toBe("Untitled Session");
      expect(response.body.session.activeUsers).toBe(0);
      expect(response.body).toHaveProperty("shareableLink");
    });

    it("should create a Python session with Python comment syntax", async () => {
      const response = await request(app)
        .post("/api/sessions")
        .send({ language: "python" })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.session.language).toBe("python");
      expect(response.body.session.code).toBe("# Start coding here...\n");
    });

    it("should create a new session with custom values", async () => {
      const customSession = {
        language: "python",
        code: 'print("Hello, World!")',
        title: "My Python Session",
      };

      const response = await request(app)
        .post("/api/sessions")
        .send(customSession)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.session.language).toBe("python");
      expect(response.body.session.code).toBe('print("Hello, World!")');
      expect(response.body.session.title).toBe("My Python Session");
    });

    it("should generate unique session IDs", async () => {
      const response1 = await request(app).post("/api/sessions").send({});
      const response2 = await request(app).post("/api/sessions").send({});

      expect(response1.body.session.sessionId).not.toBe(
        response2.body.session.sessionId
      );
    });
  });

  describe("GET /api/sessions/:sessionId", () => {
    it("should retrieve an existing session", async () => {
      // Create a session first
      const createResponse = await request(app)
        .post("/api/sessions")
        .send({ title: "Test Session" });

      const sessionId = createResponse.body.session.sessionId;

      // Retrieve the session
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.sessionId).toBe(sessionId);
      expect(response.body.session.title).toBe("Test Session");
    });

    it("should return 404 for non-existent session", async () => {
      const response = await request(app)
        .get("/api/sessions/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("SESSION_NOT_FOUND");
    });

    it("should retrieve the demo session", async () => {
      const response = await request(app)
        .get("/api/sessions/demo-session")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.sessionId).toBe("demo-session");
      expect(response.body.session.title).toBe("Demo Session");
    });
  });

  describe("PATCH /api/sessions/:sessionId", () => {
    it("should update session code", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Update code
      const newCode = 'console.log("Updated code");';
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .send({ code: newCode })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.code).toBe(newCode);
    });

    it("should update session language", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Update language
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .send({ language: "python" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.language).toBe("python");
    });

    it("should update session title", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Update title
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .send({ title: "New Title" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.session.title).toBe("New Title");
    });

    it("should reject invalid language", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Try to update with invalid language
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .send({ language: "ruby" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_LANGUAGE");
    });

    it("should reject update with no fields", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Try to update with no fields
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_REQUEST");
    });

    it("should return 404 for non-existent session", async () => {
      const response = await request(app)
        .patch("/api/sessions/non-existent-id")
        .send({ code: "test" })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("SESSION_NOT_FOUND");
    });
  });

  describe("DELETE /api/sessions/:sessionId", () => {
    it("should delete an existing session", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Delete the session
      const response = await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Session deleted successfully");

      // Verify it's deleted
      await request(app).get(`/api/sessions/${sessionId}`).expect(404);
    });

    it("should not delete demo session", async () => {
      const response = await request(app)
        .delete("/api/sessions/demo-session")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_REQUEST");
    });

    it("should return 404 for non-existent session", async () => {
      const response = await request(app)
        .delete("/api/sessions/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("SESSION_NOT_FOUND");
    });
  });

  describe("GET /api/sessions/:sessionId/users", () => {
    it("should return empty users list for new session", async () => {
      // Create a session
      const createResponse = await request(app).post("/api/sessions").send({});
      const sessionId = createResponse.body.session.sessionId;

      // Get users
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/users`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.users).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it("should return 404 for non-existent session", async () => {
      const response = await request(app)
        .get("/api/sessions/non-existent-id/users")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("SESSION_NOT_FOUND");
    });
  });
});
