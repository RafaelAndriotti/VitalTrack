// Extra characterization tests: real JSON key order (no .sort()), values sent
// as strings, repeated query params, and the 500 log label. They lock the
// CURRENT behavior; anything marked "BUG conhecido" is intentionally not fixed.
// Auth rate limit is 10 req/15min per process: only 3 auth calls here.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  startServer,
  stopServer,
  createUser,
  type TestUser,
} from "./helpers.js";

let u: TestUser;

before(async () => {
  await startServer();
  u = await createUser("Extra");
});
after(async () => {
  await stopServer();
});

const keys = (o: unknown) => Object.keys(o as object);

const USER_KEYS = ["id", "email", "name", "created_at"];
const WORKOUT_KEYS = [
  "id", "user_id", "name", "date", "completed", "notes", "muscle_groups",
  "created_at", "updated_at", "exercises",
];
const EXERCISE_KEYS = ["id", "workout_id", "name", "notes", "created_at", "updated_at"];
const SET_KEYS = [
  "id", "exercise_id", "weight", "reps", "completed", "order_index",
  "created_at", "updated_at",
];
const MEAL_KEYS = ["id", "user_id", "name", "date", "time", "created_at", "updated_at", "meal_items"];
const MEAL_ITEM_KEYS = [
  "id", "meal_id", "name", "amount", "calories", "protein", "carbs", "fat",
  "created_at", "updated_at",
];
const WATER_ROW_KEYS = ["id", "user_id", "date", "amount_ml", "goal_ml", "created_at", "updated_at"];
const WATER_DEFAULT_KEYS = ["user_id", "date", "amount_ml", "goal_ml"];
const FOOD_KEYS = [
  "id", "user_id", "name", "calories", "protein", "carbs", "fat",
  "serving_size", "created_at", "updated_at",
];
const EXERCISE_LIB_KEYS = ["id", "user_id", "name", "muscle_group", "created_at", "updated_at"];

test("key order: user (register and login)", async () => {
  const reg = await api("POST", "/api/auth/register", {
    body: { email: "order@example.com", password: "secret123", name: "Order" },
  });
  assert.equal(reg.status, 201);
  assert.deepEqual(keys(reg.body), ["token", "user"]);
  assert.deepEqual(keys(reg.body.user), USER_KEYS);

  const login = await api("POST", "/api/auth/login", {
    body: { email: "order@example.com", password: "secret123" },
  });
  assert.equal(login.status, 200);
  assert.deepEqual(keys(login.body), ["token", "user"]);
  assert.deepEqual(keys(login.body.user), USER_KEYS);
});

test("key order: workout, exercise, set", async () => {
  const w = await api("POST", "/api/workouts", { token: u.token, body: { name: "W" } });
  assert.equal(w.status, 201);
  assert.deepEqual(keys(w.body), WORKOUT_KEYS);

  const e = await api("POST", `/api/workouts/${w.body.id}/exercises`, {
    token: u.token,
    body: { name: "E" },
  });
  assert.equal(e.status, 201);
  assert.deepEqual(keys(e.body), [...EXERCISE_KEYS, "exercise_sets"]);

  const s = await api("POST", `/api/workouts/${w.body.id}/exercises/${e.body.id}/sets`, {
    token: u.token,
    body: { weight: 10, reps: 5 },
  });
  assert.equal(s.status, 201);
  assert.deepEqual(keys(s.body), SET_KEYS);

  const upd = await api("PUT", `/api/workouts/${w.body.id}/exercises/${e.body.id}`, {
    token: u.token,
    body: { name: "E2" },
  });
  assert.equal(upd.status, 200);
  assert.deepEqual(keys(upd.body), EXERCISE_KEYS); // no exercise_sets on update

  const list = await api("GET", "/api/workouts", { token: u.token });
  const wk = list.body.find((x: any) => x.id === w.body.id);
  assert.deepEqual(keys(wk), WORKOUT_KEYS);
  assert.deepEqual(keys(wk.exercises[0]), [...EXERCISE_KEYS, "exercise_sets"]);
  assert.deepEqual(keys(wk.exercises[0].exercise_sets[0]), SET_KEYS);
});

test("key order: meal, meal item, food library, exercise library", async () => {
  const m = await api("POST", "/api/meals", { token: u.token, body: { name: "M" } });
  assert.equal(m.status, 201);
  assert.deepEqual(keys(m.body), MEAL_KEYS);

  const i = await api("POST", `/api/meals/${m.body.id}/items`, {
    token: u.token,
    body: { name: "I" },
  });
  assert.equal(i.status, 201);
  assert.deepEqual(keys(i.body), MEAL_ITEM_KEYS);

  const list = await api("GET", "/api/meals", { token: u.token });
  assert.deepEqual(keys(list.body[0]), MEAL_KEYS);
  assert.deepEqual(keys(list.body[0].meal_items[0]), MEAL_ITEM_KEYS);

  const food = await api("POST", "/api/meals/library/foods", {
    token: u.token,
    body: { name: "F" },
  });
  assert.equal(food.status, 201);
  assert.deepEqual(keys(food.body), FOOD_KEYS);
  const foods = await api("GET", "/api/meals/library/foods", { token: u.token });
  assert.deepEqual(keys(foods.body[0]), FOOD_KEYS);

  const ex = await api("POST", "/api/workouts/library/exercises", {
    token: u.token,
    body: { name: "X" },
  });
  assert.equal(ex.status, 201);
  assert.deepEqual(keys(ex.body), EXERCISE_LIB_KEYS);
  const exs = await api("GET", "/api/workouts/library/exercises", { token: u.token });
  assert.deepEqual(keys(exs.body[0]), EXERCISE_LIB_KEYS);
});

