import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * Express's error-handling chain instead of becoming an unhandled rejection.
 * Behavior is preserved: handlers that already send their own response are
 * unaffected; only thrown/rejected errors reach `next`.
 */
export function asyncHandler(handler: AsyncRequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
