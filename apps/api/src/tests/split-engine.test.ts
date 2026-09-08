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
      amount: 10000,
      people_count: 2,
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

const listMembers = async (
  authHeader: string,
  receiptId: string,
) => {
  const response = await request(app)
    .get(`/api/receipts/${receiptId}/members`)
    .set("Authorization", authHeader);

  return response.body.data as Array<{
    id: string;
    user_id: string | null;
    amount_owed: number | null;
    amount_owed_override: boolean;
  }>;
};

describe("Split engine — equal mode", () => {
  it("splits the receipt total equally across members, remainder to the creator", async () => {
    const creator = await registerUser();
    const b = await registerUser();
    const c = await registerUser();
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100, // 100 / 3 = 33.33... -> 34/33/33
        split_type: "equal",
      },
    );

    await addAuthMember(
      creator.authHeader,
      receipt.id,
      b.userId,
    );
    await addAuthMember(
      creator.authHeader,
      receipt.id,
      c.userId,
    );

    const members = await listMembers(
      creator.authHeader,
      receipt.id,
    );
    const total = members.reduce(
      (sum, m) => sum + (m.amount_owed ?? 0),
      0,
    );
    const creatorMember = members.find(
      (m) => m.user_id === creator.userId,
    );

    expect(total).toBe(100);
    expect(creatorMember?.amount_owed).toBe(34);
    expect(
      members.every(
        (m) => m.amount_owed_override === false,
      ),
    ).toBe(true);
  });

  it("keeps an overridden member's amount fixed and splits the remaining pool among the rest", async () => {
    const creator = await registerUser();
    const b = await registerUser();
    const c = await registerUser();
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 300,
        split_type: "equal",
      },
    );

    const memberB = await addAuthMember(
      creator.authHeader,
      receipt.id,
      b.userId,
    );
    await addAuthMember(
      creator.authHeader,
      receipt.id,
      c.userId,
    );

    await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberB.id}`,
      )
      .set("Authorization", creator.authHeader)
      .send({ amount_owed: 50 });

    const members = await listMembers(
      creator.authHeader,
      receipt.id,
    );
    const overriddenB = members.find(
      (m) => m.id === memberB.id,
    );
    const others = members.filter(
      (m) => m.id !== memberB.id,
    );

    expect(overriddenB?.amount_owed).toBe(50);
    expect(overriddenB?.amount_owed_override).toBe(true);
    expect(others.every((m) => m.amount_owed === 125)).toBe(
      true,
    );
  });

  it("resets a member back to automatic calculation when amount_owed is set to null", async () => {
    const creator = await registerUser();
    const b = await registerUser();
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100,
        split_type: "equal",
      },
    );

    const memberB = await addAuthMember(
      creator.authHeader,
      receipt.id,
      b.userId,
    );

    await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberB.id}`,
      )
      .set("Authorization", creator.authHeader)
      .send({ amount_owed: 10 });

    const resetResponse = await request(app)
      .patch(
        `/api/receipts/${receipt.id}/members/${memberB.id}`,
      )
      .set("Authorization", creator.authHeader)
      .send({ amount_owed: null });

    expect(resetResponse.status).toBe(200);
    expect(
      resetResponse.body.data.amount_owed_override,
    ).toBe(false);
    expect(resetResponse.body.data.amount_owed).toBe(50);
  });
});

describe("Split engine — itemized mode", () => {
  it("splits each expense equally across its assigned members and sums per member", async () => {
    const creator = await registerUser();
    const b = await registerUser();
    const receipt = await createReceipt(
      creator.authHeader,
      {
        amount: 100,
        split_type: "itemized",
      },
    );

    const memberB = await addAuthMember(
      creator.authHeader,
      receipt.id,
      b.userId,
    );
    const members = await listMembers(
      creator.authHeader,
      receipt.id,
    );
    const creatorMember = members.find(
      (m) => m.user_id === creator.userId,
    )!;

    const expense1 = await request(app)
      .post(`/api/receipts/${receipt.id}/expenses`)
      .set("Authorization", creator.authHeader)
      .send({ title: "Pizza", amount: 60 });

    await request(app)
      .put(
        `/api/receipts/${receipt.id}/expenses/${expense1.body.data.id}/splits`,
      )
      .set("Authorization", creator.authHeader)
      .send({ member_ids: [creatorMember.id, memberB.id] });

    const expense2 = await request(app)
      .post(`/api/receipts/${receipt.id}/expenses`)
      .set("Authorization", creator.authHeader)
      .send({ title: "Beer (creator only)", amount: 40 });

    await request(app)
      .put(
        `/api/receipts/${receipt.id}/expenses/${expense2.body.data.id}/splits`,
      )
      .set("Authorization", creator.authHeader)
      .send({ member_ids: [creatorMember.id] });

    const finalMembers = await listMembers(
      creator.authHeader,
      receipt.id,
    );
    const finalCreator = finalMembers.find(
      (m) => m.id === creatorMember.id,
    );
    const finalB = finalMembers.find(
      (m) => m.id === memberB.id,
    );

    expect(finalCreator?.amount_owed).toBe(70);
    expect(finalB?.amount_owed).toBe(30);
  });

  it("rejects assigning a split to a member id that isn't part of the receipt", async () => {
    const creator = await registerUser();
    const outsider = await registerUser();
    const receipt = await createReceipt(
      creator.authHeader,
      {
        split_type: "itemized",
      },
    );

    const expense = await request(app)
      .post(`/api/receipts/${receipt.id}/expenses`)
      .set("Authorization", creator.authHeader)
      .send({ title: "Taxi", amount: 20 });

    const response = await request(app)
      .put(
        `/api/receipts/${receipt.id}/expenses/${expense.body.data.id}/splits`,
      )
      .set("Authorization", creator.authHeader)
      .send({ member_ids: [outsider.userId] });

    expect(response.status).toBe(400);
  });

  it("requires a title when creating an expense", async () => {
    const creator = await registerUser();
    const receipt = await createReceipt(creator.authHeader);

    const response = await request(app)
      .post(`/api/receipts/${receipt.id}/expenses`)
      .set("Authorization", creator.authHeader)
      .send({ amount: 20 });

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
