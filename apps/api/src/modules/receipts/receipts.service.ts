import { ApiError } from "@/utils/ApiError";
import { getPaginationMeta, PaginationParams } from "@/utils/pagination";
import { stripUndefined } from "@/utils/object";
import { ReceiptsRepository } from "./receipts.repository";
import {
  AddMemberInput,
  UpdateMemberInput,
  UpdateReceiptInput,
} from "./receipts.schema";
import {
  NewReceipt,
  NewReceiptMember,
  PaginationReceipts,
  Receipt,
  ReceiptMember,
} from "./receipts.types";

export class ReceiptsService {
  constructor(private readonly receiptsRepository: ReceiptsRepository) {}

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
      meta: getPaginationMeta(total, pagination.page, pagination.limit),
    };
  }

  async getReceiptById(id: string, userId: string): Promise<Receipt> {
    const receipt = await this.receiptsRepository.findByIdForUser(
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
    const receipt = await this.receiptsRepository.create(data);

    await this.receiptsRepository.addMember({
      receipt_id: receipt.id,
      user_id: userId,
      role: "creator",
    });

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

    return receipt;
  }

  async deleteReceipt(id: string, userId: string): Promise<void> {
    await this.assertIsCreator(id, userId);

    const receipt = await this.receiptsRepository.delete(id);

    if (!receipt) {
      throw new ApiError(404, "Receipt not found");
    }
  }

  async listMembers(id: string, userId: string): Promise<ReceiptMember[]> {
    await this.assertIsMember(id, userId);

    return this.receiptsRepository.findMembers(id);
  }

  async addMember(
    id: string,
    requesterId: string,
    data: AddMemberInput,
  ): Promise<ReceiptMember> {
    await this.assertIsCreator(id, requesterId);

    const existing = await this.receiptsRepository.findMember(
      id,
      data.user_id,
    );

    if (existing) {
      throw new ApiError(409, "User is already a member of this receipt");
    }

    return this.receiptsRepository.addMember({
      receipt_id: id,
      user_id: data.user_id,
      role: data.role ?? "member",
      amount_owed: data.amount_owed ?? null,
    });
  }

  async updateMember(
    id: string,
    userId: string,
    requesterId: string,
    data: UpdateMemberInput,
  ): Promise<ReceiptMember> {
    const isSelf = userId === requesterId;

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

    if (data.amount_owed !== undefined) {
      updates.amount_owed = data.amount_owed;
    }

    if (data.paid !== undefined) {
      updates.paid_at = data.paid ? new Date() : null;
    }

    const member = await this.receiptsRepository.updateMember(
      id,
      userId,
      updates,
    );

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    return member;
  }

  async removeMember(
    id: string,
    userId: string,
    requesterId: string,
  ): Promise<void> {
    await this.assertIsCreator(id, requesterId);

    const member = await this.receiptsRepository.findMember(id, userId);

    if (!member) {
      throw new ApiError(404, "Member not found");
    }

    if (member.role === "creator") {
      throw new ApiError(400, "Cannot remove the receipt creator");
    }

    await this.receiptsRepository.removeMember(id, userId);
  }

  private async assertIsMember(
    id: string,
    userId: string,
  ): Promise<ReceiptMember> {
    const member = await this.receiptsRepository.findMember(id, userId);

    if (!member) {
      throw new ApiError(404, "Receipt not found");
    }

    return member;
  }

  private async assertIsCreator(id: string, userId: string): Promise<void> {
    const member = await this.assertIsMember(id, userId);

    if (member.role !== "creator") {
      throw new ApiError(
        403,
        "Only the receipt creator can perform this action",
      );
    }
  }
}
