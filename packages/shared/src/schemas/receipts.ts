import { z } from "zod";

export const createReceiptSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title is too long"),

  description: z
    .string()
    .trim()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),

  amount: z
    .number()
    .int()
    .nonnegative("Amount must be a non-negative integer"),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code")
    .default("PLN"),

  people_count: z
    .number()
    .int()
    .min(1, "At least one person is required"),

  category: z
    .string()
    .trim()
    .max(100, "Category is too long")
    .optional()
    .nullable(),

  purchase_at: z.coerce.date().optional().nullable(),

  receipt_image_url: z
    .string()
    .url("Invalid image URL")
    .optional()
    .nullable(),
});

export const updateReceiptSchema = createReceiptSchema.partial();

export const receiptRoleSchema = z.enum(["creator", "member"]);

export const addMemberSchema = z.object({
  user_id: z.string().min(1, "user_id is required"),
  role: receiptRoleSchema.default("member"),
  amount_owed: z
    .number()
    .int()
    .nonnegative("Amount owed must be a non-negative integer")
    .optional()
    .nullable(),
});

export const updateMemberSchema = z.object({
  amount_owed: z
    .number()
    .int()
    .nonnegative("Amount owed must be a non-negative integer")
    .optional()
    .nullable(),
  paid: z.boolean().optional(),
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
