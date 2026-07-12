import { z } from "zod";

export const createExampleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
});

export const updateExampleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(255, "Name is too long")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
});

export type CreateExampleInput = z.infer<typeof createExampleSchema>;
export type UpdateExampleInput = z.infer<typeof updateExampleSchema>;
