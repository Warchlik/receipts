import { Router } from "express";
import { receiptsRouter } from "@/modules/receipts/receipts.routes";
import { profilesRouter } from "@/modules/profiles/profiles.routes";
import { invitesRouter } from "@/modules/invites/invites.routes";

export const apiRoutes = Router();

apiRoutes.use("/receipts", receiptsRouter);
apiRoutes.use("/profiles", profilesRouter);
apiRoutes.use("/invites", invitesRouter);
