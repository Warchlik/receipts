import { ApiError } from "@/utils/ApiError";
import {
  getPaginationMeta,
  PaginationParams,
} from "@/utils/pagination";
import { stripUndefined } from "@/utils/object";
import { ReceiptsRepository } from "@/modules/receipts/receipts.repository";
import { SplitEngine } from "@/modules/receipts/split-engine";
import { ExpensesRepository } from "./expenses.repository";
import { UpdateExpenseInput } from "./expenses.schema";
import {
  Expense,
  NewExpense,
  PaginationExpenses,
} from "./expenses.types";

export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly receiptsRepository: ReceiptsRepository,
    private readonly splitEngine: SplitEngine,
  ) { }

  async getExpenses(
    receiptId: string,
    userId: string,
    pagination: PaginationParams,
  ): Promise<PaginationExpenses> {
    await this.assertIsMember(receiptId, userId);

    const [data, total] = await Promise.all([
      this.expensesRepository.findManyForReceipt(
        receiptId,
        pagination.offset,
        pagination.limit,
      ),
      this.expensesRepository.countForReceipt(receiptId),
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

  async getExpenseById(
    receiptId: string,
    id: string,
    userId: string,
  ): Promise<Expense> {
    await this.assertIsMember(receiptId, userId);

    const expense =
      await this.expensesRepository.findByIdForReceipt(
        receiptId,
        id,
      );

    if (!expense) {
      throw new ApiError(404, "Expense not found");
    }

    return expense;
  }

  async createExpense(
    receiptId: string,
    userId: string,
    data: Omit<NewExpense, "id" | "receipt_id">,
  ): Promise<Expense> {
    await this.assertIsMember(receiptId, userId);

    const expense = await this.expensesRepository.create({
      ...data,
      receipt_id: receiptId,
    });

    await this.splitEngine.recalculate(receiptId);

    return expense;
  }

  async updateExpense(
    receiptId: string,
    id: string,
    userId: string,
    data: UpdateExpenseInput,
  ): Promise<Expense> {
    await this.assertIsMember(receiptId, userId);

    const expense = await this.expensesRepository.update(
      receiptId,
      id,
      stripUndefined(data),
    );

    if (!expense) {
      throw new ApiError(404, "Expense not found");
    }

    if (data.amount !== undefined) {
      await this.splitEngine.recalculate(receiptId);
    }

    return expense;
  }

  async deleteExpense(
    receiptId: string,
    id: string,
    userId: string,
  ): Promise<void> {
    await this.assertIsMember(receiptId, userId);

    const expense = await this.expensesRepository.delete(
      receiptId,
      id,
    );

    if (!expense) {
      throw new ApiError(404, "Expense not found");
    }

    await this.splitEngine.recalculate(receiptId);
  }

  async setSplits(
    receiptId: string,
    expenseId: string,
    userId: string,
    memberIds: string[],
  ): Promise<void> {
    await this.assertIsMember(receiptId, userId);

    const expense =
      await this.expensesRepository.findByIdForReceipt(
        receiptId,
        expenseId,
      );

    if (!expense) {
      throw new ApiError(404, "Expense not found");
    }

    const uniqueMemberIds = [...new Set(memberIds)];

    for (const memberId of uniqueMemberIds) {
      const member =
        await this.receiptsRepository.findMemberById(
          receiptId,
          memberId,
        );

      if (!member) {
        throw new ApiError(
          400,
          `Member ${memberId} is not part of this receipt`,
        );
      }
    }

    await this.expensesRepository.setSplits(
      expenseId,
      uniqueMemberIds,
    );
    await this.splitEngine.recalculate(receiptId);
  }

  private async assertIsMember(
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
  }
}
