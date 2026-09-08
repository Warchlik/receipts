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

  split_type: z
    .enum(["equal", "manual", "itemized"])
    .default("manual"),
});

const addMemberBodySchema = z
  .object({
    user_id: z
      .string()
      .min(1, "user_id is required")
      .optional(),
    guest_name: z
      .string()
      .trim()
      .min(1, "guest_name is required")
      .max(100, "guest_name is too long")
      .optional(),
    amount_owed: z
      .number()
      .int()
      .nonnegative(
        "Amount owed must be a non-negative integer",
      )
      .optional()
      .nullable(),
  })
  .refine(
    (data) =>
      (data.user_id != null) !== (data.guest_name != null),
    {
      message:
        "Provide exactly one of user_id or guest_name",
      path: ["user_id"],
    },
  );

const updateMemberBodySchema = z.object({
  amount_owed: z
    .number()
    .int()
    .nonnegative(
      "Amount owed must be a non-negative integer",
    )
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

export const getSettlementSchema = z.object({
  params: receiptIdParams,
});

export const addMemberSchema = z.object({
  params: receiptIdParams,
  body: addMemberBodySchema,
});

const memberIdParams = receiptIdParams.extend({
  memberId: z.string().uuid("Invalid member id"),
});

export const updateMemberSchema = z.object({
  params: memberIdParams,
  body: updateMemberBodySchema,
});

export const removeMemberSchema = z.object({
  params: memberIdParams,
});

export const claimMemberSchema = z.object({
  params: memberIdParams,
});

export type GetReceiptByIdInput = z.infer<
  typeof getReceiptByIdSchema
>["params"];

export type CreateReceiptInput = z.infer<
  typeof createReceiptSchema
>["body"];

export type UpdateReceiptParams = z.infer<
  typeof updateReceiptSchema
>["params"];

export type UpdateReceiptInput = z.infer<
  typeof updateReceiptSchema
>["body"];

export type DeleteReceiptInput = z.infer<
  typeof deleteReceiptSchema
>["params"];

export type ListMembersParams = z.infer<
  typeof listMembersSchema
>["params"];

export type GetSettlementParams = z.infer<
  typeof getSettlementSchema
>["params"];

export type AddMemberParams = z.infer<
  typeof addMemberSchema
>["params"];
export type AddMemberInput = z.infer<
  typeof addMemberSchema
>["body"];

export type UpdateMemberParams = z.infer<
  typeof updateMemberSchema
>["params"];
export type UpdateMemberInput = z.infer<
  typeof updateMemberSchema
>["body"];

export type RemoveMemberParams = z.infer<
  typeof removeMemberSchema
>["params"];

export type ClaimMemberParams = z.infer<
  typeof claimMemberSchema
>["params"];
