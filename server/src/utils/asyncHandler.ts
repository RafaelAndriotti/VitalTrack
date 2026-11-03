import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.js";
import { HttpError } from "./httpError.js";

type Handler = (req: AuthRequest, res: Response) => void | Promise<void>;

/**
 * Wraps a controller handler with the try/catch every handler used to repeat.
 * - HttpError: responds with its status and message (not logged).
 * - Anything else: logs `"<logLabel>:" <message>` and responds 500 with
 *   `{ error: fallbackMessage }` — the same per-handler text as before.
 */
export function asyncHandler(
  handler: Handler,
  logLabel: string,
  fallbackMessage: string
): (req: AuthRequest, res: Response) => Promise<void> {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      console.error(`${logLabel}:`, (err as Error).message);
      res.status(500).json({ error: fallbackMessage });
    }
  };
}
