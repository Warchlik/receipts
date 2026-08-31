import { db } from "@/db";
import { receipts, user_receipts } from "@/db/schema";
import { and, count, eq } from "drizzle-orm";
import {
  NewReceipt,
  NewReceiptMember,
  Receipt,
  ReceiptMember,
} from "./receipts.types";

export class ReceiptsRepository {
  async countForUser(userId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(receipts)
      .innerJoin(user_receipts, eq(user_receipts.receipt_id, receipts.id))
      .where(eq(user_receipts.user_id, userId));

    return result?.value ?? 0;
  }

  async findManyForUser(
    userId: string,
    offset: number,
    limit: number = 20,
  ): Promise<Receipt[]> {
    const rows = await db
      .select({ receipt: receipts })
      .from(receipts)
      .innerJoin(user_receipts, eq(user_receipts.receipt_id, receipts.id))
      .where(eq(user_receipts.user_id, userId))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => row.receipt);
  }

  async findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Receipt | null> {
    const [row] = await db
      .select({ receipt: receipts })
      .from(receipts)
      .innerJoin(user_receipts, eq(user_receipts.receipt_id, receipts.id))
      .where(and(eq(receipts.id, id), eq(user_receipts.user_id, userId)));

    return row?.receipt ?? null;
  }

  async create(data: NewReceipt): Promise<Receipt> {
    const [receipt] = await db.insert(receipts).values(data).returning();

    if (!receipt) {
      throw new Error("Failed to create receipt");
    }

    return receipt;
  }

  async update(
    id: string,
    data: Partial<NewReceipt>,
  ): Promise<Receipt | null> {
    const [receipt] = await db
      .update(receipts)
      .set(data)
      .where(eq(receipts.id, id))
      .returning();

    return receipt ?? null;
  }

  async delete(id: string): Promise<Receipt | null> {
    const [receipt] = await db
      .delete(receipts)
      .where(eq(receipts.id, id))
      .returning();

    return receipt ?? null;
  }

  async addMember(data: NewReceiptMember): Promise<ReceiptMember> {
    const [member] = await db.insert(user_receipts).values(data).returning();

    if (!member) {
      throw new Error("Failed to add receipt member");
    }

    return member;
  }

  async findMembers(receiptId: string): Promise<ReceiptMember[]> {
    return db
      .select()
      .from(user_receipts)
      .where(eq(user_receipts.receipt_id, receiptId));
  }

  async findMember(
    receiptId: string,
    userId: string,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .select()
      .from(user_receipts)
      .where(
        and(
          eq(user_receipts.receipt_id, receiptId),
          eq(user_receipts.user_id, userId),
        ),
      );

    return member ?? null;
  }

  async updateMember(
    receiptId: string,
    userId: string,
    data: Partial<NewReceiptMember>,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .update(user_receipts)
      .set(data)
      .where(
        and(
          eq(user_receipts.receipt_id, receiptId),
          eq(user_receipts.user_id, userId),
        ),
      )
      .returning();

    return member ?? null;
  }

  async removeMember(receiptId: string, userId: string): Promise<void> {
    await db
      .delete(user_receipts)
      .where(
        and(
          eq(user_receipts.receipt_id, receiptId),
          eq(user_receipts.user_id, userId),
        ),
      );
  }
}
