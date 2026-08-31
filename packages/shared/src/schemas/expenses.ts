import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
