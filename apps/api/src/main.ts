import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { toNodeHandler } from "better-auth/node";
import swaggerUi from "swagger-ui-express";
import { auth } from "./lib/auth";
import { env } from "./config/env";
import { apiRoutes } from "./routes/index";
import { swaggerSpec } from "./config/swagger";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";

// Health checks (Docker, load balancers) must never be rejected by the
// general rate limiter, so this route is registered before it.
export const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

// Auth endpoints get their own, tighter limit — brute-forcing sign-in
// shouldn't be able to hide inside the shared general-API budget.
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

// POST /api/auth/sign-up/email
// POST /api/auth/sign-in/email
// POST /api/auth/sign-out
// GET /api/auth/session
app.use("/api/auth", authRateLimiter);
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRateLimiter);

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);

app.use("/api", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
