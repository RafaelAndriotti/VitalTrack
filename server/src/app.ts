import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import waterRoutes from "./routes/water.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Middleware
// Security headers (CSP off by default — this is a JSON API, not HTML).
app.use(helmet());
// Restrict CORS to the app origin when configured. CORS_ORIGIN accepts a
// comma-separated list; unset means allow all (dev convenience only).
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : undefined;
app.use(cors(corsOrigins ? { origin: corsOrigins } : undefined));
// Cap body size — the API only ever receives small JSON payloads.
app.use(express.json({ limit: "100kb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/water", waterRoutes);

// Central error handler (safety net; asyncHandler still owns the handlers' own responses)
app.use(errorHandler);

export default app;
