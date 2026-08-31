import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/config/env";
import * as schema from "@/db/schema";
import { profiles } from "@/db/schemas/profiles";

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [env.CORS_ORIGIN, env.BETTER_AUTH_URL],
  // trustedOrigins: ["*"]
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Every user gets an empty profile row up front so
          // `GET /api/profiles/me` never has to special-case "not created yet".
          await db
            .insert(profiles)
            .values({ id: user.id })
            .onConflictDoNothing();
        },
      },
    },
  },
});
