import { Router } from "express";
import { exampleRouter } from "@/modules/example/example.routes";

export const apiRoutes = Router();

apiRoutes.use("/examples", exampleRouter);
