import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer } from "./helpers.js";

before(async () => {
  await startServer();
});
after(async () => {
  await stopServer();
});

// routes/auth.ts: rateLimit({ windowMs: 15min, max: 10 }) shared by
// /register and /login (one limiter instance; failed and ok requests count).
const LIMIT = 10;

test("auth limiter: request after the 10th returns 429", async () => {
  for (let i = 1; i <= LIMIT; i++) {
    const res = await api("POST", "/api/auth/login", {
      body: { email: "nobody@example.com", password: "x" },
    });
    assert.equal(res.status, 401, `request ${i}`);
  }
  const blocked = await api("POST", "/api/auth/login", {
    body: { email: "nobody@example.com", password: "x" },
  });
  assert.equal(blocked.status, 429);
  assert.deepEqual(blocked.body, { error: "Too many attempts, please try again later" });

  // Same limiter instance is shared with /register.
  const reg = await api("POST", "/api/auth/register", {
    body: { email: "a@example.com", password: "x", name: "A" },
  });
  assert.equal(reg.status, 429);

  // Non-auth routes are not limited.
  const health = await api("GET", "/api/health");
  assert.equal(health.status, 200);
});
