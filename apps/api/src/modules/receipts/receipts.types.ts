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
