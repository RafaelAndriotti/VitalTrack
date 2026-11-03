import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.js";
import { registerBody, loginBody } from "../validators/auth.validator.js";

const router = Router();

// Throttle credential endpoints to blunt brute-force / credential stuffing.
// 10 attempts per IP per 15 min; failed requests count, successes are cheap.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

router.post("/register", authLimiter, validate({ body: registerBody }), register);
router.post("/login", authLimiter, validate({ body: loginBody }), login);

export default router;
