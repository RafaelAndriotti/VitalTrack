import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let A: TestUser;
let B: TestUser;
let workoutId: string;
let exerciseId: string;
let setId: string;
let mealId: string;
let itemId: string;
let libExId: string;
let libFoodId: string;

before(async () => {
  await startServer();
  A = await createUser("A");
  B = await createUser("B");

  const w = await api("POST", "/api/workouts", {
    token: A.token, body: { name: "A workout", notes: "secret", muscle_groups: ["Peito"] },
  });
  workoutId = w.body.id;
  exerciseId = (await api("POST", `/api/workouts/${workoutId}/exercises`, {
    token: A.token, body: { name: "A ex" },
  })).body.id;
  setId = (await api("POST", `/api/workouts/${workoutId}/exercises/${exerciseId}/sets`, {
    token: A.token, body: { weight: 20, reps: 10 },
  })).body.id;
  mealId = (await api("POST", "/api/meals", { token: A.token, body: { name: "A meal", date: "2032-01-01" } })).body.id;
  itemId = (await api("POST", `/api/meals/${mealId}/items`, {
    token: A.token, body: { name: "A item", calories: 100 },
  })).body.id;
  libExId = (await api("POST", "/api/workouts/library/exercises", { token: A.token, body: { name: "A lib ex" } })).body.id;
  libFoodId = (await api("POST", "/api/meals/library/foods", { token: A.token, body: { name: "A lib food" } })).body.id;
  await api("POST", "/api/water", { token: A.token, body: { date: "2032-01-01", amount_ml: 800, goal_ml: 3000 } });
});
after(async () => {
  await stopServer();
});

function nf(res: { status: number; body: any }, error: string) {
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error });
}

test("IDOR: B cannot touch A's workouts, exercises and sets", async () => {
  const wp = `/api/workouts/${workoutId}`;
  const ep = `${wp}/exercises/${exerciseId}`;
  const sp = `${ep}/sets/${setId}`;

  nf(await api("PUT", wp, { token: B.token, body: { name: "pwned", completed: true } }), "Workout not found");
  nf(await api("DELETE", wp, { token: B.token }), "Workout not found");
  nf(await api("POST", `${wp}/exercises`, { token: B.token, body: { name: "pwned ex" } }), "Workout not found");
  nf(await api("PUT", ep, { token: B.token, body: { name: "pwned" } }), "Workout not found");
  nf(await api("DELETE", ep, { token: B.token }), "Workout not found");
  nf(await api("POST", `${ep}/sets`, { token: B.token, body: { reps: 999 } }), "Exercise not found");
  nf(await api("PUT", sp, { token: B.token, body: { reps: 999 } }), "Set not found");
  nf(await api("DELETE", sp, { token: B.token }), "Set not found");

  // B sees none of it
  const bList = await api("GET", "/api/workouts", { token: B.token });
  assert.equal(bList.status, 200);
  assert.deepEqual(bList.body, []);

  // A's data intact
  const aList = await api("GET", "/api/workouts", { token: A.token });
  const w = aList.body.find((x: any) => x.id === workoutId);
  assert.equal(aList.body.length, 1);
  assert.equal(w.name, "A workout");
  assert.equal(w.notes, "secret");
  assert.equal(w.completed, false);
  assert.deepEqual(w.muscle_groups, ["Peito"]);
  assert.equal(w.exercises.length, 1);
  assert.equal(w.exercises[0].id, exerciseId);
  assert.equal(w.exercises[0].name, "A ex");
  assert.equal(w.exercises[0].exercise_sets.length, 1);
  assert.equal(w.exercises[0].exercise_sets[0].id, setId);
  assert.equal(w.exercises[0].exercise_sets[0].reps, 10);
  assert.equal(w.exercises[0].exercise_sets[0].weight, 20);
});

test("IDOR: B cannot touch A's meals and items", async () => {
  const mp = `/api/meals/${mealId}`;
  nf(await api("PUT", mp, { token: B.token, body: { name: "pwned" } }), "Meal not found");
  nf(await api("DELETE", mp, { token: B.token }), "Meal not found");
  nf(await api("POST", `${mp}/items`, { token: B.token, body: { name: "pwned item" } }), "Meal not found");
  nf(await api("PUT", `${mp}/items/${itemId}`, { token: B.token, body: { name: "pwned" } }), "Meal not found");
  nf(await api("DELETE", `${mp}/items/${itemId}`, { token: B.token }), "Meal not found");

  const bList = await api("GET", "/api/meals", { token: B.token });
  assert.deepEqual(bList.body, []);
  const bDate = await api("GET", "/api/meals?date=2032-01-01", { token: B.token });
  assert.deepEqual(bDate.body, []);

  const aList = await api("GET", "/api/meals", { token: A.token });
  assert.equal(aList.body.length, 1);
  assert.equal(aList.body[0].id, mealId);
  assert.equal(aList.body[0].name, "A meal");
  assert.equal(aList.body[0].meal_items.length, 1);
  assert.equal(aList.body[0].meal_items[0].id, itemId);
  assert.equal(aList.body[0].meal_items[0].name, "A item");
  assert.equal(aList.body[0].meal_items[0].calories, 100);
});

test("IDOR: B cannot delete A's library entries or see them", async () => {
  nf(await api("DELETE", `/api/workouts/library/exercises/${libExId}`, { token: B.token }),
    "Exercise not found or cannot be deleted");
  nf(await api("DELETE", `/api/meals/library/foods/${libFoodId}`, { token: B.token }),
    "Food not found or cannot be deleted");

  const bEx = await api("GET", "/api/workouts/library/exercises", { token: B.token });
  assert.ok(!bEx.body.some((e: any) => e.id === libExId));
  const bFood = await api("GET", "/api/meals/library/foods", { token: B.token });
  assert.ok(!bFood.body.some((f: any) => f.id === libFoodId));

  const aEx = await api("GET", "/api/workouts/library/exercises", { token: A.token });
  assert.ok(aEx.body.some((e: any) => e.id === libExId && e.name === "A lib ex"));
  const aFood = await api("GET", "/api/meals/library/foods", { token: A.token });
  assert.ok(aFood.body.some((f: any) => f.id === libFoodId && f.name === "A lib food"));
});

test("IDOR: B's water writes do not affect A", async () => {
  const b = await api("POST", "/api/water", { token: B.token, body: { date: "2032-01-01", amount_ml: 1, goal_ml: 1 } });
  assert.equal(b.status, 200);
  assert.equal(b.body.user_id, B.id);
  const a = await api("GET", "/api/water?date=2032-01-01", { token: A.token });
  assert.equal(a.body.user_id, A.id);
  assert.equal(a.body.amount_ml, 800);
  assert.equal(a.body.goal_ml, 3000);
});
