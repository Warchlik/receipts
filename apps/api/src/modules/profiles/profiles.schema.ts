import { z } from "zod";

const profileBodySchema = z.object({
  first_name: z
    .string()
    .trim()
    .max(100, "First name is too long")
    .optional()
    .nullable(),

  last_name: z
    .string()
    .trim()
    .max(100, "Last name is too long")
    .optional()
    .nullable(),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number is too long")
    .optional()
    .nullable(),
});

export const updateProfileSchema = z.object({
  body: profileBodySchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