test("key order: water (record and default)", async () => {
  const rec = await api("POST", "/api/water", {
    token: u.token,
    body: { date: "2031-01-01", amount_ml: 100 },
  });
  assert.equal(rec.status, 200);
  assert.deepEqual(keys(rec.body), WATER_ROW_KEYS);
  const get = await api("GET", "/api/water?date=2031-01-01", { token: u.token });
  assert.deepEqual(keys(get.body), WATER_ROW_KEYS);

  const def = await api("GET", "/api/water?date=2031-05-05", { token: u.token });
  assert.equal(def.status, 200);
  assert.deepEqual(keys(def.body), WATER_DEFAULT_KEYS);
});

test("numbers sent as strings: SQLite column affinity coerces them", async () => {
  const w = await api("POST", "/api/workouts", { token: u.token, body: { name: "S" } });
  const e = await api("POST", `/api/workouts/${w.body.id}/exercises`, {
    token: u.token,
    body: { name: "E" },
  });
  const base = `/api/workouts/${w.body.id}/exercises/${e.body.id}/sets`;

  const s = await api("POST", base, {
    token: u.token,
    body: { weight: "5", reps: "3", order_index: "2" },
  });
  assert.equal(s.status, 201);
  assert.equal(s.body.weight, 5);
  assert.equal(s.body.reps, 3);
  assert.equal(s.body.order_index, 2);

  const upd = await api("PUT", `${base}/${s.body.id}`, { token: u.token, body: { weight: "7" } });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.weight, 7);

  const m = await api("POST", "/api/meals", { token: u.token, body: { name: "M" } });
  const item = await api("POST", `/api/meals/${m.body.id}/items`, {
    token: u.token,
    body: { name: "I", calories: "100", amount: "50" },
  });
  assert.equal(item.status, 201);
  assert.equal(item.body.calories, 100);
  assert.equal(item.body.amount, 50);

  const upItem = await api("PUT", `/api/meals/${m.body.id}/items/${item.body.id}`, {
    token: u.token,
    body: { calories: "200" },
  });
  assert.equal(upItem.body.calories, 200);

  // Water validates with typeof, so strings are rejected (unlike the above).
  const water = await api("POST", "/api/water", { token: u.token, body: { amount_ml: "100" } });
  assert.equal(water.status, 400);
  assert.deepEqual(water.body, { error: "amount_ml must be a non-negative number" });
});

test("completed as the string \"false\" is truthy -> stored as true", async () => {
  // BUG conhecido: a string "false" e truthy, entao completed vira true.
  const w = await api("POST", "/api/workouts", {
    token: u.token,
    body: { name: "C", completed: "false" },
  });
  assert.equal(w.status, 201);
  assert.equal(w.body.completed, true);

  const w2 = await api("POST", "/api/workouts", { token: u.token, body: { name: "C2" } });
  assert.equal(w2.body.completed, false);
  const up = await api("PUT", `/api/workouts/${w2.body.id}`, {
    token: u.token,
    body: { completed: "false" },
  });
  assert.equal(up.status, 200);
  assert.equal(up.body.completed, true); // BUG conhecido

  const e = await api("POST", `/api/workouts/${w2.body.id}/exercises`, {
    token: u.token,
    body: { name: "E" },
  });
  const base = `/api/workouts/${w2.body.id}/exercises/${e.body.id}/sets`;
  const s = await api("POST", base, { token: u.token, body: { completed: "false" } });
  assert.equal(s.body.completed, true); // BUG conhecido
  const s2 = await api("POST", base, { token: u.token, body: {} });
  assert.equal(s2.body.completed, false);
  const su = await api("PUT", `${base}/${s2.body.id}`, {
    token: u.token,
    body: { completed: "false" },
  });
  assert.equal(su.body.completed, true); // BUG conhecido
});

test("repeated ?date=a&date=b", async () => {
  // BUG conhecido: query vira array; GET /api/water passa o array ao SQLite
  // ("Too many parameter values") e responde 500.
  const water = await api("GET", "/api/water?date=a&date=b", { token: u.token });
  assert.equal(water.status, 500);
  assert.deepEqual(water.body, { error: "Failed to fetch daily water" });

  // Meals ignora o filtro quando date nao e string: lista tudo, status 200.
  const meals = await api("GET", "/api/meals?date=a&date=b", { token: u.token });
  assert.equal(meals.status, 200);
  const all = await api("GET", "/api/meals", { token: u.token });
  assert.deepEqual(meals.body, all.body);
});

test("500 logs console.error with the handler label", async (t) => {
  const { generateToken } = await import("../src/libs/token.js");
  const spy = t.mock.method(console, "error", () => {});

  // Valid token for a user that does not exist -> FOREIGN KEY failure on insert.
  const res = await api("POST", "/api/workouts", {
    token: generateToken("ghost-user"),
    body: { name: "W" },
  });
  assert.equal(res.status, 500);
  assert.deepEqual(res.body, { error: "Failed to create workout" });

  const calls = spy.mock.calls.map((c) => c.arguments);
  const created = calls.filter((c) => c[0] === "Create workout error:");
  assert.equal(created.length, 1);
  assert.equal(created[0][1], "FOREIGN KEY constraint failed");
});
