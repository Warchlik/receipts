import { validate } from "@/middlewares/validate.middleware";
import { Router } from "express";
import {
  createExampleSchema,
  deleteExampleSchema,
  getExampleByIdSchema,
  updateExampleSchema,
} from "./example.schema";
import { asyncHandler } from "@/utils/asyncHandler";
import { ExampleService } from "./example.service";
import { ExampleRepository } from "./example.repository";
import { ExampleController } from "./example.controller";

export const exampleRouter = Router();

const exampleRepository = new ExampleRepository();
const exampleService = new ExampleService(
  exampleRepository,
);
const exampleController = new ExampleController(
  exampleService,
);

/**
 * @openapi
 * /api/examples:
 *   get:
 *     summary: Get all examples
 *     tags:
 *       - Examples
 *     responses:
 *       200:
 *         description: List of examples
 */
exampleRouter.get(
  "/",
  asyncHandler(exampleController.getExamples),
);

/**
 * @openapi
 * /api/examples/{id}:
 *   get:
 *     summary: Get example by id
 *     tags:
 *       - Examples
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Example ID
 *     responses:
 *       200:
 *         description: Example found
 *       404:
 *         description: Example not found
 */
exampleRouter.get(
  "/:id",
  validate(getExampleByIdSchema),
  asyncHandler(exampleController.getExampleById),
);

/**
 * @openapi
 * /api/examples:
 *   post:
 *     summary: Create example
 *     tags:
 *       - Examples
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateExampleInput'
 *     responses:
 *       201:
 *         description: Example created
 *       400:
 *         description: Invalid request body
 */
exampleRouter.post(
  "/",
  validate(createExampleSchema),
  asyncHandler(exampleController.createExample),
);

/**
 * @openapi
 * /api/examples/{id}:
 *   patch:
 *     summary: Update example
 *     tags:
 *       - Examples
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateExampleInput'
 *     responses:
 *       200:
 *         description: Example updated
 *       404:
 *         description: Example not found
 */
exampleRouter.patch(
  "/:id",
  validate(updateExampleSchema),
  asyncHandler(exampleController.updateExample),
);

/**
 * @openapi
 * /api/examples/{id}:
 *   delete:
 *     summary: Delete example
 *     tags:
 *       - Examples
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Example deleted
 *       404:
 *         description: Example not found
 */
exampleRouter.delete(
  "/:id",
  validate(deleteExampleSchema),
  asyncHandler(exampleController.deleteExample),
);
