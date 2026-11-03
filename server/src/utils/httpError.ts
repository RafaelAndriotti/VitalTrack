/**
 * Error with an HTTP status, thrown by controllers for expected 4xx outcomes.
 * asyncHandler turns it into `{ error: message }` with that status (no logging),
 * exactly like the former inline `res.status(4xx).json({ error })` returns.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}
