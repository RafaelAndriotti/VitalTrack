// Input validation (zod): payloads the app really sends must pass, invalid
// ones must give 400 { error }. Auth endpoints are rate limited to 10 req per
// process, so only a few auth calls are made here; everything else uses
// createUser() (direct DB insert).
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let u: TestUser;

before(async () => {
  await startServer();
  u = await createUser();
});
after(async () => {
  await stopServer();
});

const DATE_MSG = "date must be a valid date in YYYY-MM-DD format";

async function bad(method: string, path: string, body: unknown, error: string) {
  const res = await api(method, path, { token: u.token, body });
  assert.equal(res.status, 400, `${method} ${path} ${JSON.stringify(body)} -> ${res.text}`);
  assert.deepEqual(res.body, { error });
}

async function mkWorkout(body: unknown = { name: "W" }) {
  const res = await api("POST", "/api/workouts", { token: u.token, body });
  assert.equal(res.status, 201, res.text);
  return res.body;
}

async function mkSet(extra: unknown = {}) {
  const w = await mkWorkout();
  const e = await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: { name: "E" } });
  const base = `/api/workouts/${w.id}/exercises/${e.body.id}`;
  const s = await api("POST", `${base}/sets`, { token: u.token, body: extra });
  assert.equal(s.status, 201, s.text);
  return { base, w, e: e.body, s: s.body };
}

async function mkMeal(body: unknown = { name: "M" }) {
  const res = await api("POST", "/api/meals", { token: u.token, body });
  assert.equal(res.status, 201, res.text);
  return res.body;
}

// ---------- auth (only 3 calls against the rate limiter) ----------

test("auth: register/login type, format and size checks", async () => {
  const email = `v-${randomUUID()}@example.com`;
  const post = (p: string, body: unknown) => api("POST", `/api/auth/${p}`, { body });

  // Invalid email format and oversize name are 400; a short password is NOT rejected (no policy yet).
  const badEmail = await post("register", { email: "not-an-email", password: "x", name: "N" });
  assert.equal(badEmail.status, 400);
  assert.deepEqual(badEmail.body, { error: "Invalid email format" });

  const longName = await post("register", { email, password: "x", name: "n".repeat(101) });
  assert.equal(longName.status, 400);
  assert.deepEqual(longName.body, { error: "Name must be at most 100 characters" });

  // Non-string values are 400 with the "required" message; unknown keys are ignored.
  const wrongType = await post("login", { email: 123, password: ["x"] });
  assert.equal(wrongType.status, 400);
  assert.deepEqual(wrongType.body, { error: "Email and password are required" });

  const ok = await post("register", { email, password: "a", name: "N", role: "admin" });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.user.email, email);
  assert.equal(ok.body.user.role, undefined);
});

// ---------- IDs ----------

test("ids: uuid and 32-hex (seed) ids are accepted, junk is 400", async () => {
  const hex = "0123456789abcdef0123456789abcdef";
  for (const id of [randomUUID(), hex]) {
    const res = await api("PUT", `/api/workouts/${id}`, { token: u.token, body: { name: "x" } });
    assert.equal(res.status, 404, res.text); // passed validation, just not found
  }
  const junk = await api("DELETE", "/api/workouts/a%20b", { token: u.token });
  assert.equal(junk.status, 400);
  assert.deepEqual(junk.body, { error: "Invalid id" });
  const tooLong = await api("DELETE", `/api/meals/${"a".repeat(65)}`, { token: u.token });
  assert.equal(tooLong.status, 400);
  const nested = await api("DELETE", "/api/workouts/abc/exercises/abc/sets/a.b", { token: u.token });
  assert.equal(nested.status, 400);
  assert.deepEqual(nested.body, { error: "Invalid setId" });
  // Global library seeds use 32-hex ids: deleting one is still a clean 404 (not 400).
  const lib = await api("GET", "/api/workouts/library/exercises", { token: u.token });
  const seed = lib.body.find((e: any) => e.user_id === null);
  assert.match(seed.id, /^[0-9a-f]{32}$/);
  const del = await api("DELETE", `/api/workouts/library/exercises/${seed.id}`, { token: u.token });
  assert.equal(del.status, 404);
});

// ---------- workouts ----------

