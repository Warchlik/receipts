import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import {
  addMemberSchema,
  claimMemberSchema,
  createReceiptSchema,
  deleteReceiptSchema,
  getReceiptByIdSchema,
  getSettlementSchema,
  listMembersSchema,
  removeMemberSchema,
  updateMemberSchema,
  updateReceiptSchema,
} from "./receipts.schema";
import { ReceiptsRepository } from "./receipts.repository";
import { ReceiptsService } from "./receipts.service";
import { ReceiptsController } from "./receipts.controller";
import { SplitEngine } from "./split-engine";
import { ExpensesRepository } from "@/modules/expenses/expenses.repository";
import { expensesRouter } from "@/modules/expenses/expenses.routes";
import { receiptInvitesRouter } from "@/modules/invites/invites.routes";

export const receiptsRouter = Router();

const receiptsRepository = new ReceiptsRepository();
const expensesRepository = new ExpensesRepository();
const splitEngine = new SplitEngine(
  receiptsRepository,
  expensesRepository,
);
const receiptsService = new ReceiptsService(
  receiptsRepository,
  splitEngine,
);
const receiptsController = new ReceiptsController(
  receiptsService,
);

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
receiptsRouter.get(
  "/",
  asyncHandler(receiptsController.getReceipts),
);

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
 * /api/receipts/{id}/settlement:
 *   get:
 *     summary: Who owes what to the creator, and how much has been collected
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Settlement summary
 */
receiptsRouter.get(
  "/:id/settlement",
  validate(getSettlementSchema),
  asyncHandler(receiptsController.getSettlement),
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
 * /api/receipts/{id}/members/{memberId}:
 *   patch:
 *     summary: Update a member's owed amount or paid status
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Member updated
 */
receiptsRouter.patch(
  "/:id/members/:memberId",
  validate(updateMemberSchema),
  asyncHandler(receiptsController.updateMember),
);

/**
 * @openapi
 * /api/receipts/{id}/members/{memberId}:
 *   delete:
 *     summary: Remove a member from a receipt (creator only)
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Member removed
 */
receiptsRouter.delete(
  "/:id/members/:memberId",
  validate(removeMemberSchema),
  asyncHandler(receiptsController.removeMember),
);

/**
 * @openapi
 * /api/receipts/{id}/members/{memberId}/claim:
 *   patch:
 *     summary: Attach the current user to an existing guest member
 *     tags: [Receipts]
 *     responses:
 *       200:
 *         description: Member claimed
 */
receiptsRouter.patch(
  "/:id/members/:memberId/claim",
  validate(claimMemberSchema),
  asyncHandler(receiptsController.claimMember),
);

receiptsRouter.use("/:id/expenses", expensesRouter);
receiptsRouter.use("/:id/invites", receiptInvitesRouter);
