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

const addGuest = async (
  authHeader: string,
  receiptId: string,
  guestName: string,
) => {
  const response = await request(app)
    .post(`/api/receipts/${receiptId}/members`)
    .set("Authorization", authHeader)
    .send({ guest_name: guestName });

  return response.body.data;
};

describe("Invites", () => {
  it("creates an invite to claim an existing guest member", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);
    const guest = await addGuest(
      creator.authHeader,
      receipt.id,
      "Jan",
    );

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/invites`)
      .set("Authorization", creator.authHeader)
      .send({ member_id: guest.id });

    expect(response.status).toBe(201);
    expect(response.body.data.member_id).toBe(guest.id);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.invite_url).toBe(
      `http://localhost:5173/invite/${response.body.data.token}`,
    );
  });

  it("exposes a public preview of an invite without auth", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);
    const guest = await addGuest(
      creator.authHeader,
      receipt.id,
      "Jan",
    );

    const createResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/invites`)
      .set("Authorization", creator.authHeader)
      .send({ member_id: guest.id });

    const { token } = createResponse.body.data;

    const response = await request(app).get(
      `/api/invites/${token}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.receiptId).toBe(receipt.id);
    expect(response.body.data.guestName).toBe("Jan");
    expect(response.body.data.memberId).toBe(guest.id);
  });

  it("lets an invited user accept and claim the guest identity", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);
    const guest = await addGuest(
      creator.authHeader,
      receipt.id,
      "Jan",
    );

    const createResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/invites`)
      .set("Authorization", creator.authHeader)
      .send({ member_id: guest.id });

    const { token } = createResponse.body.data;
    const jan = await registerUser("Jan");

    const acceptResponse = await request(app)
      .post(`/api/invites/${token}/accept`)
      .set("Authorization", jan.authHeader);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data.user_id).toBe(
      jan.userId,
    );
    expect(acceptResponse.body.data.guest_name).toBeNull();
    expect(acceptResponse.body.data.id).toBe(guest.id);
  });

  it("rejects reusing an already-accepted invite", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);
    const guest = await addGuest(
      creator.authHeader,
      receipt.id,
      "Jan",
    );

    const createResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/invites`)
      .set("Authorization", creator.authHeader)
      .send({ member_id: guest.id });

    const { token } = createResponse.body.data;
    const jan = await registerUser("Jan");

    await request(app)
      .post(`/api/invites/${token}/accept`)
      .set("Authorization", jan.authHeader);

    const another = await registerUser();
    const response = await request(app)
      .post(`/api/invites/${token}/accept`)
      .set("Authorization", another.authHeader);

    expect(response.status).toBe(410);
  });

  it("returns 404 for an unknown invite token", async () => {
    const response = await request(app).get(
      "/api/invites/does-not-exist",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("lets a new user join a receipt directly via an invite with no member_id", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const createResponse = await request(app)
      .post(`/api/receipts/${receipt.id}/invites`)
      .set("Authorization", creator.authHeader)
      .send({});

    const { token } = createResponse.body.data;
    const newcomer = await registerUser();

    const acceptResponse = await request(app)
      .post(`/api/invites/${token}/accept`)
      .set("Authorization", newcomer.authHeader);

    expect(acceptResponse.status).toBe(200);
    expect(acceptResponse.body.data.user_id).toBe(
      newcomer.userId,
    );
  });

  it("rejects creating an invite for a receipt the requester doesn't own", async () => {
    const creator = await registerUser();
    const outsider = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/invites`)
      .set("Authorization", outsider.authHeader)
      .send({});

    expect(response.status).toBe(404);
  });
});
