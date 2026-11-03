import { Request, Response, NextFunction } from "express";

/** body-parser errors carry a `type` such as "entity.parse.failed". */
function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "type" in err) {
    const type = (err as { type: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }
  return undefined;
}

/**
 * Central error handler. Kept as a safety net for errors that escape the
 * asyncHandler-wrapped handlers (which already own their specific status codes
 * and messages). It never leaks internal details to the client.
 * Client mistakes raised by express.json() are mapped to 4xx.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) {
    console.error("Unhandled error:", err);
    return;
  }

  switch (bodyParserErrorType(err)) {
    case "entity.parse.failed":
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    case "entity.too.large":
      res.status(413).json({ error: "Payload too large" });
      return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
