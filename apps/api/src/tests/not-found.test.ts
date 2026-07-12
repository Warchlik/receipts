import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "@/main";

describe("Not found middleware", () => {
  it("should return 404 for unknown route", async () => {
    const response = await request(app).get(
      "/unknown-route",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Route /unknown-route not found",
    );
  });
});
