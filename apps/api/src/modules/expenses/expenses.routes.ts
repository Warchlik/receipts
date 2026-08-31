import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import {
  createExpenseSchema,
  deleteExpenseSchema,
  getExpenseByIdSchema,
  listExpensesSchema,
  updateExpenseSchema,
} from "./expenses.schema";
import { ExpensesRepository } from "./expenses.repository";
import { ExpensesService } from "./expenses.service";
import { ExpensesController } from "./expenses.controller";
import { ReceiptsRepository } from "@/modules/receipts/receipts.repository";

// mergeParams: true — needs the parent receipt's `:id` param.
export const expensesRouter = Router({ mergeParams: true });

const expensesRepository = new ExpensesRepository();
const receiptsRepository = new ReceiptsRepository();
const expensesService = new ExpensesService(
  expensesRepository,
  receiptsRepository,
);
const expensesController = new ExpensesController(expensesService);

expensesRouter.use(requireAuth);

/**
 * @openapi
 * /api/receipts/{id}/expenses:
 *   get:
 *     summary: List expenses attached to a receipt
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: List of expenses
 */
expensesRouter.get(
  "/",
  validate(listExpensesSchema),
  asyncHandler(expensesController.getExpenses),
);

/**
 * @openapi
 * /api/receipts/{id}/expenses/{expenseId}:
 *   get:
 *     summary: Get an expense by id
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: Expense details
 */
expensesRouter.get(
  "/:expenseId",
  validate(getExpenseByIdSchema),
  asyncHandler(expensesController.getExpenseById),
);

/**
 * @openapi
 * /api/receipts/{id}/expenses:
 *   post:
 *     summary: Add an expense to a receipt
 *     tags: [Expenses]
 *     responses:
 *       201:
 *         description: Expense created
 */
expensesRouter.post(
  "/",
  validate(createExpenseSchema),
  asyncHandler(expensesController.createExpense),
);

/**
 * @openapi
 * /api/receipts/{id}/expenses/{expenseId}:
 *   patch:
 *     summary: Update an expense
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: Expense updated
 */
expensesRouter.patch(
  "/:expenseId",
  validate(updateExpenseSchema),
  asyncHandler(expensesController.updateExpense),
);

/**
 * @openapi
 * /api/receipts/{id}/expenses/{expenseId}:
 *   delete:
 *     summary: Delete an expense
 *     tags: [Expenses]
 *     responses:
 *       200:
 *         description: Expense deleted
 */
expensesRouter.delete(
  "/:expenseId",
  validate(deleteExpenseSchema),
  asyncHandler(expensesController.deleteExpense),
);
