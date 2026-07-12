import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "@/main";

describe("Example module", () => {
  it("should get all examples", async () => {
    const response =
      await request(app).get("/api/examples");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should create example", async () => {
    const response = await request(app)
      .post("/api/examples")
      .send({
        name: "Test example",
        description: "Created from test",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.name).toBe("Test example");
    expect(response.body.data.description).toBe(
      "Created from test",
    );
  });

  it("should return validation error for invalid create body", async () => {
    const response = await request(app)
      .post("/api/examples")
      .send({
        name: "",
      });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBe(false);
  });
});
