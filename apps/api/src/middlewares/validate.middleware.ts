import type {
  NextFunction,
  Request,
  Response,
} from "express";
import type { ZodObject } from "zod";

export const validate =
  (schema: ZodObject) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      next(result.error);
      return;
    }

    // Zod applies coercions/defaults (e.g. z.coerce.date(), .default()) that
    // only exist on `result.data` — write them back so handlers see the
    // parsed values, not the raw request. `req.query` is intentionally
    // excluded: Express 5 exposes it as a getter-only accessor derived from
    // `req.url`, so it cannot be reassigned.
    const data = result.data as { body?: unknown; params?: unknown };

    if (data.body !== undefined) {
      req.body = data.body;
    }

    if (data.params !== undefined) {
      req.params = data.params as Request["params"];
    }

    next();

  };
