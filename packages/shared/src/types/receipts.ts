import type { PaginationResponse } from "./pagination";

export type ReceiptRole = "creator" | "member";

export type Receipt = {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  people_count: number;
  category: string | null;
  purchase_at: Date | null;
  receipt_image_url: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ReceiptMember = {
  role: ReceiptRole;
  user_id: string;
  receipt_id: string;
  amount_owed: number | null;
  paid_at: Date | null;
  joined_at: Date;
};

export type ReceiptList = PaginationResponse<Receipt>;
