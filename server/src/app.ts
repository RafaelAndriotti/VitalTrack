import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import waterRoutes from "./routes/water.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// Behind Railway's reverse proxy every request reaches us from the proxy's IP,
// so without this req.ip is identical for all clients and they would share one
// rate-limit bucket (one attacker could lock everybody out of login).
// Trust exactly 1 hop (the Railway proxy) so req.ip comes from the
// X-Forwarded-For entry that proxy appended. Do NOT raise this number unless
// more proxies really sit in front: trusting extra hops lets clients spoof
// X-Forwarded-For and evade the rate limiter. Override with TRUST_PROXY (hops).
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY ?? "", 10);
app.set("trust proxy", Number.isInteger(trustProxyHops) && trustProxyHops >= 0 ? trustProxyHops : 1);

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
