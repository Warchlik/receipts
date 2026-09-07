import { z } from "zod";

const receiptIdParams = z.object({
  id: z.string().uuid("Invalid receipt id"),
});

const tokenParams = z.object({
  token: z.string().min(1, "Invalid token"),
});

const createInviteBodySchema = z.object({
  member_id: z
    .string()
    .uuid("Invalid member id")
    .optional(),
});

export const createInviteSchema = z.object({
  params: receiptIdParams,
  body: createInviteBodySchema,
});

export const getInviteByTokenSchema = z.object({
  params: tokenParams,
});

export const acceptInviteSchema = z.object({
  params: tokenParams,
});

export type CreateInviteParams = z.infer<
  typeof createInviteSchema
>["params"];
export type CreateInviteInput = z.infer<
  typeof createInviteSchema
>["body"];

export type GetInviteByTokenParams = z.infer<
  typeof getInviteByTokenSchema
>["params"];

export type AcceptInviteParams = z.infer<
  typeof acceptInviteSchema
>["params"];