test("workouts: payloads sent by the app are accepted", async () => {
  const w = await mkWorkout({
    name: "Treino A",
    completed: false,
    muscle_groups: ["Peito", "Tríceps"],
  });
  assert.equal(w.completed, false);
  const full = await mkWorkout({ name: "B", date: "2031-02-28", notes: "n", muscle_groups: "Peito,Costas" });
  assert.equal(full.date, "2031-02-28");
  const up1 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { completed: true } });
  assert.equal(up1.status, 200);
  assert.equal(up1.body.completed, true);
  const up2 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { name: "Renomeado" } });
  assert.equal(up2.status, 200);
  // Unknown fields are stripped, not rejected.
  const extra = await api("POST", "/api/workouts", { token: u.token, body: { name: "X", user_id: "evil", id: "1" } });
  assert.equal(extra.status, 201);
  assert.equal(extra.body.user_id, u.id);
  assert.notEqual(extra.body.id, "1");
});

test("workouts: invalid bodies give 400 with a message", async () => {
  await bad("POST", "/api/workouts", {}, "Workout name is required");
  await bad("POST", "/api/workouts", { name: "" }, "Workout name is required");
  await bad("POST", "/api/workouts", { name: 5 }, "Workout name is required");
  await bad("POST", "/api/workouts", { name: "n".repeat(101) }, "Workout name must be at most 100 characters");
  await bad("POST", "/api/workouts", { name: "x", date: "2031-13-01" }, DATE_MSG);
  await bad("POST", "/api/workouts", { name: "x", date: "2031-02-30" }, DATE_MSG);
  await bad("POST", "/api/workouts", { name: "x", date: "01/02/2031" }, DATE_MSG);
  await bad("POST", "/api/workouts", { name: "x", date: "" }, DATE_MSG);
  await bad("POST", "/api/workouts", { name: "x", completed: "false" }, "completed must be a boolean");
  await bad("POST", "/api/workouts", { name: "x", completed: 1 }, "completed must be a boolean");
  await bad("POST", "/api/workouts", { name: "x", notes: 7 }, "notes must be a string");
  await bad("POST", "/api/workouts", { name: "x", muscle_groups: [1] }, "muscle_groups must be an array of strings or a string");
  await bad("POST", "/api/workouts", { name: "x", muscle_groups: [""] }, "muscle_groups items must not be empty");
  await bad("POST", "/api/workouts", { name: "x", muscle_groups: ["a".repeat(51)] }, "muscle_groups items must be at most 50 characters");
  await bad(
    "POST",
    "/api/workouts",
    { name: "x", muscle_groups: Array.from({ length: 21 }, () => "g") },
    "muscle_groups must have at most 20 items"
  );
  await bad("POST", "/api/workouts", { name: "x", muscle_groups: 5 }, "muscle_groups must be an array of strings or a string");
  await bad("POST", "/api/workouts", { name: "x", muscle_groups: { a: 1 } }, "muscle_groups must be an array of strings or a string");
  await bad("POST", "/api/workouts", [], "Request body must be a JSON object");

  // 20 groups is the limit and passes.
  await mkWorkout({ name: "x", muscle_groups: Array.from({ length: 20 }, () => "g") });

  const w = await mkWorkout({ name: "Keep" });
  await bad("PUT", `/api/workouts/${w.id}`, { name: "" }, "Workout name is required");
  await bad("PUT", `/api/workouts/${w.id}`, { completed: "false" }, "completed must be a boolean");
  await bad("PUT", `/api/workouts/${w.id}`, { date: "nope" }, DATE_MSG);
  const after = await api("GET", "/api/workouts", { token: u.token });
  assert.equal(after.body.find((x: any) => x.id === w.id).name, "Keep");
});

test("exercises and exercise library: validation", async () => {
  const w = await mkWorkout();
  await bad("POST", `/api/workouts/${w.id}/exercises`, {}, "Exercise name is required");
  await bad("POST", `/api/workouts/${w.id}/exercises`, { name: "" }, "Exercise name is required");
  await bad("POST", `/api/workouts/${w.id}/exercises`, { name: "x", notes: 1 }, "notes must be a string");
  const ex = await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: { name: "Supino" } });
  assert.equal(ex.status, 201);
  await bad("PUT", `/api/workouts/${w.id}/exercises/${ex.body.id}`, { name: "" }, "Exercise name is required");
  const ok = await api("PUT", `/api/workouts/${w.id}/exercises/${ex.body.id}`, {
    token: u.token,
    body: { name: "Supino reto" },
  });
  assert.equal(ok.status, 200);

  await bad("POST", "/api/workouts/library/exercises", {}, "Exercise name is required");
  await bad("POST", "/api/workouts/library/exercises", { name: "x", muscle_group: "g".repeat(51) }, "muscle_group must be at most 50 characters");
  await bad("POST", "/api/workouts/library/exercises", { name: "x", muscle_group: 3 }, "muscle_group must be a string");
  const lib = await api("POST", "/api/workouts/library/exercises", {
    token: u.token,
    body: { name: "Custom", muscle_group: "Peito" },
  });
  assert.equal(lib.status, 201);
});

