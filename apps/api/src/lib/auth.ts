import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { env } from "@/config/env";
import * as schema from "@/db/schema";
import { profiles } from "@/db/schemas/profiles";
import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [bearer()],
  trustedOrigins: [
    env.CORS_ORIGIN,
    env.BETTER_AUTH_URL,
    "capacitor://localhost",
    "http://localhost",
  ],
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
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          await db
            .insert(profiles)
            .values({ id: user.id })
            .onConflictDoNothing();
        },
      },
    },
  },
});
