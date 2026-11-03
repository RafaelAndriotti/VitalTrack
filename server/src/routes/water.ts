import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { userRateLimit } from "../middlewares/userRateLimit.js";
import { getWater, upsertWater } from "../controllers/water.controller.js";
import { validate } from "../middlewares/validate.js";
import { getWaterQuery, upsertWaterBody } from "../validators/water.validator.js";

const router = Router();

// All routes require authentication
router.use(authenticate, userRateLimit);

router.get("/", validate({ query: getWaterQuery }), getWater);
router.post("/", validate({ body: upsertWaterBody }), upsertWater);

export default router;
