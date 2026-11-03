import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { api, startServer, stopServer, JWT_SECRET } from "./helpers.js";

// NOTE: /api/auth/* is limited to 10 requests per IP per window (shared by
// register + login). This file makes exactly 10 auth calls; do not add more
// without moving them to another file.

before(async () => {
  await startServer();
});
after(async () => {
  await stopServer();
});

test("GET /api/health -> 200 {status:'ok', timestamp}", async () => {
  const res = await api("GET", "/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body).sort(), ["status", "timestamp"]);
  assert.equal(res.body.status, "ok");
  assert.equal(new Date(res.body.timestamp).toISOString(), res.body.timestamp);
});

const email = `Mixed.Case-${Date.now()}@Example.COM`;
const lower = email.toLowerCase();

test("register: 201, token + user without password_hash, email lowercased", async () => {
  const res = await api("POST", "/api/auth/register", {
    body: { email, password: "secret123", name: "Ana" },
  });
  assert.equal(res.status, 201);
  assert.deepEqual(Object.keys(res.body).sort(), ["token", "user"]);
  assert.deepEqual(Object.keys(res.body.user).sort(), ["created_at", "email", "id", "name"]);
  assert.equal(res.body.user.email, lower);
  assert.equal(res.body.user.name, "Ana");
  assert.match(res.body.user.id, /^[0-9a-f-]{36}$/);
  assert.ok(!("password_hash" in res.body.user));
  assert.ok(!res.text.includes("password"));

  const payload = jwt.verify(res.body.token, JWT_SECRET) as jwt.JwtPayload;
  assert.equal(payload.userId, res.body.user.id);
  assert.equal(payload.exp! - payload.iat!, 7 * 24 * 3600);

  // Token works on a protected route (effect persisted: user exists).
  const w = await api("GET", "/api/workouts", { token: res.body.token });
  assert.equal(w.status, 200);
  assert.deepEqual(w.body, []);
});

test("register: 400 when email, password or name missing", async () => {
  const full = { email: "x@example.com", password: "secret123", name: "X" };
  for (const missing of ["email", "password", "name"] as const) {
    const body: Record<string, string> = { ...full };
    delete body[missing];
    const res = await api("POST", "/api/auth/register", { body });
    assert.equal(res.status, 400, `missing ${missing}`);
    assert.deepEqual(res.body, { error: "Email, password, and name are required" });
  }
});

test("register: 409 on duplicate email (case-insensitive)", async () => {
  const res = await api("POST", "/api/auth/register", {
    body: { email: lower.toUpperCase(), password: "other-pass", name: "Dup" },
  });
  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { error: "Email is already registered" });
});

test("login: 200 with token + user (no password_hash); email case-insensitive", async () => {
  const res = await api("POST", "/api/auth/login", {
    body: { email, password: "secret123" },
  });
  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body).sort(), ["token", "user"]);
  assert.deepEqual(Object.keys(res.body.user).sort(), ["created_at", "email", "id", "name"]);
  assert.equal(res.body.user.email, lower);
  assert.equal(res.body.user.name, "Ana");
  const payload = jwt.verify(res.body.token, JWT_SECRET) as jwt.JwtPayload;
  assert.equal(payload.userId, res.body.user.id);
});

test("login: 401 wrong password", async () => {
  const res = await api("POST", "/api/auth/login", { body: { email: lower, password: "wrong" } });
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "Invalid email or password" });
});

test("login: 401 unknown email (same message as wrong password)", async () => {
  const res = await api("POST", "/api/auth/login", {
    body: { email: "nobody@example.com", password: "secret123" },
  });
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: "Invalid email or password" });
});

test("login: 400 when fields missing", async () => {
  const res = await api("POST", "/api/auth/login", { body: { email: lower } });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Email and password are required" });
});
