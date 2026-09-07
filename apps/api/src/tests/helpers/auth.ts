import { randomUUID } from "crypto";
import request from "supertest";
import { app } from "@/main";

export type TestUser = {
  userId: string;
  authHeader: string;
};

export const registerUser = async (
  name = "Test User",
): Promise<TestUser> => {
  const email = `test-user-${randomUUID()}@example.com`;
  const password = "Password123!";

  const response = await request(app)
    .post("/api/auth/sign-up/email")
    .send({ email, password, name });

  const token = response.headers["set-auth-token"];

  if (!token) {
    throw new Error(
      `Failed to register test user: no auth token returned (status ${response.status})`,
    );
  }

  return {
    userId: response.body.user.id as string,
    authHeader: `Bearer ${token}`,
  };
};
