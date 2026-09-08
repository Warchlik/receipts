import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "@/main";
import { registerUser } from "./helpers/auth";

const createReceipt = async (authHeader: string) => {
  const response = await request(app)
    .post("/api/receipts")
    .set("Authorization", authHeader)
    .send({
      title: "Dinner",
      amount: 10000,
      people_count: 2,
    });

  return response.body.data;
};

describe("Receipt members", () => {
  it("adds a guest member to a receipt", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "Jan" });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.guest_name).toBe("Jan");
    expect(response.body.data.user_id).toBeNull();
  });

  it("rejects a duplicate guest name on the same receipt, case-insensitively", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "Jan" });

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "JAN" });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it("does not treat SQL LIKE wildcards in a guest name as pattern characters", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "Jan" });

    const underscoreResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "J_n" });

    const percentResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "%" });

    expect(underscoreResponse.status).toBe(201);
    expect(percentResponse.status).toBe(201);
  });

  it("adds an authenticated user as a member", async () => {
    const creator = await registerUser();
    const other = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ user_id: other.userId });

    expect(response.status).toBe(201);
    expect(response.body.data.user_id).toBe(other.userId);
    expect(response.body.data.guest_name).toBeNull();
  });

  it("ignores a client-supplied role, never minting a second creator", async () => {
    const creator = await registerUser();
    const other = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ user_id: other.userId, role: "creator" });

    expect(response.status).toBe(201);
    expect(response.body.data.role).toBe("member");

    const hijackAttempt = await request(app)
      .patch(`/api/receipts/${receipt.id}`)
      .set("Authorization", other.authHeader)
      .send({ title: "Hijacked" });

    expect(hijackAttempt.status).toBe(403);
  });

  it("rejects adding the same authenticated user twice", async () => {
    const creator = await registerUser();
    const other = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ user_id: other.userId });

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ user_id: other.userId });

    expect(response.status).toBe(409);
  });

  it("rejects a body with neither user_id nor guest_name", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Validation failed");
    expect(Array.isArray(response.body.errors)).toBe(true);
    expect(response.body.errors[0]).toHaveProperty("path");
    expect(response.body.errors[0]).toHaveProperty(
      "message",
    );
  });

  it("rejects a body with both user_id and guest_name", async () => {
    const creator = await registerUser();
    const other = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ user_id: other.userId, guest_name: "Jan" });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.body.success).toBe(false);
  });

  it("lets any authenticated user self-claim a guest member", async () => {
    const creator = await registerUser();
    const claimant = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const addGuestResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "Jan" });

    const memberId = addGuestResponse.body.data.id;

    const response = await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberId}/claim`,
      )
      .set("Authorization", claimant.authHeader);

    expect(response.status).toBe(200);
    expect(response.body.data.user_id).toBe(
      claimant.userId,
    );
    expect(response.body.data.guest_name).toBeNull();
  });

  it("rejects claiming a guest member the requester already has a membership for", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const addGuestResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "Jan" });

    const memberId = addGuestResponse.body.data.id;

    const response = await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberId}/claim`,
      )
      .set("Authorization", creator.authHeader);

    expect(response.status).toBe(409);
  });

  it("addresses members by memberId, not userId, for update/remove", async () => {
    const creator = await registerUser();
    const other = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const addResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ user_id: other.userId });

    const memberId = addResponse.body.data.id;

    const updateResponse = await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberId}`,
      )
      .set("Authorization", creator.authHeader)
      .send({ amount_owed: 500 });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.amount_owed).toBe(500);
  });
});
