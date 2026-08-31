import { z } from "zod";

const receiptIdParams = z.object({
  id: z.string().uuid("Invalid receipt id"),
});

const expenseIdParams = receiptIdParams.extend({
  expenseId: z.string().uuid("Invalid expense id"),
});

const expenseBodySchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
});

export const listExpensesSchema = z.object({
  params: receiptIdParams,
});

export const getExpenseByIdSchema = z.object({
  params: expenseIdParams,
});

export const createExpenseSchema = z.object({
  params: receiptIdParams,
  body: expenseBodySchema,
});

export const updateExpenseSchema = z.object({
  params: expenseIdParams,
  body: expenseBodySchema.partial(),
});

export const deleteExpenseSchema = z.object({
  params: expenseIdParams,
});

export type ListExpensesParams = z.infer<typeof listExpensesSchema>["params"];

export type GetExpenseByIdParams = z.infer<
  typeof getExpenseByIdSchema
>["params"];

export type CreateExpenseParams = z.infer<
  typeof createExpenseSchema
>["params"];
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>["body"];

export type UpdateExpenseParams = z.infer<
  typeof updateExpenseSchema
>["params"];
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>["body"];

export type DeleteExpenseParams = z.infer<
  typeof deleteExpenseSchema
>["params"];
