// Error-handler mapping for body-parser errors and JWT payload/algorithm checks.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { api, baseUrl, startServer, stopServer, createUser, JWT_SECRET, type TestUser } from "./helpers.js";

let u: TestUser;

before(async () => {
  await startServer();
  u = await createUser();
});
after(async () => {
  await stopServer();
});

// ---------- errorHandler ----------

test("unsupported charset -> 415 with fixed message (err.message not echoed)", async () => {
  // Raw fetch: the api() helper always forces Content-Type: application/json.
  const res = await fetch(`${baseUrl}/api/workouts`, {
    method: "POST",
    headers: { Authorization: `Bearer ${u.token}`, "Content-Type": "application/json; charset=nope-1" },
    body: '{"name":"x"}',
  });
  const text = await res.text();
  assert.equal(res.status, 415);
  assert.deepEqual(JSON.parse(text), { error: "Unsupported media type" });
  assert.ok(!text.includes("nope-1"));
});

test("unsupported content-encoding -> 415 with fixed message", async () => {
  const res = await api("POST", "/api/workouts", {
    token: u.token,
    raw: '{"name":"x"}',
    headers: { "Content-Encoding": "foo" },
  });
  assert.equal(res.status, 415);
  assert.deepEqual(res.body, { error: "Unsupported media type" });
  assert.ok(!res.text.includes("foo"));
});

// ---------- authenticate ----------

const asBearer = (t: string) => ({ Authorization: `Bearer ${t}` });

async function status(token: string) {
  return (await api("GET", "/api/workouts", { headers: asBearer(token) })).status;
}

test("valid signature but payload without a usable userId -> 401", async () => {
  const invalid = { error: "Invalid or expired token" };
  const payloads = [{}, { userId: 123 }, { userId: "" }, { userId: null }, { userId: { a: 1 } }, { sub: u.id }];
  for (const payload of payloads) {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    const res = await api("GET", "/api/workouts", { headers: asBearer(token) });
    assert.equal(res.status, 401, JSON.stringify(payload));
    assert.deepEqual(res.body, invalid);
  }
  // Non-object payload (string) is rejected as well.
  assert.equal(await status(jwt.sign("just-a-string", JWT_SECRET)), 401);
  // Control: a proper token still works.
  assert.equal(await status(jwt.sign({ userId: u.id }, JWT_SECRET)), 200);
});

test("token signed with another HMAC algorithm (HS512) -> 401", async () => {
  const token = jwt.sign({ userId: u.id }, JWT_SECRET, { algorithm: "HS512" });
  assert.equal(await status(token), 401);
});

test("unsigned (alg none) token -> 401", async () => {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const token = `${b64({ alg: "none", typ: "JWT" })}.${b64({ userId: u.id })}.`;
  assert.equal(await status(token), 401);
});
