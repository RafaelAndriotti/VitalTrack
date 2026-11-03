import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer } from "./helpers.js";

// Separate file: the auth limiter is in-memory per process, so it needs its
// own server process to start with a clean counter.
const logged: string[] = [];
const origError = console.error;
const origWarn = console.warn;

before(async () => {
  // express-rate-limit reports misconfiguration (ERR_ERL_*) via console.
  console.error = (...a: unknown[]) => void logged.push(a.join(" "));
  console.warn = (...a: unknown[]) => void logged.push(a.join(" "));
  await startServer();
});
after(async () => {
  console.error = origError;
  console.warn = origWarn;
  await stopServer();
});

const login = (ip: string) =>
  api("POST", "/api/auth/login", {
    headers: { "X-Forwarded-For": ip },
    body: { email: "nobody@example.com", password: "x" },
  });

test("trust proxy: limiter buckets by X-Forwarded-For client IP", async () => {
  for (let i = 1; i <= 10; i++) {
    const res = await login("203.0.113.1");
    assert.equal(res.status, 401, `request ${i}`);
  }
  const blocked = await login("203.0.113.1");
  assert.equal(blocked.status, 429);

  // A different client IP behind the same proxy is not affected.
  const other = await login("203.0.113.2");
  assert.notEqual(other.status, 429);
  assert.equal(other.status, 401);

  const erl = logged.filter((l) => l.includes("ERR_ERL_"));
  assert.deepEqual(erl, []);
});
