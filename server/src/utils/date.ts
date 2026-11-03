/** Today as YYYY-MM-DD (UTC), the default date used across the API. */
export function today(): string {
  return new Date().toISOString().split("T")[0];
}
