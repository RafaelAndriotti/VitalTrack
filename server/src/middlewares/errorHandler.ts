import { Request, Response, NextFunction } from "express";

/** body-parser errors carry a `type` such as "entity.parse.failed". */
function bodyParserErrorType(err: unknown): string | undefined {
  if (typeof err === "object" && err !== null && "type" in err) {
    const type = (err as { type: unknown }).type;
    return typeof type === "string" ? type : undefined;
  }
  return undefined;
}

/** Fixed, generic messages for other client errors raised by body-parser. */
const CLIENT_ERROR_MESSAGES: Record<number, string> = {
  400: "Bad request",
  413: "Payload too large",
  415: "Unsupported media type",
};

/**
 * body-parser errors flagged `expose` with a 4xx status (e.g. 415
 * encoding.unsupported, 400 request.aborted). Returns that status or undefined.
 */
function exposedClientStatus(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const { expose, status } = err as { expose?: unknown; status?: unknown };
  if (expose !== true || typeof status !== "number") return undefined;
  return Number.isInteger(status) && status >= 400 && status < 500 ? status : undefined;
}

/**
 * Central error handler. Kept as a safety net for errors that escape the
 * asyncHandler-wrapped handlers (which already own their specific status codes
 * and messages). It never leaks internal details to the client.
 * Client mistakes raised by express.json() are mapped to 4xx with a fixed
 * message per status (err.message is never echoed back).
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

  const status = exposedClientStatus(err);
  if (status !== undefined) {
    res.status(status).json({ error: CLIENT_ERROR_MESSAGES[status] ?? "Bad request" });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
}
