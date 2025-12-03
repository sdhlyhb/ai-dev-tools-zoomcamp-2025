import request from "supertest";
import { app } from "../src/index.js";

describe("Execution API Tests", () => {
  describe("POST /api/execute", () => {
    it("should execute JavaScript code successfully", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'console.log("Hello, World!");',
          language: "javascript",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("output");
      expect(response.body).toHaveProperty("executionTime");
      expect(response.body.executionTime).toMatch(/\d+ms/);
    });

    it("should execute Python code successfully", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'print("Hello, World!")',
          language: "python",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty("output");
      expect(response.body).toHaveProperty("executionTime");
    });

    it("should handle JavaScript fibonacci code", async () => {
      const fibonacciCode = `
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        console.log('Fibonacci sequence:');
        for (let i = 0; i < 10; i++) {
          console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
        }
      `;

      const response = await request(app)
        .post("/api/execute")
        .send({
          code: fibonacciCode,
          language: "javascript",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.output).toContain("Fibonacci sequence");
    });

    it("should return error for syntax errors", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'console.log("SyntaxError")',
          language: "javascript",
        })
        .expect(200);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("SyntaxError");
    });

    it("should reject request without code", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          language: "javascript",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_REQUEST");
    });

    it("should reject request without language", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'console.log("test");',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_REQUEST");
    });

    it("should reject invalid language", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'puts "Hello"',
          language: "ruby",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe("INVALID_LANGUAGE");
    });

    it("should accept optional sessionId", async () => {
      const response = await request(app)
        .post("/api/execute")
        .send({
          code: 'console.log("test");',
          language: "javascript",
          sessionId: "test-session",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should measure execution time", async () => {
      const response = await request(app).post("/api/execute").send({
        code: 'console.log("test");',
        language: "javascript",
      });

      expect(response.body.executionTime).toMatch(/^\d+ms$/);
      const timeMs = parseInt(response.body.executionTime);
      expect(timeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
