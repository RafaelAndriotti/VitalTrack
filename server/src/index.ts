import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import waterRoutes from "./routes/water.js";

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
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/meals", mealRoutes);
app.use("/api/water", waterRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`VitalTrack server running on http://localhost:${PORT}`);
});

export default app;
