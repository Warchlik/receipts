import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["dev", "test", "prod"]).default("dev"),

  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  BETTER_AUTH_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:");
  console.error(parsedEnv.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsedEnv.data;
