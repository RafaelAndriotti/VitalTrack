import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { getWater, upsertWater } from "../controllers/water.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", getWater);
router.post("/", upsertWater);

export default router;
