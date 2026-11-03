/**
 * Narrows a row re-read right after an insert/update. A missing row is an
 * internal inconsistency: throws a plain Error, which asyncHandler logs and
 * turns into the handler's 500 fallback message.
 */
export function requireFound<T>(row: T | undefined): T {
  if (row === undefined) {
    throw new Error("Record not found after write");
  }
  return row;
}
