import type { Request, Response } from "express";
import { ExpensesService } from "./expenses.service";
import {
  CreateExpenseInput,
  CreateExpenseParams,
  DeleteExpenseParams,
  GetExpenseByIdParams,
  ListExpensesParams,
  UpdateExpenseInput,
  UpdateExpenseParams,
} from "./expenses.schema";
import { getPaginationParams } from "@/utils/pagination";
import { PaginationExpenses } from "./expenses.types";

export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  getExpenses = async (req: Request<ListExpensesParams>, res: Response) => {
    const pagination = getPaginationParams(req.query);
    const result: PaginationExpenses = await this.expensesService.getExpenses(
      req.params.id,
      req.user!.id,
      pagination,
    );

    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  };

  getExpenseById = async (
    req: Request<GetExpenseByIdParams>,
    res: Response,
  ) => {
    const expense = await this.expensesService.getExpenseById(
      req.params.id,
      req.params.expenseId,
      req.user!.id,
    );

    res.status(200).json({ success: true, data: expense });
  };

  createExpense = async (
    req: Request<CreateExpenseParams, object, CreateExpenseInput>,
    res: Response,
  ) => {
    const expense = await this.expensesService.createExpense(
      req.params.id,
      req.user!.id,
      req.body,
    );

    res.status(201).json({ success: true, data: expense });
  };

  updateExpense = async (
    req: Request<UpdateExpenseParams, object, UpdateExpenseInput>,
    res: Response,
  ) => {
    const expense = await this.expensesService.updateExpense(
      req.params.id,
      req.params.expenseId,
      req.user!.id,
      req.body,
    );

    res.status(200).json({ success: true, data: expense });
  };

  deleteExpense = async (
    req: Request<DeleteExpenseParams>,
    res: Response,
  ) => {
    await this.expensesService.deleteExpense(
      req.params.id,
      req.params.expenseId,
      req.user!.id,
    );

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  };
}
