import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { ReceiptsRepository } from "@/modules/receipts/receipts.repository";
import { ReceiptsService } from "@/modules/receipts/receipts.service";
import { SplitEngine } from "@/modules/receipts/split-engine";
import { ExpensesRepository } from "@/modules/expenses/expenses.repository";
import {
  acceptInviteSchema,
  createInviteSchema,
  getInviteByTokenSchema,
} from "./invites.schema";
import { InvitesRepository } from "./invites.repository";
import { InvitesService } from "./invites.service";
import { InvitesController } from "./invites.controller";

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
const invitesRepository = new InvitesRepository();
const invitesService = new InvitesService(
  invitesRepository,
  receiptsRepository,
  receiptsService,
);
const invitesController = new InvitesController(
  invitesService,
);

// mergeParams: true — needs the parent receipt's `:id` param.
export const receiptInvitesRouter = Router({
  mergeParams: true,
});

receiptInvitesRouter.use(requireAuth);

/**
 * @openapi
 * /api/receipts/{id}/invites:
 *   post:
 *     summary: Generate an invite token for a receipt (creator only)
 *     tags: [Invites]
 *     responses:
 *       201:
 *         description: Invite created
 */
receiptInvitesRouter.post(
  "/",
  validate(createInviteSchema),
  asyncHandler(invitesController.createInvite),
);

// Unlike every other router in this codebase, this one mixes a public route
// (getInvitePreview) with a protected one (acceptInvite), so requireAuth is
// applied per-route instead of router-wide.
export const invitesRouter = Router();

/**
 * @openapi
 * /api/invites/{token}:
 *   get:
 *     summary: Public preview of an invite (no auth required)
 *     tags: [Invites]
 *     responses:
 *       200:
 *         description: Invite preview
 *       404:
 *         description: Invite not found
 *       410:
 *         description: Invite used or expired
 */
invitesRouter.get(
  "/:token",
  validate(getInviteByTokenSchema),
  asyncHandler(invitesController.getInvitePreview),
);

/**
 * @openapi
 * /api/invites/{token}/accept:
 *   post:
 *     summary: Accept an invite (join or claim a guest member)
 *     tags: [Invites]
 *     responses:
 *       200:
 *         description: Invite accepted
 */
invitesRouter.post(
  "/:token/accept",
  requireAuth,
  validate(acceptInviteSchema),
  asyncHandler(invitesController.acceptInvite),
);
