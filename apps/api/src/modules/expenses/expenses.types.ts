import { expense_splits, expenses } from "@/db/schema";
import type { PaginationResponse } from "@/utils/pagination";

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type ExpenseSplit =
  typeof expense_splits.$inferSelect;
export type NewExpenseSplit =
  typeof expense_splits.$inferInsert;

export type PaginationExpenses =
  PaginationResponse<Expense>;
