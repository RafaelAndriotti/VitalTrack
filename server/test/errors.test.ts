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
  // Corrigido: o errorHandler mapeia entity.parse.failed para 400
  // (antes: 500 {"error":"Internal server error"}).
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Invalid JSON body" });
  // Nothing created
  const list = await api("GET", "/api/workouts", { token: u.token });
  assert.deepEqual(list.body, []);
});

test("body larger than 100kb -> current status/body", async () => {
  const big = JSON.stringify({ name: "x", notes: "a".repeat(101 * 1024) });
  const res = await api("POST", "/api/workouts", { token: u.token, raw: big });
  // Corrigido: o errorHandler mapeia entity.too.large para 413
  // (antes: 500 {"error":"Internal server error"}).
  assert.equal(res.status, 413);
  assert.deepEqual(res.body, { error: "Payload too large" });
  const list = await api("GET", "/api/workouts", { token: u.token });
  assert.deepEqual(list.body, []);
});

test("body just under 100kb is accepted", async () => {
  // The filler is an unknown field (stripped by validation), since notes is
  // capped at 10k chars; it still counts toward the body size.
  const ok = JSON.stringify({ name: "x", filler: "a".repeat(90 * 1024) });
  assert.ok(ok.length < 100 * 1024);
  const res = await api("POST", "/api/workouts", { token: u.token, raw: ok });
  assert.equal(res.status, 201);
  assert.equal(res.body.filler, undefined);
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
