import { Router } from "express";
import { exampleRouter } from "@/modules/example/example.routes";
import { receiptsRouter } from "@/modules/receipts/receipts.routes";
import { profilesRouter } from "@/modules/profiles/profiles.routes";

export const apiRoutes = Router();

apiRoutes.use("/examples", exampleRouter);
apiRoutes.use("/receipts", receiptsRouter);
apiRoutes.use("/profiles", profilesRouter);
