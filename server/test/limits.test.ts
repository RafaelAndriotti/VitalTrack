// Plausibility ceilings, notes cap and muscle_groups CSV integrity.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let u: TestUser;
let workoutId: string;
let exerciseId: string;
let mealId: string;

before(async () => {
  await startServer();
  u = await createUser();
  workoutId = (await api("POST", "/api/workouts", { token: u.token, body: { name: "W" } })).body.id;
  exerciseId = (
    await api("POST", `/api/workouts/${workoutId}/exercises`, { token: u.token, body: { name: "E" } })
  ).body.id;
  mealId = (await api("POST", "/api/meals", { token: u.token, body: { name: "M" } })).body.id;
});
after(async () => {
  await stopServer();
});

async function send(method: string, path: string, body: unknown, status: number, error?: string) {
  const res = await api(method, path, { token: u.token, body });
  assert.equal(
    res.status,
    status,
    `${method} ${path} ${JSON.stringify(body).slice(0, 80)} -> ${res.text.slice(0, 120)}`
  );
  if (error !== undefined) assert.deepEqual(res.body, { error });
  return res;
}

const lte = (f: string, n: number) => `${f} must be less than or equal to ${n}`;

test("notes: 10000 chars accepted, 10001 rejected (workout and exercise)", async () => {
  const ok = "n".repeat(10_000);
  const tooLong = "n".repeat(10_001);
  const msg = "notes must be at most 10000 characters";
  assert.equal((await send("POST", "/api/workouts", { name: "x", notes: ok }, 201)).body.notes.length, 10_000);
  await send("POST", "/api/workouts", { name: "x", notes: tooLong }, 400, msg);
  await send("PUT", `/api/workouts/${workoutId}`, { notes: tooLong }, 400, msg);
  await send("POST", `/api/workouts/${workoutId}/exercises`, { name: "x", notes: ok }, 201);
  await send("POST", `/api/workouts/${workoutId}/exercises`, { name: "x", notes: tooLong }, 400, msg);
  await send("PUT", `/api/workouts/${workoutId}/exercises/${exerciseId}`, { notes: tooLong }, 400, msg);
});

test("sets: weight, reps, order_index ceilings", async () => {
  const sets = `/api/workouts/${workoutId}/exercises/${exerciseId}/sets`;
  await send("POST", sets, { weight: 2000, reps: 10_000, order_index: 10_000 }, 201);
  await send("POST", sets, { weight: 2000.5 }, 400, lte("weight", 2000));
  await send("POST", sets, { reps: 10_001 }, 400, lte("reps", 10_000));
  await send("POST", sets, { order_index: 10_001 }, 400, lte("order_index", 10_000));
  const s = await send("POST", sets, { weight: 1 }, 201);
  await send("PUT", `${sets}/${s.body.id}`, { weight: 1e9 }, 400, lte("weight", 2000));
  await send("PUT", `${sets}/${s.body.id}`, { reps: 1e9 }, 400, lte("reps", 10_000));
  await send("PUT", `${sets}/${s.body.id}`, { order_index: 1e9 }, 400, lte("order_index", 10_000));
});

test("meals: calories, macros, amount, serving_size ceilings", async () => {
  const items = `/api/meals/${mealId}/items`;
  await send(
    "POST",
    items,
    { name: "x", amount: 100_000, calories: 100_000, protein: 10_000, carbs: 10_000, fat: 10_000 },
    201
  );
  await send("POST", items, { name: "x", amount: 100_001 }, 400, lte("amount", 100_000));
  await send("POST", items, { name: "x", calories: 100_001 }, 400, lte("calories", 100_000));
  await send("POST", items, { name: "x", protein: 10_001 }, 400, lte("protein", 10_000));
  await send("POST", items, { name: "x", carbs: 10_001 }, 400, lte("carbs", 10_000));
  await send("POST", items, { name: "x", fat: 10_001 }, 400, lte("fat", 10_000));
  const it = await send("POST", items, { name: "x", amount: 1 }, 201);
  await send("PUT", `${items}/${it.body.id}`, { amount: 1e9 }, 400, lte("amount", 100_000));
  await send("PUT", `${items}/${it.body.id}`, { calories: 1e9 }, 400, lte("calories", 100_000));

  const lib = "/api/meals/library/foods";
  await send("POST", lib, { name: "x", serving_size: 100_000, calories: 100_000 }, 201);
  await send("POST", lib, { name: "x", serving_size: 100_001 }, 400, lte("serving_size", 100_000));
  await send("POST", lib, { name: "x", calories: 100_001 }, 400, lte("calories", 100_000));
  await send("POST", lib, { name: "x", fat: 10_001 }, 400, lte("fat", 10_000));
});

test("water: amount_ml and goal_ml ceilings, old rules intact", async () => {
  await send("POST", "/api/water", { date: "2032-01-01", amount_ml: 50_000, goal_ml: 50_000 }, 200);
  await send("POST", "/api/water", { amount_ml: 50_001 }, 400, lte("amount_ml", 50_000));
  await send("POST", "/api/water", { goal_ml: 50_001 }, 400, lte("goal_ml", 50_000));
  await send("POST", "/api/water", { goal_ml: 0 }, 400, "goal_ml must be a positive number");
  await send("POST", "/api/water", { amount_ml: -1 }, 400, "amount_ml must be a non-negative number");
});

test("muscle_groups: array items with commas rejected, string form still accepted", async () => {
  const msg = "muscle_groups items must not contain commas";
  await send("POST", "/api/workouts", { name: "x", muscle_groups: ["Peito,Costas"] }, 400, msg);
  await send("POST", "/api/workouts", { name: "x", muscle_groups: ["Peito", "a,b"] }, 400, msg);
  await send("PUT", `/api/workouts/${workoutId}`, { muscle_groups: ["a,b"] }, 400, msg);
  const ok = await send("POST", "/api/workouts", { name: "x", muscle_groups: ["Peito", "Costas"] }, 201);
  assert.deepEqual(ok.body.muscle_groups, ["Peito", "Costas"]);
  const str = await send("POST", "/api/workouts", { name: "x", muscle_groups: "Peito,Costas" }, 201);
  assert.deepEqual(str.body.muscle_groups, ["Peito", "Costas"]);
});
