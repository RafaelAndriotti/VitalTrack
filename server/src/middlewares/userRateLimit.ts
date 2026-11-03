import rateLimit from "express-rate-limit";
import type { AuthRequest } from "./auth.js";

/**
 * Strict env parse: the whole string must be a safe positive integer <= max.
 * Anything else (empty aside) warns once and returns the default.
 */
export function parseBoundedIntEnv(
  name: string,
  raw: string | undefined,
  fallback: number,
  max: number
): number {
  if (raw === undefined || raw === "") return fallback;
  const n = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;
  if (Number.isSafeInteger(n) && n > 0 && n <= max) return n;
  // Never log the raw value: env vars may hold secrets by mistake.
  console.warn(`Invalid ${name} (expected integer 1..${max}); using default ${fallback}`);
  return fallback;
}

/**
 * Per-user throttle for the authenticated routes. MUST run after
 * `authenticate`: the key is the user id, not the IP, so users behind one
 * NAT/proxy do not share a bucket. In-memory (per process).
 * Defaults to 300 requests per minute per user; override with
 * USER_RATE_LIMIT_MAX / USER_RATE_LIMIT_WINDOW_MS.
 */
export const userRateLimit = rateLimit({
  windowMs: parseBoundedIntEnv(
    "USER_RATE_LIMIT_WINDOW_MS",
    process.env.USER_RATE_LIMIT_WINDOW_MS,
    60_000,
    86_400_000
  ),
  limit: parseBoundedIntEnv("USER_RATE_LIMIT_MAX", process.env.USER_RATE_LIMIT_MAX, 300, 100_000),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  // No IP involved, so the ipKeyGenerator helper is not needed. A missing
  // userId means authenticate was skipped: programming bug, fail with a 500
  // instead of sharing a bucket.
  keyGenerator: (req) => {
    const userId = (req as AuthRequest).userId;
    if (!userId) throw new Error("userRateLimit used without authenticate");
    return userId;
  },
  message: { error: "Too many requests, please try again later" },
});
