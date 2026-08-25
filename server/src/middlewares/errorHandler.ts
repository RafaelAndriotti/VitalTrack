import { Request, Response, NextFunction } from "express";

/**
 * Central error handler. Kept as a safety net for errors that escape the
 * per-handler try/catch blocks (which already own their specific status codes
 * and messages). It never leaks internal details to the client.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Unhandled error:", err);

  if (res.headersSent) {
    return;
  }

  res.status(500).json({ error: "Internal server error" });
}
