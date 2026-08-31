import { expenses } from "@/db/schema";
import type { PaginationResponse } from "@/utils/pagination";

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type PaginationExpenses = PaginationResponse<Expense>;