test("sets: numbers, integers and booleans", async () => {
  // Exactly what the app sends.
  const { base, s } = await mkSet({ weight: 0, reps: 0, completed: false, order_index: 1 });
  for (const fields of [{ weight: 82.5 }, { reps: 8 }, { reps: 8.5 }, { reps: 0.5 }, { completed: true }, { weight: 10, reps: 0 }]) {
    const res = await api("PUT", `${base}/sets/${s.id}`, { token: u.token, body: fields });
    assert.equal(res.status, 200, JSON.stringify(fields));
  }
  // Extra fields from a Partial<ExerciseSet> (id, exercise_id) are ignored.
  const withIds = await api("PUT", `${base}/sets/${s.id}`, {
    token: u.token,
    body: { id: "other", exercise_id: "other", reps: 5 },
  });
  assert.equal(withIds.status, 200);
  assert.equal(withIds.body.id, s.id);

  const sets = `${base}/sets`;
  await bad("POST", sets, { weight: "5" }, "weight must be a number");
  await bad("POST", sets, { weight: -1 }, "weight must be greater than or equal to 0");
  const dec = await api("POST", sets, { token: u.token, body: { reps: 8.5 } });
  assert.equal(dec.status, 201);
  assert.equal(dec.body.reps, 8.5);
  await bad("POST", sets, { reps: -1 }, "reps must be greater than or equal to 0");
  await bad("POST", sets, { reps: "3" }, "reps must be a number");
  await bad("POST", sets, { order_index: -1 }, "order_index must be greater than or equal to 0");
  await bad("POST", sets, { order_index: 0.5 }, "order_index must be an integer");
  await bad("POST", sets, { completed: "true" }, "completed must be a boolean");
  await bad("PUT", `${sets}/${s.id}`, { weight: "7" }, "weight must be a number");
  await bad("PUT", `${sets}/${s.id}`, { weight: -0.5 }, "weight must be greater than or equal to 0");
  await bad("PUT", `${sets}/${s.id}`, { reps: -2.5 }, "reps must be greater than or equal to 0");
  await bad("PUT", `${sets}/${s.id}`, { reps: "8" }, "reps must be a number");
  await bad("PUT", `${sets}/${s.id}`, { order_index: 0.5 }, "order_index must be an integer");
  await bad("PUT", `${sets}/${s.id}`, { completed: "false" }, "completed must be a boolean");
});

// ---------- meals ----------

test("meals: payloads sent by the app are accepted (time is free text)", async () => {
  for (const time of ["08:00", "8h", "Café da manhã", undefined]) {
    const m = await mkMeal({ name: "Refeição", date: "2031-03-01", time });
    assert.equal(m.time, time ?? null);
  }
  const m = await mkMeal({ name: "Sem data" });
  const up = await api("PUT", `/api/meals/${m.id}`, { token: u.token, body: { name: "Almoço", time: "12:30" } });
  assert.equal(up.status, 200);
  const list = await api("GET", "/api/meals?date=2031-03-01", { token: u.token });
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 4);
  // Empty ?date= still means "no filter".
  const all = await api("GET", "/api/meals?date=", { token: u.token });
  assert.equal(all.status, 200);
});

test("meals: invalid bodies and queries give 400", async () => {
  await bad("POST", "/api/meals", {}, "Meal name is required");
  await bad("POST", "/api/meals", { name: "" }, "Meal name is required");
  await bad("POST", "/api/meals", { name: "x", date: "2031-1-1" }, DATE_MSG);
  await bad("POST", "/api/meals", { name: "x", time: 800 }, "time must be a string");
  await bad("POST", "/api/meals", { name: "x", time: "t".repeat(51) }, "time must be at most 50 characters");
  const m = await mkMeal();
  await bad("PUT", `/api/meals/${m.id}`, { name: "" }, "Meal name is required");
  await bad("PUT", `/api/meals/${m.id}`, { date: "x" }, DATE_MSG);

  for (const q of ["?date=abc", "?date=2031-02-30", "?date=a&date=b", "?date=2031-01-01&date=2031-01-02"]) {
    const res = await api("GET", `/api/meals${q}`, { token: u.token });
    assert.equal(res.status, 400, q);
    assert.deepEqual(res.body, { error: DATE_MSG });
  }
});

