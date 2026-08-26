// API base URL. Override per environment with EXPO_PUBLIC_API_URL (inlined by
// Expo at build time). MUST be https in production — the JWT and all user data
// travel in this connection, so cleartext http would expose them in transit.
// Falls back to the local dev server when unset.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api';
