import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "@/main";
import { registerUser } from "./helpers/auth";

const createReceipt = async (
  authHeader: string,
  overrides: Record<string, unknown> = {},
) => {
  const response = await request(app)
    .post("/api/receipts")
    .set("Authorization", authHeader)
    .send({
      title: "Dinner",
      amount: 100,
      people_count: 2,
      split_type: "equal",
      ...overrides,
    });

  return response.body.data;
};

const addAuthMember = async (
  authHeader: string,
  receiptId: string,
  userId: string,
) => {
  const response = await request(app)
    .post(`/api/receipts/${receiptId}/members`)
    .set("Authorization", authHeader)
    .send({ user_id: userId });

  return response.body.data;
};

const getSettlement = async (
  authHeader: string,
  receiptId: string,
) => {
  const response = await request(app)
    .get(`/api/receipts/${receiptId}/settlement`)
    .set("Authorization", authHeader);

  return response;
};

describe("Settlement", () => {
  it("reports everyone as outstanding before anyone pays", async () => {
    const creator = await registerUser("Alice");
    const bob = await registerUser("Bob");
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100,
      },
    );

    await addAuthMember(
      creator.authHeader,
      receipt.id,
      bob.userId,
    );

    const response = await getSettlement(
      creator.authHeader,
      receipt.id,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.totalAmount).toBe(100);
    expect(response.body.data.totalOutstanding).toBe(50);
    expect(response.body.data.totalCollected).toBe(0);
    expect(response.body.data.isSettled).toBe(false);

    const bobBalance = response.body.data.members.find(
      (m: { name: string }) => m.name === "Bob",
    );
    const creatorBalance = response.body.data.members.find(
      (m: { role: string }) => m.role === "creator",
    );

    expect(bobBalance.paid).toBe(false);
    expect(bobBalance.owesTo).toBe(creatorBalance.memberId);
    expect(creatorBalance.owesTo).toBeNull();
  });

  it("excludes the creator's own share from totalOutstanding", async () => {
    const creator = await registerUser("Alice");
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100,
      },
    );

    const response = await getSettlement(
      creator.authHeader,
      receipt.id,
    );

    // Solo receipt: creator owes their own 100 to nobody — nothing outstanding.
    expect(response.body.data.totalOutstanding).toBe(0);
  });

  it("excludes the creator's own share from totalCollected even if self-marked paid", async () => {
    const creator = await registerUser("Alice");
    const bob = await registerUser("Bob");
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100,
      },
    );

    const before = await getSettlement(
      creator.authHeader,
      receipt.id,
    );
    const creatorMemberId = before.body.data.members.find(
      (m: { role: string }) => m.role === "creator",
    ).memberId;

    await addAuthMember(
      creator.authHeader,
      receipt.id,
      bob.userId,
    );

    // Creator marks their own share paid — this must stay purely
    // informational and never inflate totalCollected.
    await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${creatorMemberId}`,
      )
      .set("Authorization", creator.authHeader)
      .send({ paid: true });

    const response = await getSettlement(
      creator.authHeader,
      receipt.id,
    );

    expect(response.body.data.totalCollected).toBe(0);
    expect(response.body.data.totalOutstanding).toBe(50);
  });

  it("moves a member's share from outstanding to collected once marked paid", async () => {
    const creator = await registerUser("Alice");
    const bob = await registerUser("Bob");
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100,
      },
    );

    const memberBob = await addAuthMember(
      creator.authHeader,
      receipt.id,
      bob.userId,
    );

    await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberBob.id}`,
      )
      .set("Authorization", creator.authHeader)
      .send({ paid: true });

    const response = await getSettlement(
      creator.authHeader,
      receipt.id,
    );

    expect(response.body.data.totalOutstanding).toBe(0);
    expect(response.body.data.totalCollected).toBe(50);
    expect(response.body.data.isSettled).toBe(true);
  });

  it("resolves guest and auth member names", async () => {
    const creator = await registerUser("Alice");
    const receipt = await createReceipt(creator.authHeader);

    await request(app)
      .post(`/api/receipts/${receipt.id}/members`)
      .set("Authorization", creator.authHeader)
      .send({ guest_name: "Jan" });

    const response = await getSettlement(
      creator.authHeader,
      receipt.id,
    );
    const names = response.body.data.members.map(
      (m: { name: string }) => m.name,
    );

    expect(names).toContain("Alice");
    expect(names).toContain("Jan");
  });
});