test("meal items and food library: numbers", async () => {
  const m = await mkMeal();
  const items = `/api/meals/${m.id}/items`;
  // As sent by the app: Math.round'ed numbers, zeros allowed except amount.
  const ok = await api("POST", items, {
    token: u.token,
    body: { name: "Arroz", amount: 150.5, calories: 195, protein: 4, carbs: 42, fat: 0 },
  });
  assert.equal(ok.status, 201);

  await bad("POST", items, { name: "x", amount: 0 }, "amount must be greater than 0");
  await bad("POST", items, { name: "x", amount: -5 }, "amount must be greater than 0");
  await bad("POST", items, { name: "x", amount: "100" }, "amount must be a number");
  await bad("POST", items, { name: "x", calories: -1 }, "calories must be greater than or equal to 0");
  await bad("POST", items, { name: "x", protein: "1" }, "protein must be a number");
  await bad("POST", items, { name: "x", carbs: -0.1 }, "carbs must be greater than or equal to 0");
  await bad("POST", items, { name: "x", fat: -2 }, "fat must be greater than or equal to 0");
  await bad("POST", items, { calories: 10 }, "Food name is required");
  await bad("POST", items, { name: "n".repeat(101) }, "Food name must be at most 100 characters");
  await bad("PUT", `${items}/${ok.body.id}`, { name: "" }, "Food name is required");
  await bad("PUT", `${items}/${ok.body.id}`, { calories: "9" }, "calories must be a number");

  const lib = "/api/meals/library/foods";
  const food = await api("POST", lib, {
    token: u.token,
    body: { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving_size: 100 },
  });
  assert.equal(food.status, 201);
  await bad("POST", lib, {}, "Food name is required");
  await bad("POST", lib, { name: "x", serving_size: 0 }, "serving_size must be greater than 0");
  await bad("POST", lib, { name: "x", serving_size: -1 }, "serving_size must be greater than 0");
  await bad("POST", lib, { name: "x", calories: "10" }, "calories must be a number");
  await bad("POST", lib, { name: "x", fat: -1 }, "fat must be greater than or equal to 0");
});

// ---------- water ----------

test("water: app payloads accepted, invalid ones keep their messages", async () => {
  const date = "2031-06-01";
  const a = await api("POST", "/api/water", { token: u.token, body: { date, amount_ml: 250 } });
  assert.equal(a.status, 200);
  const g = await api("POST", "/api/water", { token: u.token, body: { date, goal_ml: 3000 } });
  assert.equal(g.status, 200);
  assert.equal(g.body.goal_ml, 3000);
  assert.equal(g.body.amount_ml, 250);
  const zero = await api("POST", "/api/water", { token: u.token, body: { date, amount_ml: 0 } });
  assert.equal(zero.status, 200);
  const get = await api("GET", `/api/water?date=${date}`, { token: u.token });
  assert.equal(get.status, 200);
  const today = await api("GET", "/api/water", { token: u.token });
  assert.equal(today.status, 200);

  await bad("POST", "/api/water", { goal_ml: 0 }, "goal_ml must be a positive number");
  await bad("POST", "/api/water", { goal_ml: "2000" }, "goal_ml must be a positive number");
  await bad("POST", "/api/water", { amount_ml: -1 }, "amount_ml must be a non-negative number");
  await bad("POST", "/api/water", { amount_ml: "100" }, "amount_ml must be a non-negative number");
  // goal_ml is reported first when both are wrong.
  await bad("POST", "/api/water", { goal_ml: -1, amount_ml: -1 }, "goal_ml must be a positive number");
  await bad("POST", "/api/water", { date: "2031-06-31", amount_ml: 1 }, DATE_MSG);
  await bad("POST", "/api/water", { date: 20310601 }, DATE_MSG);

  for (const q of ["?date=a&date=b", "?date=hoje", "?date=2031-02-30"]) {
    const res = await api("GET", `/api/water${q}`, { token: u.token });
    assert.equal(res.status, 400, q);
    assert.deepEqual(res.body, { error: DATE_MSG });
  }
});

// ---------- body-parser errors ----------

test("malformed JSON and oversize bodies", async () => {
  const bad1 = await api("POST", "/api/meals", { token: u.token, raw: '{"name":' });
  assert.equal(bad1.status, 400);
  assert.deepEqual(bad1.body, { error: "Invalid JSON body" });

  const big = JSON.stringify({ name: "x", notes: "a".repeat(101 * 1024) });
  const bad2 = await api("POST", "/api/meals", { token: u.token, raw: big });
  assert.equal(bad2.status, 413);
  assert.deepEqual(bad2.body, { error: "Payload too large" });
});

test("validation runs after authentication (401 wins over 400)", async () => {
  const res = await api("POST", "/api/workouts", { body: { name: "" } });
  assert.equal(res.status, 401);
});
