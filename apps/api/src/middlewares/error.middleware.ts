import type { ErrorRequestHandler } from "express";

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  console.error(error);

  const statusCode = error.statusCode ?? 500;
  const message = error.message ?? "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
  });
};
