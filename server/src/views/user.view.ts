import type { PublicUserRow, UserRow } from "../models/user.model.js";

export type UserResponse = PublicUserRow;

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

/** Strips password_hash so it can never reach the client. */
export function renderUser(user: UserRow | PublicUserRow): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at,
  };
}

export function renderAuth(token: string, user: UserRow | PublicUserRow): AuthResponse {
  return { token, user: renderUser(user) };
}
