import { receipts, user_receipts } from "@/db/schema";
import type { PaginationResponse } from "@/utils/pagination";

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type ReceiptMember = typeof user_receipts.$inferSelect;
export type NewReceiptMember = typeof user_receipts.$inferInsert;

export type PaginationReceipts = PaginationResponse<Receipt>;
