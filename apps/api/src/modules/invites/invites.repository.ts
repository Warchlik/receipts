import { db } from "@/db";
import { receipt_invites } from "@/db/schema";
import { eq } from "drizzle-orm";
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
