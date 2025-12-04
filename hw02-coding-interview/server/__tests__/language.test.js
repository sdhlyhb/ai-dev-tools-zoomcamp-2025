import request from "supertest";
import { app } from "../src/index.js";

describe("Language API Tests", () => {
  describe("GET /api/languages", () => {
    it("should return list of supported languages", async () => {
      const response = await request(app).get("/api/languages").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.languages).toBeInstanceOf(Array);
      expect(response.body.languages.length).toBeGreaterThan(0);
    });

    it("should include JavaScript", async () => {
      const response = await request(app).get("/api/languages");

      const javascript = response.body.languages.find(
        (lang) => lang.value === "javascript"
      );

      expect(javascript).toBeDefined();
      expect(javascript.label).toBe("JavaScript");
      expect(javascript.extension).toBe("js");
      expect(javascript).toHaveProperty("version");
    });

    it("should include Python", async () => {
      const response = await request(app).get("/api/languages");

      const python = response.body.languages.find(
        (lang) => lang.value === "python"
      );

      expect(python).toBeDefined();
      expect(python.label).toBe("Python");
      expect(python.extension).toBe("py");
      expect(python).toHaveProperty("version");
    });

    it("should return languages with required properties", async () => {
      const response = await request(app).get("/api/languages");

      response.body.languages.forEach((lang) => {
        expect(lang).toHaveProperty("value");
        expect(lang).toHaveProperty("label");
        expect(lang).toHaveProperty("extension");
        expect(lang).toHaveProperty("version");
      });
    });
  });
});
