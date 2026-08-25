import jwt from "jsonwebtoken";

/**
 * Signs a 7-day JWT (HS256) carrying the user id. Mirrors the previous
 * inline behavior in routes/auth.ts exactly.
 */
export function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}
