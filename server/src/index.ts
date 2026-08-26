import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import waterRoutes from "./routes/water.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Fail fast if the JWT secret is missing or weak. A short/absent secret makes
// HS256 tokens brute-forceable — abort rather than boot insecurely.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error(
    "JWT_SECRET must be set and at least 32 characters. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\""
  );
}

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

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

// Central error handler (safety net; per-handler try/catch still owns its responses)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`VitalTrack server running on http://localhost:${PORT}`);
});

export default app;
