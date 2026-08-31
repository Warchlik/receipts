import { db } from "@/db";
import { expenses } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import { Expense, NewExpense } from "./expenses.types";

export class ExpensesRepository {
  async countForReceipt(receiptId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(expenses)
      .where(eq(expenses.receipt_id, receiptId));

    return result?.value ?? 0;
  }

  async findManyForReceipt(
    receiptId: string,
    offset: number,
    limit: number = 20,
  ): Promise<Expense[]> {
    return db
      .select()
      .from(expenses)
      .where(eq(expenses.receipt_id, receiptId))
      .limit(limit)
      .offset(offset);
  }

  async findByIdForReceipt(
    receiptId: string,
    id: string,
  ): Promise<Expense | null> {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(and(eq(expenses.receipt_id, receiptId), eq(expenses.id, id)));

    return expense ?? null;
  }

  async create(data: NewExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(data).returning();

    if (!expense) {
      throw new Error("Failed to create expense");
    }

    return expense;
  }

  async update(
    receiptId: string,
    id: string,
    data: Partial<NewExpense>,
  ): Promise<Expense | null> {
    const [expense] = await db
      .update(expenses)
      .set(data)
      .where(and(eq(expenses.receipt_id, receiptId), eq(expenses.id, id)))
      .returning();

    return expense ?? null;
  }

  async delete(receiptId: string, id: string): Promise<Expense | null> {
    const [expense] = await db
      .delete(expenses)
      .where(and(eq(expenses.receipt_id, receiptId), eq(expenses.id, id)))
      .returning();

    return expense ?? null;
  }
}
