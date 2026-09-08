import { db } from "@/db";
import { receipt_invites } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";
import {
  NewReceiptInvite,
  ReceiptInvite,
} from "./invites.types";

export class InvitesRepository {
  async create(
    data: NewReceiptInvite,
  ): Promise<ReceiptInvite> {
    const [invite] = await db
      .insert(receipt_invites)
      .values(data)
      .returning();

    if (!invite) {
      throw new Error("Failed to create invite");
    }

    return invite;
  }

  async findActiveByMember(
    receiptId: string,
    memberId: string,
  ): Promise<ReceiptInvite | null> {
    const [invite] = await db
      .select()
      .from(receipt_invites)
      .where(
        and(
          eq(receipt_invites.receipt_id, receiptId),
          eq(receipt_invites.member_id, memberId),
          isNull(receipt_invites.used_at),
          gt(receipt_invites.expires_at, new Date()),
        ),
      );

    return invite ?? null;
  }

  async findByToken(
    token: string,
  ): Promise<ReceiptInvite | null> {
    const [invite] = await db
      .select()
      .from(receipt_invites)
      .where(eq(receipt_invites.token, token));

    return invite ?? null;
  }

  async markUsed(
    id: string,
  ): Promise<ReceiptInvite | null> {
    const [invite] = await db
      .update(receipt_invites)
      .set({ used_at: new Date() })
      .where(eq(receipt_invites.id, id))
      .returning();

    return invite ?? null;
  }
}
