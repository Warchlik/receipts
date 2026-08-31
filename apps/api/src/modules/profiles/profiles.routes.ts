import { Router } from "express";
import { validate } from "@/middlewares/validate.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import { requireAuth } from "@/modules/auth/auth.middleware";
import { updateProfileSchema } from "./profiles.schema";
import { ProfilesRepository } from "./profiles.repository";
import { ProfilesService } from "./profiles.service";
import { ProfilesController } from "./profiles.controller";

export const profilesRouter = Router();

const profilesRepository = new ProfilesRepository();
const profilesService = new ProfilesService(profilesRepository);
const profilesController = new ProfilesController(profilesService);

profilesRouter.use(requireAuth);

/**
 * @openapi
 * /api/profiles/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: Profile details
 */
profilesRouter.get("/me", asyncHandler(profilesController.getMe));

/**
 * @openapi
 * /api/profiles/me:
 *   patch:
 *     summary: Update the current user's profile
 *     tags: [Profiles]
 *     responses:
 *       200:
 *         description: Profile updated
 */
profilesRouter.patch(
  "/me",
  validate(updateProfileSchema),
  asyncHandler(profilesController.updateMe),
);
