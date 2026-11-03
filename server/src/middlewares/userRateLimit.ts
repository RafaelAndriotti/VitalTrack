import rateLimit from "express-rate-limit";
import type { AuthRequest } from "./auth.js";

function positiveIntFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Per-user throttle for the authenticated routes. MUST run after
 * `authenticate`: the key is the user id, not the IP, so users behind one
 * NAT/proxy do not share a bucket. In-memory (per process).
 * Defaults to 300 requests per minute per user; override with
 * USER_RATE_LIMIT_MAX / USER_RATE_LIMIT_WINDOW_MS.
 */
export const userRateLimit = rateLimit({
  windowMs: positiveIntFromEnv("USER_RATE_LIMIT_WINDOW_MS", 60_000),
  limit: positiveIntFromEnv("USER_RATE_LIMIT_MAX", 300),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // No IP involved, so the ipKeyGenerator helper is not needed. Falls back to
  // a constant bucket only if authenticate was skipped (never in practice).
  keyGenerator: (req) => (req as AuthRequest).userId ?? "anonymous",
  message: { error: "Too many requests, please try again later" },
});
