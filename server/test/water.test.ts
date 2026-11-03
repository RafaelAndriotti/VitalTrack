import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let u: TestUser;
const today = () => new Date().toISOString().split("T")[0];

before(async () => {
  await startServer();
});
after(async () => {
  await stopServer();
});

const ROW_KEYS = ["amount_ml", "created_at", "date", "goal_ml", "id", "updated_at", "user_id"];

test("water: GET without record returns default (no id, no persistence)", async () => {
  u = await createUser();
  const res = await api("GET", "/api/water?date=2030-01-01", { token: u.token });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { user_id: u.id, date: "2030-01-01", amount_ml: 0, goal_ml: 2000 });

  // No ?date -> today
  const t = await api("GET", "/api/water", { token: u.token });
  assert.deepEqual(t.body, { user_id: u.id, date: today(), amount_ml: 0, goal_ml: 2000 });

  // Default read did not create a row
  const { db } = await import("../src/config/db.js");
  assert.equal((db.prepare("SELECT COUNT(*) c FROM daily_water WHERE user_id = ?").get(u.id) as any).c, 0);
});

test("water: POST upsert creates, then updates partially", async () => {
  const w = await createUser("Water");
  const date = "2030-02-02";

  const c = await api("POST", "/api/water", { token: w.token, body: { date, amount_ml: 250 } });
  assert.equal(c.status, 200); // upsert returns 200 even on create
  assert.deepEqual(Object.keys(c.body).sort(), ROW_KEYS);
  assert.equal(c.body.user_id, w.id);
  assert.equal(c.body.date, date);
  assert.equal(c.body.amount_ml, 250);
  assert.equal(c.body.goal_ml, 2000);
  const rowId = c.body.id;

  const g = await api("GET", `/api/water?date=${date}`, { token: w.token });
  assert.deepEqual(g.body, c.body);

  // goal only: amount preserved
  const u1 = await api("POST", "/api/water", { token: w.token, body: { date, goal_ml: 3000 } });
  assert.equal(u1.body.id, rowId);
  assert.equal(u1.body.amount_ml, 250);
  assert.equal(u1.body.goal_ml, 3000);

  // amount only: goal preserved
  const u2 = await api("POST", "/api/water", { token: w.token, body: { date, amount_ml: 700 } });
  assert.equal(u2.body.id, rowId);
  assert.equal(u2.body.amount_ml, 700);
  assert.equal(u2.body.goal_ml, 3000);

  // amount_ml is absolute (not additive); 0 is honored
  const u3 = await api("POST", "/api/water", { token: w.token, body: { date, amount_ml: 0 } });
  assert.equal(u3.body.amount_ml, 0);
  assert.equal(u3.body.goal_ml, 3000);

  // empty body: no change
  const u4 = await api("POST", "/api/water", { token: w.token, body: { date } });
  assert.equal(u4.status, 200);
  assert.equal(u4.body.goal_ml, 3000);

  const { db } = await import("../src/config/db.js");
  assert.equal((db.prepare("SELECT COUNT(*) c FROM daily_water WHERE user_id = ? AND date = ?").get(w.id, date) as any).c, 1);
});

test("water: POST without date uses today; empty body creates defaults", async () => {
  const w = await createUser("Water Today");
  const r = await api("POST", "/api/water", { token: w.token, body: {} });
  assert.equal(r.status, 200);
  assert.equal(r.body.date, today());
  assert.equal(r.body.amount_ml, 0);
  assert.equal(r.body.goal_ml, 2000);
  const g = await api("GET", "/api/water", { token: w.token });
  assert.deepEqual(g.body, r.body);
});

test("water: GET default for a new day reuses goal of latest-dated record", async () => {
  const w = await createUser("Water Goal");
  await api("POST", "/api/water", { token: w.token, body: { date: "2030-03-01", goal_ml: 3000 } });
  const d1 = await api("GET", "/api/water?date=2030-03-02", { token: w.token });
  assert.deepEqual(d1.body, { user_id: w.id, date: "2030-03-02", amount_ml: 0, goal_ml: 3000 });

  // "last" means highest date, not most recently written, and may be after the requested date
  await api("POST", "/api/water", { token: w.token, body: { date: "2030-05-01", goal_ml: 2500 } });
  await api("POST", "/api/water", { token: w.token, body: { date: "2030-01-01", goal_ml: 4000 } });
  const d2 = await api("GET", "/api/water?date=2030-03-02", { token: w.token });
  assert.equal(d2.body.goal_ml, 2500);

  // BUG conhecido: POST de um dia novo sem goal_ml cria com 2000, nao com a ultima meta (GET default usa a ultima).
  const created = await api("POST", "/api/water", { token: w.token, body: { date: "2030-06-01", amount_ml: 100 } });
  assert.equal(created.body.goal_ml, 2000);
});

test("water: POST validations", async () => {
  const w = await createUser("Water Val");
  const date = "2030-04-04";
  const goalMsg = { error: "goal_ml must be a positive number" };
  const amountMsg = { error: "amount_ml must be a non-negative number" };
  for (const goal_ml of [0, -5, "2000", null, true]) {
    const r = await api("POST", "/api/water", { token: w.token, body: { date, goal_ml } });
    assert.equal(r.status, 400, `goal_ml=${JSON.stringify(goal_ml)}`);
    assert.deepEqual(r.body, goalMsg);
  }
  for (const amount_ml of [-1, "100", null, false]) {
    const r = await api("POST", "/api/water", { token: w.token, body: { date, amount_ml } });
    assert.equal(r.status, 400, `amount_ml=${JSON.stringify(amount_ml)}`);
    assert.deepEqual(r.body, amountMsg);
  }
  // goal is checked before amount
  const both = await api("POST", "/api/water", { token: w.token, body: { date, goal_ml: 0, amount_ml: -1 } });
  assert.deepEqual(both.body, goalMsg);

  // Nothing was persisted by the rejected calls
  const g = await api("GET", `/api/water?date=${date}`, { token: w.token });
  assert.equal(g.body.id, undefined);
  assert.equal(g.body.amount_ml, 0);
});

test("water: isolated per user", async () => {
  const a = await createUser("WA");
  const b = await createUser("WB");
  await api("POST", "/api/water", { token: a.token, body: { date: "2030-07-07", amount_ml: 900, goal_ml: 3500 } });
  const gb = await api("GET", "/api/water?date=2030-07-07", { token: b.token });
  assert.deepEqual(gb.body, { user_id: b.id, date: "2030-07-07", amount_ml: 0, goal_ml: 2000 });
  const ga = await api("GET", "/api/water?date=2030-07-07", { token: a.token });
  assert.equal(ga.body.amount_ml, 900);
});
