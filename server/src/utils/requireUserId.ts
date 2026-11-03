import type { AuthRequest } from "../middlewares/auth.js";
import { HttpError } from "./httpError.js";

/**
 * Returns the authenticated user id. `authenticate` always sets it on
 * protected routes, so the 401 is unreachable in practice; it exists to
 * narrow `string | undefined` to `string` without scattering `!`.
 */
export function requireUserId(req: AuthRequest): string {
  if (!req.userId) {
    throw new HttpError(401, "Missing or invalid authorization header");
  }
  return req.userId;
}
