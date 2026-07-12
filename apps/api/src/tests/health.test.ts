import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "@/main";

describe("Health endpoint", () => {
  it("should return API status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "API is running",
    });
  });
});
