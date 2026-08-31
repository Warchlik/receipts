import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import {
  addMemberSchema,
  createReceiptSchema,
  deleteReceiptSchema,
  getReceiptByIdSchema,
  listMembersSchema,
  removeMemberSchema,
  updateMemberSchema,
  updateReceiptSchema,
} from "./receipts.schema";
import { ReceiptsRepository } from "./receipts.repository";
import { ReceiptsService } from "./receipts.service";
import { ReceiptsController } from "./receipts.controller";
import { expensesRouter } from "@/modules/expenses/expenses.routes";

export const receiptsRouter = Router();

const receiptsRepository = new ReceiptsRepository();
const receiptsService = new ReceiptsService(receiptsRepository);
const receiptsController = new ReceiptsController(receiptsService);

receiptsRouter.use(requireAuth);

/**
 * @openapi
 * /api/receipts:
 *   get:
 *     summary: Get receipts the current user is splitting
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: List of receipts
 */
receiptsRouter.get("/", asyncHandler(receiptsController.getReceipts));

/**
 * @openapi
 * /api/receipts/{id}:
 *   get:
 *     summary: Get a receipt by id
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Receipt details
 *       404:
 *         description: Receipt not found
 */
receiptsRouter.get(
  "/:id",
  validate(getReceiptByIdSchema),
  asyncHandler(receiptsController.getReceiptById),
);

/**
 * @openapi
 * /api/receipts:
 *   post:
 *     summary: Create a receipt (creator is added as a member automatically)
 *     tags: [Receipts]
 *     responses:
 *       201:
 *         description: Receipt created
 */
receiptsRouter.post(
  "/",
  validate(createReceiptSchema),
  asyncHandler(receiptsController.createReceipt),
);

/**
 * @openapi
 * /api/receipts/{id}:
 *   patch:
 *     summary: Update a receipt (creator only)
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Receipt updated
 */
receiptsRouter.patch(
  "/:id",
  validate(updateReceiptSchema),
  asyncHandler(receiptsController.updateReceipt),
);

/**
 * @openapi
 * /api/receipts/{id}:
 *   delete:
 *     summary: Delete a receipt (creator only)
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Receipt deleted
 */
receiptsRouter.delete(
  "/:id",
  validate(deleteReceiptSchema),
  asyncHandler(receiptsController.deleteReceipt),
);

/**
 * @openapi
 * /api/receipts/{id}/members:
 *   get:
 *     summary: List members splitting a receipt
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: List of members
 */
receiptsRouter.get(
  "/:id/members",
  validate(listMembersSchema),
  asyncHandler(receiptsController.listMembers),
);

/**
 * @openapi
 * /api/receipts/{id}/members:
 *   post:
 *     summary: Add a member to a receipt (creator only)
 *     tags: [Receipts]
 *     responses:
 *       201:
 *         description: Member added
 */
receiptsRouter.post(
  "/:id/members",
  validate(addMemberSchema),
  asyncHandler(receiptsController.addMember),
);

/**
 * @openapi
 * /api/receipts/{id}/members/{userId}:
 *   patch:
 *     summary: Update a member's owed amount or paid status
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Member updated
 */
receiptsRouter.patch(
  "/:id/members/:userId",
  validate(updateMemberSchema),
  asyncHandler(receiptsController.updateMember),
);

/**
 * @openapi
 * /api/receipts/{id}/members/{userId}:
 *   delete:
 *     summary: Remove a member from a receipt (creator only)
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Member removed
 */
receiptsRouter.delete(
  "/:id/members/:userId",
  validate(removeMemberSchema),
  asyncHandler(receiptsController.removeMember),
);

// Expenses are always scoped to a receipt.
receiptsRouter.use("/:id/expenses", expensesRouter);
