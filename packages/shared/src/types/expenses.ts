import type { PaginationResponse } from "./pagination";

export type Expense = {
  id: string;
  receipt_id: string;
  amount: number;
  created_at: Date;
  updated_at: Date | null;
};

export type ExpenseList = PaginationResponse<Expense>;
