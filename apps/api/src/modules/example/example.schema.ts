import { z } from "zod";

export const getExampleByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid example id"),
  }),
});

export const createExampleSchema = z.object({
  body: z.object({
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
  }),
});

export const updateExampleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid example id"),
  }),

  body: z.object({
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
  }),
});

export const deleteExampleSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid example id"),
  }),
});

export type GetExampleByIdInput = z.infer<
  typeof getExampleByIdSchema
>["params"];

export type CreateExampleInput = z.infer<
  typeof createExampleSchema
>["body"];

export type UpdateExampleParams = z.infer<
  typeof updateExampleSchema
>["params"];

export type UpdateExampleInput = z.infer<
  typeof updateExampleSchema
>["body"];

export type DeleteExampleInput = z.infer<
  typeof deleteExampleSchema
>["params"];
