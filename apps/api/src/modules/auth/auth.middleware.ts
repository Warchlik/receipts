import { auth } from "@/lib/auth";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const session = await auth.api.getSession({
    headers: new Headers(
      req.headers as Record<string, string>,
    ),
  });

  if (!session) {
    res
      .status(401)
      .json({ success: false, message: "Unauthorized" });
    return;
  }

  req.user = session.user;
  req.session = session.session;

  next();
};
