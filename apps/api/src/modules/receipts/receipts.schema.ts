import { z } from "zod";

const receiptIdParams = z.object({
  id: z.string().uuid("Invalid receipt id"),
});

const receiptBodySchema = z.object({
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

  people_count: z.number().int().min(1, "At least one person is required"),

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

const receiptRoleSchema = z.enum(["creator", "member"]);

const addMemberBodySchema = z.object({
  user_id: z.string().min(1, "user_id is required"),
  role: receiptRoleSchema.default("member"),
  amount_owed: z
    .number()
    .int()
    .nonnegative("Amount owed must be a non-negative integer")
    .optional()
    .nullable(),
});

const updateMemberBodySchema = z.object({
  amount_owed: z
    .number()
    .int()
    .nonnegative("Amount owed must be a non-negative integer")
    .optional()
    .nullable(),
  paid: z.boolean().optional(),
});

export const getReceiptByIdSchema = z.object({
  params: receiptIdParams,
});

export const createReceiptSchema = z.object({
  body: receiptBodySchema,
});

export const updateReceiptSchema = z.object({
  params: receiptIdParams,
  body: receiptBodySchema.partial(),
});

export const deleteReceiptSchema = z.object({
  params: receiptIdParams,
});

export const listMembersSchema = z.object({
  params: receiptIdParams,
});

export const addMemberSchema = z.object({
  params: receiptIdParams,
  body: addMemberBodySchema,
});

export const updateMemberSchema = z.object({
  params: receiptIdParams.extend({
    userId: z.string().min(1, "Invalid user id"),
  }),
  body: updateMemberBodySchema,
});

export const removeMemberSchema = z.object({
  params: receiptIdParams.extend({
    userId: z.string().min(1, "Invalid user id"),
  }),
});

export type GetReceiptByIdInput = z.infer<
  typeof getReceiptByIdSchema
>["params"];

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>["body"];

export type UpdateReceiptParams = z.infer<
  typeof updateReceiptSchema
>["params"];

export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>["body"];

export type DeleteReceiptInput = z.infer<
  typeof deleteReceiptSchema
>["params"];

export type ListMembersParams = z.infer<typeof listMembersSchema>["params"];

export type AddMemberParams = z.infer<typeof addMemberSchema>["params"];
export type AddMemberInput = z.infer<typeof addMemberSchema>["body"];

export type UpdateMemberParams = z.infer<
  typeof updateMemberSchema
>["params"];
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>["body"];

export type RemoveMemberParams = z.infer<
  typeof removeMemberSchema
>["params"];
