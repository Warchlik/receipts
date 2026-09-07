import { ApiError } from "@/utils/ApiError";
import {
  getPaginationMeta,
  PaginationParams,
} from "@/utils/pagination";
import { stripUndefined } from "@/utils/object";
import { ReceiptsRepository } from "./receipts.repository";
import { SplitEngine } from "./split-engine";
import {
  AddMemberInput,
  UpdateMemberInput,
  UpdateReceiptInput,
} from "./receipts.schema";
import {
  MemberBalance,
  NewReceipt,
  NewReceiptMember,
  PaginationReceipts,
  Receipt,
  ReceiptMember,
  SettlementSummary,
} from "./receipts.types";

export class ReceiptsService {
  constructor(
    private readonly receiptsRepository: ReceiptsRepository,
    private readonly splitEngine: SplitEngine,
  ) {}

  async getReceipts(
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginationReceipts> {
    const [data, total] = await Promise.all([
      this.receiptsRepository.findManyForUser(
        userId,
        pagination.offset,
        pagination.limit,
      ),
      this.receiptsRepository.countForUser(userId),
    ]);

    return {
      data,
      meta: getPaginationMeta(
        total,
        pagination.page,
        pagination.limit,
      ),
    };
  }

  async getReceiptById(
    id: string,
    userId: string,
  ): Promise<Receipt> {
    const receipt =
      await this.receiptsRepository.findByIdForUser(
        id,
        userId,
      );

    if (!receipt) {
      throw new ApiError(404, "Receipt not found");
    }

    return receipt;
  }

  async createReceipt(
    userId: string,
    data: Omit<NewReceipt, "id">,
  ): Promise<Receipt> {
    const receipt =
      await this.receiptsRepository.create(data);

    await this.receiptsRepository.addMember({
      receipt_id: receipt.id,
      user_id: userId,
      guest_name: null,
      role: "creator",
      invited_by: userId,
    });

    await this.splitEngine.recalculate(receipt.id);

    return receipt;
  }

  async updateReceipt(
    id: string,
    userId: string,
    data: UpdateReceiptInput,
  ): Promise<Receipt> {
    await this.assertIsCreator(id, userId);

    const receipt = await this.receiptsRepository.update(
      id,
      stripUndefined(data),
    );

    if (!receipt) {
      throw new ApiError(404, "Receipt not found");
    }

    if (
      data.amount !== undefined ||
      data.split_type !== undefined
    ) {
      await this.splitEngine.recalculate(id);
    }

    return receipt;
  }

  async deleteReceipt(
    id: string,
    userId: string,
  ): Promise<void> {
    await this.assertIsCreator(id, userId);

    const receipt =
      await this.receiptsRepository.delete(id);

    if (!receipt) {
      throw new ApiError(404, "Receipt not found");
    }
  }

  async listMembers(
    id: string,
    userId: string,
  ): Promise<ReceiptMember[]> {
    await this.assertIsMember(id, userId);

    return this.receiptsRepository.findMembers(id);
  }

  async getSettlement(
    id: string,
    userId: string,
  ): Promise<SettlementSummary> {
    await this.assertIsMember(id, userId);

    const [receipt, membersWithNames] = await Promise.all([
      this.receiptsRepository.findById(id),
      this.receiptsRepository.findMembersWithNames(id),
    ]);

    if (!receipt) {
      throw new ApiError(404, "Receipt not found");
    }

    const creator = membersWithNames.find(
      (member) => member.role === "creator",
    );

    let totalCollected = 0;
    let totalOutstanding = 0;

    const members: MemberBalance[] = membersWithNames.map(
      (member) => {
        const amountOwed = member.amount_owed ?? 0;
        const paid = member.paid_at !== null;

        // The creator is assumed to have fronted the bill, so their own
        // amount_owed/paid status is informational only — never counted in
        // either total, symmetrically with totalOutstanding below.
        if (paid && member.role !== "creator") {
          totalCollected += amountOwed;
        } else if (!paid && member.role !== "creator") {
          totalOutstanding += amountOwed;
        }

        return {
          memberId: member.id,
          name: member.name,
          role: member.role,
          amountOwed,
          paid,
          paidAt: member.paid_at,
          owesTo:
            member.role === "creator"
              ? null
              : (creator?.id ?? null),
        };
      },
    );

    return {
      receiptId: receipt.id,
      currency: receipt.currency,
      totalAmount: receipt.amount,
      totalCollected,
      totalOutstanding,
      isSettled: totalOutstanding === 0,
      members,
    };
  }

  async addMember(
    id: string,
    requesterId: string,
    data: AddMemberInput,
  ): Promise<ReceiptMember> {
    await this.assertIsCreator(id, requesterId);

    return data.user_id
      ? this.addAuthUser(
          id,
          requesterId,
          data.user_id,
          data.role,
          data.amount_owed,
        )
      : this.addGuest(
          id,
          requesterId,
          data.guest_name!,
          data.role,
          data.amount_owed,
        );
  }

  async addAuthUser(
    receiptId: string,
    requesterId: string,
    userId: string,
    role: NewReceiptMember["role"] = "member",
    amountOwed?: number | null,
  ): Promise<ReceiptMember> {
    const existing =
      await this.receiptsRepository.findMemberByUserId(
        receiptId,
        userId,
      );

    if (existing) {
      throw new ApiError(
        409,
        "User is already a member of this receipt",
      );
    }

    const member = await this.receiptsRepository.addMember({
      receipt_id: receiptId,
      user_id: userId,
      guest_name: null,
      role: role ?? "member",
      invited_by: requesterId,
      amount_owed: amountOwed ?? null,
      amount_owed_override: amountOwed != null,
    });

    await this.splitEngine.recalculate(receiptId);

    return member;
  }

  private async addGuest(
    receiptId: string,
    requesterId: string,
    guestName: string,
    role: NewReceiptMember["role"] = "member",
    amountOwed?: number | null,
  ): Promise<ReceiptMember> {
    const existing =
      await this.receiptsRepository.findGuestByName(
        receiptId,
        guestName,
      );

    if (existing) {
      throw new ApiError(
        409,
        "A guest with this name already exists on this receipt",
      );
    }

    const member = await this.receiptsRepository.addMember({
      receipt_id: receiptId,
      user_id: null,
      guest_name: guestName,
      role: role ?? "member",
      invited_by: requesterId,
      amount_owed: amountOwed ?? null,
      amount_owed_override: amountOwed != null,
    });

    await this.splitEngine.recalculate(receiptId);

    return member;
  }

  async claimMember(
    receiptId: string,
    memberId: string,
    userId: string,
  ): Promise<ReceiptMember> {
    const alreadyMember =
      await this.receiptsRepository.findMemberByUserId(
        receiptId,
        userId,
      );

    if (alreadyMember) {
      throw new ApiError(
        409,
        "You are already a member of this receipt",
      );
    }

    const member =
      await this.receiptsRepository.claimMember(
        receiptId,
        memberId,
        userId,
      );

    if (!member) {
      throw new ApiError(
        404,
        "Guest member not found or already claimed",
      );
    }

    await this.splitEngine.recalculate(receiptId);

    return member;
  }

  async updateMember(
    id: string,
    memberId: string,
    requesterId: string,
    data: UpdateMemberInput,
  ): Promise<ReceiptMember> {
    const target =
      await this.receiptsRepository.findMemberById(
        id,
        memberId,
      );

    if (!target) {
      throw new ApiError(404, "Member not found");
    }

    const isSelf = target.user_id === requesterId;

    if (isSelf) {
      if (data.amount_owed !== undefined) {
        throw new ApiError(
          403,
          "Only the receipt creator can change owed amounts",
        );
      }
    } else {
      await this.assertIsCreator(id, requesterId);
    }

    const updates: Partial<NewReceiptMember> = {};
    let amountOwedChanged = false;

    if (data.amount_owed !== undefined) {
      // Explicit null resets the member back to the split engine's automatic
      // calculation; a number marks it as a manual override the engine will
      // never touch again until it's reset.
      updates.amount_owed = data.amount_owed;
      updates.amount_owed_override =
        data.amount_owed !== null;
      amountOwedChanged = true;
    }

    if (data.paid !== undefined) {
      updates.paid_at = data.paid ? new Date() : null;
    }

    const member =
      await this.receiptsRepository.updateMember(
        id,
        memberId,
        updates,
      );

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    if (amountOwedChanged) {
      await this.splitEngine.recalculate(id);

      const refreshed =
        await this.receiptsRepository.findMemberById(
          id,
          memberId,
        );

      return refreshed ?? member;
    }

    return member;
  }

  async removeMember(
    id: string,
    memberId: string,
    requesterId: string,
  ): Promise<void> {
    await this.assertIsCreator(id, requesterId);

    const member =
      await this.receiptsRepository.findMemberById(
        id,
        memberId,
      );

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    if (member.role === "creator") {
      throw new ApiError(
        400,
        "Cannot remove the receipt creator",
      );
    }

    await this.receiptsRepository.removeMember(
      id,
      memberId,
    );

    await this.splitEngine.recalculate(id);
  }

  private async assertIsMember(
    id: string,
    userId: string,
  ): Promise<ReceiptMember> {
    const member =
      await this.receiptsRepository.findMemberByUserId(
        id,
        userId,
      );

    if (!member) {
      throw new ApiError(404, "Receipt not found");
    }

    return member;
  }

  private async assertIsCreator(
    id: string,
    userId: string,
  ): Promise<void> {
    const member = await this.assertIsMember(id, userId);

    if (member.role !== "creator") {
      throw new ApiError(
        403,
        "Only the receipt creator can perform this action",
      );
    }
  }
}
