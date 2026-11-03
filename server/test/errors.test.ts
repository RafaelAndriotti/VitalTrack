import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let u: TestUser;

before(async () => {
  await startServer();
  u = await createUser();
});
after(async () => {
  await stopServer();
});

// Auth endpoints are rate limited, so these use a protected route. The JSON
// body parser runs before authentication, but a valid token is sent anyway.

test("malformed JSON body -> current status/body", async () => {
  const res = await api("POST", "/api/workouts", { token: u.token, raw: '{"name": "x"' });
  // BUG conhecido: body-parser gera erro 400, mas o errorHandler central
  // transforma qualquer erro em 500 {"error":"Internal server error"}.
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: "Internal server error" });
  // Nothing created
  const list = await api("GET", "/api/workouts", { token: u.token });
  assert.deepEqual(list.body, []);
});

test("body larger than 100kb -> current status/body", async () => {
  const big = JSON.stringify({ name: "x", notes: "a".repeat(101 * 1024) });
  const res = await api("POST", "/api/workouts", { token: u.token, raw: big });
  // BUG conhecido: 413 do body-parser vira 500 pelo errorHandler central.
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: "Internal server error" });
  const list = await api("GET", "/api/workouts", { token: u.token });
  assert.deepEqual(list.body, []);
});

test("body just under 100kb is accepted", async () => {
  const ok = JSON.stringify({ name: "x", notes: "a".repeat(90 * 1024) });
  const res = await api("POST", "/api/workouts", { token: u.token, raw: ok });
  assert.equal(res.status, 201);
  assert.equal(res.body.notes.length, 90 * 1024);
});

test("unknown route -> express default 404 (HTML, not JSON)", async () => {
  const res = await api("GET", "/api/nope");
  assert.equal(res.status, 404);
  assert.equal(res.body, undefined);
});

test("security headers (helmet) and CORS are present", async () => {
  const res = await api("GET", "/api/health", { headers: { Origin: "http://example.com" } });
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(res.headers.get("access-control-allow-origin"), "*");
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("valid token for a user that does not exist -> current behavior", async () => {
  const { generateToken } = await import("../src/libs/token.js");
  const ghost = generateToken("00000000-0000-0000-0000-00000000dead");
  // Read paths: empty results (token only carries userId, no user lookup).
  const list = await api("GET", "/api/workouts", { token: ghost });
  assert.equal(list.status, 200);
  assert.deepEqual(list.body, []);
  // BUG conhecido: sem lookup do usuario; insert viola FK e cai no catch -> 500.
  const create = await api("POST", "/api/workouts", { token: ghost, body: { name: "x" } });
  assert.equal(create.status, 500);
  assert.deepEqual(create.body, { error: "Failed to create workout" });
});
