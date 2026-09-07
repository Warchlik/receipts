import { db } from "@/db";
import {
  receipt_members,
  receipts,
  user,
} from "@/db/schema";
import { and, count, eq, isNull, sql } from "drizzle-orm";
import {
  MemberWithName,
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
      .innerJoin(
        receipt_members,
        eq(receipt_members.receipt_id, receipts.id),
      )
      .where(eq(receipt_members.user_id, userId));

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
      .innerJoin(
        receipt_members,
        eq(receipt_members.receipt_id, receipts.id),
      )
      .where(eq(receipt_members.user_id, userId))
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
      .innerJoin(
        receipt_members,
        eq(receipt_members.receipt_id, receipts.id),
      )
      .where(
        and(
          eq(receipts.id, id),
          eq(receipt_members.user_id, userId),
        ),
      );

    return row?.receipt ?? null;
  }

  async findById(id: string): Promise<Receipt | null> {
    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id));

    return receipt ?? null;
  }

  async create(data: NewReceipt): Promise<Receipt> {
    const [receipt] = await db
      .insert(receipts)
      .values(data)
      .returning();

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

  async addMember(
    data: NewReceiptMember,
  ): Promise<ReceiptMember> {
    const [member] = await db
      .insert(receipt_members)
      .values(data)
      .returning();

    if (!member) {
      throw new Error("Failed to add receipt member");
    }

    return member;
  }

  async findMembers(
    receiptId: string,
  ): Promise<ReceiptMember[]> {
    return db
      .select()
      .from(receipt_members)
      .where(eq(receipt_members.receipt_id, receiptId));
  }

  async findMembersWithNames(
    receiptId: string,
  ): Promise<MemberWithName[]> {
    const rows = await db
      .select({
        member: receipt_members,
        userName: user.name,
      })
      .from(receipt_members)
      .leftJoin(user, eq(receipt_members.user_id, user.id))
      .where(eq(receipt_members.receipt_id, receiptId));

    return rows.map(({ member, userName }) => ({
      ...member,
      name: member.guest_name ?? userName ?? "Unknown",
    }));
  }

  async findMemberByUserId(
    receiptId: string,
    userId: string,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .select()
      .from(receipt_members)
      .where(
        and(
          eq(receipt_members.receipt_id, receiptId),
          eq(receipt_members.user_id, userId),
        ),
      );

    return member ?? null;
  }

  async findMemberById(
    receiptId: string,
    memberId: string,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .select()
      .from(receipt_members)
      .where(
        and(
          eq(receipt_members.receipt_id, receiptId),
          eq(receipt_members.id, memberId),
        ),
      );

    return member ?? null;
  }

  async findGuestByName(
    receiptId: string,
    guestName: string,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .select()
      .from(receipt_members)
      .where(
        and(
          eq(receipt_members.receipt_id, receiptId),
          // Case-insensitive exact match — NOT ilike(), whose "guestName" would
          // otherwise be interpreted as a LIKE pattern, so a guest literally
          // named "J_n" or "%" would falsely collide with unrelated names.
          eq(
            sql`lower(${receipt_members.guest_name})`,
            guestName.toLowerCase(),
          ),
        ),
      );

    return member ?? null;
  }

  async updateMember(
    receiptId: string,
    memberId: string,
    data: Partial<NewReceiptMember>,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .update(receipt_members)
      .set(data)
      .where(
        and(
          eq(receipt_members.receipt_id, receiptId),
          eq(receipt_members.id, memberId),
        ),
      )
      .returning();

    return member ?? null;
  }

  async removeMember(
    receiptId: string,
    memberId: string,
  ): Promise<void> {
    await db
      .delete(receipt_members)
      .where(
        and(
          eq(receipt_members.receipt_id, receiptId),
          eq(receipt_members.id, memberId),
        ),
      );
  }

  async claimMember(
    receiptId: string,
    memberId: string,
    userId: string,
  ): Promise<ReceiptMember | null> {
    const [member] = await db
      .update(receipt_members)
      .set({ user_id: userId, guest_name: null })
      .where(
        and(
          eq(receipt_members.receipt_id, receiptId),
          eq(receipt_members.id, memberId),
          isNull(receipt_members.user_id),
        ),
      )
      .returning();

    return member ?? null;
  }
}
