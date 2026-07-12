import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRoutes } from "./routes/index";
import { notFoundMiddleware } from "./middlewares/not-found.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./modules/auth/auth.routes";

const rateLimitter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

export const app = express();

app.use(rateLimitter);
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    credentials: true,
  }),
);

app.use('/api/auth/*splat', authRoutes)

app.use(
  express.json({
    limit: "10mb",
  }),
);
app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.use(
  "/api/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec),
);
app.use("/api", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);
