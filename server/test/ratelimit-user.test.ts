// Per-user limiter (middlewares/userRateLimit). The limit is read from env at
// import time, so it must be lowered BEFORE helpers (and thus the app) load.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.USER_RATE_LIMIT_MAX = "5";
const { api, startServer, stopServer, createUser } = await import("./helpers.js");

before(async () => {
  await startServer();
});
after(async () => {
  await stopServer();
});

test("user limiter: 429 for user A after the limit, user B unaffected", async () => {
  const a = await createUser("A");
  const b = await createUser("B");

  for (let i = 1; i <= 5; i++) {
    const res = await api("GET", "/api/workouts", { token: a.token });
    assert.equal(res.status, 200, `request ${i}`);
    if (i === 1) {
      assert.ok(res.headers.get("ratelimit"), "standard RateLimit header");
      assert.ok(res.headers.get("ratelimit-policy"), "standard RateLimit-Policy header");
      assert.equal(res.headers.get("x-ratelimit-limit"), null, "no legacy headers");
    }
  }

  // The 6th request is blocked, on any protected router (shared bucket).
  for (const path of ["/api/workouts", "/api/meals", "/api/water"]) {
    const blocked = await api("GET", path, { token: a.token });
    assert.equal(blocked.status, 429, path);
    assert.deepEqual(blocked.body, { error: "Too many requests, please try again later" });
  }

  // Same IP, other user: own bucket.
  const other = await api("GET", "/api/workouts", { token: b.token });
  assert.equal(other.status, 200);
});

test("user limiter runs after authenticate: bad tokens get 401 and are not counted", async () => {
  for (let i = 0; i < 8; i++) {
    const res = await api("GET", "/api/workouts", { token: "garbage" });
    assert.equal(res.status, 401);
  }
  const c = await createUser("C");
  assert.equal((await api("GET", "/api/workouts", { token: c.token })).status, 200);
});
