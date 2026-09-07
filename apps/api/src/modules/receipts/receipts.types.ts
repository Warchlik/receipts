import { receipt_members, receipts } from "@/db/schema";
import type { PaginationResponse } from "@/utils/pagination";

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type ReceiptMember =
  typeof receipt_members.$inferSelect;
export type NewReceiptMember =
  typeof receipt_members.$inferInsert;

export type PaginationReceipts =
  PaginationResponse<Receipt>;

export type MemberWithName = ReceiptMember & {
  name: string;
};

export type MemberBalance = {
  memberId: string;
  name: string;
  role: ReceiptMember["role"];
  amountOwed: number;
  paid: boolean;
  paidAt: Date | null;
  owesTo: string | null;
};

export type SettlementSummary = {
  receiptId: string;
  currency: string;
  totalAmount: number;
  totalCollected: number;
  totalOutstanding: number;
  isSettled: boolean;
  members: MemberBalance[];
};
