import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import workoutRoutes from "./routes/workouts.js";
import mealRoutes from "./routes/meals.js";
import waterRoutes from "./routes/water.js";
import { errorHandler } from "./middlewares/errorHandler.js";

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

// Central error handler (safety net; per-handler try/catch still owns its responses)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`VitalTrack server running on http://localhost:${PORT}`);
});

export default app;
