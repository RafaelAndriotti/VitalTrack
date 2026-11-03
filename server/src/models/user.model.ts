import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface PublicUserRow {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserRow extends PublicUserRow {
  password_hash: string;
}

const existsByEmail = db.prepare("SELECT id FROM users WHERE email = ?");
const insertUser = db.prepare(
  `INSERT INTO users (id, email, password_hash, name)
   VALUES (?, ?, ?, ?)`
);
// Never SELECT * on users — return explicit non-sensitive columns only.
const selectPublicById = db.prepare(
  "SELECT id, email, name, created_at FROM users WHERE id = ?"
);
const selectWithHashByEmail = db.prepare(
  "SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?"
);

export const userModel = {
  emailExists(email: string): boolean {
    return !!existsByEmail.get(email);
  },

  /** Inserts a user and returns the new id. */
  create(email: string, passwordHash: string, name: string): string {
    const id = randomUUID();
    insertUser.run(id, email, passwordHash, name);
    return id;
  },

  findPublicById(id: string): PublicUserRow | undefined {
    return selectPublicById.get(id) as PublicUserRow | undefined;
  },

  /** Includes password_hash: for credential verification only, never render it. */
  findWithHashByEmail(email: string): UserRow | undefined {
    return selectWithHashByEmail.get(email) as UserRow | undefined;
  },
};
