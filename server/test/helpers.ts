// Test helpers. Env vars MUST be set before the app (and config/db) is
// imported, because db.ts opens the SQLite file at import time. Each test
// file runs in its own process (node:test), so each gets its own DB file.
import { randomUUID } from "node:crypto";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

export const JWT_SECRET = "test-secret-test-secret-test-secret-1234567890";
process.env.JWT_SECRET = JWT_SECRET;
const DB_PATH = join(tmpdir(), `vitaltrack-test-${randomUUID()}.db`);
process.env.DATABASE_PATH = DB_PATH;
delete process.env.CORS_ORIGIN;

const { default: app } = await import("../src/app.js");

let server: Server | undefined;
export let baseUrl = "";

export async function startServer(): Promise<string> {
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => resolve());
  });
  baseUrl = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
  return baseUrl;
}

export async function stopServer(): Promise<void> {
  if (!server) return;
  server.closeAllConnections?.();
  await new Promise<void>((resolve) => server!.close(() => resolve()));
  server = undefined;

  // The db module is a singleton opened at import time: close it only after
  // the HTTP server stopped, then remove the temp files (missing ones are fine).
  const { db } = await import("../src/config/db.js");
  if (db.open) db.close();
  for (const suffix of ["", "-wal", "-shm"]) {
    rmSync(DB_PATH + suffix, { force: true });
  }
}

export interface ApiResult<T = any> {
  status: number;
  body: T;
  text: string;
  headers: Headers;
}

// JSON request helper. `raw` sends the body string as-is (for malformed JSON).
export async function api<T = any>(
  method: string,
  path: string,
  opts: { token?: string; body?: unknown; raw?: string; headers?: Record<string, string> } = {}
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { ...(opts.headers ?? {}) };
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;
  let body: string | undefined;
  if (opts.raw !== undefined) {
    body = opts.raw;
    headers["Content-Type"] = "application/json";
  } else if (opts.body !== undefined) {
    body = JSON.stringify(opts.body);
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(baseUrl + path, { method, headers, body });
  const text = await res.text();
  let parsed: any = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  return { status: res.status, body: parsed, text, headers: res.headers };
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

// Registers through the real HTTP endpoint. NOTE: /api/auth/* is rate limited
// to 10 requests per IP per window (in-memory, per process), so use this
// sparingly; most tests use createUser() instead.
export async function registerUser(name = "Test User"): Promise<TestUser> {
  const email = `u-${randomUUID()}@example.com`;
  const res = await api("POST", "/api/auth/register", {
    body: { email, password: "secret123", name },
  });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${res.text}`);
  return { id: res.body.user.id, email, name, token: res.body.token };
}

// Inserts a user directly in the DB and signs a token, bypassing the auth
// rate limiter. Same token format as the real endpoint (libs/token).
export async function createUser(name = "Test User"): Promise<TestUser> {
  const { db } = await import("../src/config/db.js");
  const { generateToken } = await import("../src/libs/token.js");
  const id = randomUUID();
  const email = `u-${id}@example.com`;
  db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)").run(
    id,
    email,
    "x",
    name
  );
  return { id, email, name, token: generateToken(id) };
}
