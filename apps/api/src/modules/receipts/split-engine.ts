import { ExpensesRepository } from "@/modules/expenses/expenses.repository";
import { ReceiptsRepository } from "./receipts.repository";
import { ReceiptMember } from "./receipts.types";

/**
 * Recomputes `amount_owed` for every non-overridden receipt member, following
 * the receipt's `split_type`. Members with `amount_owed_override = true` are
 * never touched — their manually-set amount is subtracted from the pool
 * before the rest is divided (equal mode) or simply left alone (itemized).
 */
export class SplitEngine {
  constructor(
    private readonly receiptsRepository: ReceiptsRepository,
    private readonly expensesRepository: ExpensesRepository,
  ) {}

  async recalculate(receiptId: string): Promise<void> {
    const receipt =
      await this.receiptsRepository.findById(receiptId);

    if (!receipt || receipt.split_type === "manual") {
      return;
    }

    const members =
      await this.receiptsRepository.findMembers(receiptId);
    const priority = this.priorityOrder(members);
    const autoMemberIds = members
      .filter((member) => !member.amount_owed_override)
      .map((member) => member.id);

    if (autoMemberIds.length === 0) {
      return;
    }

    const shares =
      receipt.split_type === "equal"
        ? this.recalculateEqual(
            receipt,
            members,
            autoMemberIds,
            priority,
          )
        : await this.recalculateItemized(
            receiptId,
            autoMemberIds,
            priority,
          );

    await Promise.all(
      autoMemberIds.map((memberId) =>
        this.receiptsRepository.updateMember(
          receiptId,
          memberId,
          {
            amount_owed: shares.get(memberId) ?? 0,
          },
        ),
      ),
    );
  }

  // Creator first, then earliest-joined — used as the deterministic
  // rounding-remainder tie-breaker throughout this engine.
  private priorityOrder(
    members: ReceiptMember[],
  ): Map<string, number> {
    const ordered = [...members].sort((a, b) => {
      if (a.role !== b.role) {
        return a.role === "creator" ? -1 : 1;
      }

      return a.joined_at.getTime() - b.joined_at.getTime();
    });

    return new Map(
      ordered.map((member, index) => [member.id, index]),
    );
  }

  private distribute(
    total: number,
    memberIds: string[],
    priority: Map<string, number>,
  ): Map<string, number> {
    const ordered = [...memberIds].sort(
      (a, b) =>
        (priority.get(a) ?? 0) - (priority.get(b) ?? 0),
    );
    const n = ordered.length;
    const base = Math.floor(total / n);
    const remainder = total - base * n;

    const result = new Map<string, number>();

    ordered.forEach((memberId, index) => {
      result.set(
        memberId,
        base + (index < remainder ? 1 : 0),
      );
    });

    return result;
  }

  private recalculateEqual(
    receipt: { amount: number },
    members: ReceiptMember[],
    autoMemberIds: string[],
    priority: Map<string, number>,
  ): Map<string, number> {
    const overriddenTotal = members
      .filter((member) => member.amount_owed_override)
      .reduce(
        (sum, member) => sum + (member.amount_owed ?? 0),
        0,
      );

    const pool = Math.max(
      receipt.amount - overriddenTotal,
      0,
    );

    return this.distribute(pool, autoMemberIds, priority);
  }

  private async recalculateItemized(
    receiptId: string,
    autoMemberIds: string[],
    priority: Map<string, number>,
  ): Promise<Map<string, number>> {
    const autoMemberSet = new Set(autoMemberIds);
    const result = new Map<string, number>(
      autoMemberIds.map((memberId) => [memberId, 0]),
    );

    const assignments =
      await this.expensesRepository.findSplitAssignmentsForReceipt(
        receiptId,
      );

    const byExpense = new Map<
      string,
      { amount: number; memberIds: string[] }
    >();

    for (const assignment of assignments) {
      const entry = byExpense.get(
        assignment.expense_id,
      ) ?? {
        amount: assignment.amount,
        memberIds: [],
      };

      entry.memberIds.push(assignment.member_id);
      byExpense.set(assignment.expense_id, entry);
    }

    for (const {
      amount,
      memberIds,
    } of byExpense.values()) {
      const itemShares = this.distribute(
        amount,
        memberIds,
        priority,
      );

      itemShares.forEach((share, memberId) => {
        if (autoMemberSet.has(memberId)) {
          result.set(
            memberId,
            (result.get(memberId) ?? 0) + share,
          );
        }
      });
    }

    return result;
  }
}
