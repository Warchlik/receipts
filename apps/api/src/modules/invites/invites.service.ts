import { ApiError } from "@/utils/ApiError";
import { env } from "@/config/env";
import { generateToken } from "@/utils/token";
import { ReceiptsRepository } from "@/modules/receipts/receipts.repository";
import { ReceiptsService } from "@/modules/receipts/receipts.service";
import { ReceiptMember } from "@/modules/receipts/receipts.types";
import { InvitesRepository } from "./invites.repository";
import {
  InvitePreview,
  ReceiptInvite,
  ReceiptInviteWithUrl,
} from "./invites.types";

const INVITE_EXPIRY_DAYS = 7;

export class InvitesService {
  constructor(
    private readonly invitesRepository: InvitesRepository,
    private readonly receiptsRepository: ReceiptsRepository,
    private readonly receiptsService: ReceiptsService,
  ) {}

  async createInvite(
    receiptId: string,
    requesterId: string,
    memberId: string | null,
  ): Promise<ReceiptInviteWithUrl> {
    await this.assertIsCreator(receiptId, requesterId);

    if (memberId) {
      const member =
        await this.receiptsRepository.findMemberById(
          receiptId,
          memberId,
        );

      if (!member) {
        throw new ApiError(404, "Member not found");
      }

      if (member.user_id !== null) {
        throw new ApiError(
          409,
          "This member is already linked to a user",
        );
      }

      // Reuse a still-valid invite for this guest instead of minting an
      // unbounded number of parallel tokens for the same claim.
      const existingInvite =
        await this.invitesRepository.findActiveByMember(
          receiptId,
          memberId,
        );

      if (existingInvite) {
        return {
          ...existingInvite,
          invite_url: `${env.CORS_ORIGIN}/invite/${existingInvite.token}`,
        };
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + INVITE_EXPIRY_DAYS,
    );

    const invite = await this.invitesRepository.create({
      receipt_id: receiptId,
      member_id: memberId,
      token: generateToken(),
      created_by: requesterId,
      expires_at: expiresAt,
    });

    return {
      ...invite,
      invite_url: `${env.CORS_ORIGIN}/invite/${invite.token}`,
    };
  }

  async getInvitePreview(
    token: string,
  ): Promise<InvitePreview> {
    const invite =
      await this.invitesRepository.findByToken(token);

    this.assertUsable(invite);

    const receipt = await this.receiptsRepository.findById(
      invite.receipt_id,
    );

    if (!receipt) {
      throw new ApiError(404, "Receipt not found");
    }

    let guestName: string | null = null;

    if (invite.member_id) {
      const member =
        await this.receiptsRepository.findMemberById(
          invite.receipt_id,
          invite.member_id,
        );

      guestName = member?.guest_name ?? null;
    }

    return {
      receiptId: receipt.id,
      receiptTitle: receipt.title,
      memberId: invite.member_id,
      guestName,
      expiresAt: invite.expires_at,
    };
  }

  async acceptInvite(
    token: string,
    userId: string,
  ): Promise<ReceiptMember> {
    const invite =
      await this.invitesRepository.findByToken(token);

    this.assertUsable(invite);

    const member = invite.member_id
      ? await this.claimInviteMember(
          invite.receipt_id,
          invite.member_id,
          userId,
        )
      : await this.receiptsService.addAuthUser(
          invite.receipt_id,
          invite.created_by,
          userId,
        );

    await this.invitesRepository.markUsed(invite.id);

    return member;
  }

  private async claimInviteMember(
    receiptId: string,
    memberId: string,
    userId: string,
  ): Promise<ReceiptMember> {
    try {
      return await this.receiptsService.claimMember(
        receiptId,
        memberId,
        userId,
      );
    } catch (error) {
      // A second, concurrent accept of this same invite loses the atomic
      // claim after already passing assertUsable — report it as a stale
      // invite (409) rather than the generic "member not found" (404).
      if (
        error instanceof ApiError &&
        error.statusCode === 404
      ) {
        throw new ApiError(
          409,
          "This invite is no longer valid — it may have just been accepted elsewhere",
        );
      }

      throw error;
    }
  }

  private async assertIsCreator(
    receiptId: string,
    userId: string,
  ): Promise<void> {
    const member =
      await this.receiptsRepository.findMemberByUserId(
        receiptId,
        userId,
      );

    if (!member) {
      throw new ApiError(404, "Receipt not found");
    }

    if (member.role !== "creator") {
      throw new ApiError(
        403,
        "Only the receipt creator can perform this action",
      );
    }
  }

  private assertUsable(
    invite: ReceiptInvite | null,
  ): asserts invite is ReceiptInvite {
    if (!invite) {
      throw new ApiError(404, "Invite not found");
    }

    if (invite.used_at) {
      throw new ApiError(
        410,
        "Invite has already been used",
      );
    }

    if (invite.expires_at.getTime() < Date.now()) {
      throw new ApiError(410, "Invite has expired");
    }
  }
}
