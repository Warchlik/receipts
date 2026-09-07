import { receipt_invites } from "@/db/schema";

export type ReceiptInvite =
  typeof receipt_invites.$inferSelect;
export type NewReceiptInvite =
  typeof receipt_invites.$inferInsert;

export type InvitePreview = {
  receiptId: string;
  receiptTitle: string;
  memberId: string | null;
  guestName: string | null;
  expiresAt: Date;
};
