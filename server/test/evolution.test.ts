import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";
import { buildEvolution, type EvoWorkout } from "../src/utils/evolution.js";

// ---- unitário: função pura, data de referência fixa ----
const TODAY = "2026-11-06";
const w = (date: string, completed: boolean, name: string, sets: [number, number, boolean][]): EvoWorkout => ({
  date,
  completed,
  exercises: [{ name, sets: sets.map(([weight, reps, done]) => ({ weight, reps, completed: done })) }],
});

test("evolution: totals, previous period, buckets and highlight (pure)", () => {
  const workouts = [
    w("2026-11-06", true, "Supino", [[60, 8, true], [60, 8, true], [60, 7, false]]),
    w("2026-11-01", true, "Supino", [[55, 10, true]]),
    w("2026-10-30", true, "Remada", [[40, 10, true]]),
    w("2026-11-05", false, "Rascunho", [[99, 99, true]]), // não concluído: ignorado
  ];
  const r = buildEvolution({ workouts, periodDays: 7, today: TODAY, weightKg: 80 });

  assert.equal(r.start, "2026-10-31");
  assert.equal(r.end, TODAY);
  // 2 séries feitas em 11-06 → 5×80×(6/60)=40 kcal; 1 série em 11-01 → 5×80×(3/60)=20 kcal
  assert.deepEqual(r.current, { treinos: 2, volume_kg: 1510, kcal: 60 });
  // período anterior 10-24..10-30: 1 série de 40×10 → 20 kcal
  assert.deepEqual(r.previous, { treinos: 1, volume_kg: 400, kcal: 20 });
  assert.equal(r.bucket_days, 1);
  assert.equal(r.buckets.length, 7);
  assert.equal(r.buckets[1].volume_kg, 550); // 11-01
  assert.equal(r.buckets[6].volume_kg, 960); // 11-06
  assert.equal(r.kcal_estimated, false);
  assert.deepEqual(r.highlight, {
    exercise: "Supino",
    first_kg: 55,
    last_kg: 60,
    max_kg: 60,
    points: [
      { date: "2026-11-01", max_kg: 55 },
      { date: "2026-11-06", max_kg: 60 },
    ],
  });
});

test("evolution: 30 and 90 days use weekly buckets; no workouts gives empty result", () => {
  const r30 = buildEvolution({ workouts: [], periodDays: 30, today: TODAY, weightKg: null });
  assert.equal(r30.bucket_days, 7);
  assert.equal(r30.buckets.length, 5);
  assert.equal(r30.start, "2026-10-08");
  assert.deepEqual(r30.current, { treinos: 0, volume_kg: 0, kcal: 0 });
  assert.equal(r30.highlight, null);
  assert.equal(r30.kcal_estimated, false); // sem treino, nada foi estimado

  const r90 = buildEvolution({ workouts: [], periodDays: 90, today: TODAY, weightKg: null });
  assert.equal(r90.buckets.length, 13);
});

test("evolution: missing weight is flagged as estimated", () => {
  const r = buildEvolution({
    workouts: [w("2026-11-06", true, "Supino", [[60, 8, true]])],
    periodDays: 7,
    today: TODAY,
    weightKg: null,
  });
  assert.equal(r.kcal_estimated, true);
  assert.equal(r.current.kcal, 18); // 5×70×(3/60)=17,5 → 18
});

// ---- integração: rota HTTP ----
let u: TestUser;
const todayUtc = () => new Date().toISOString().split("T")[0];

before(async () => {
  await startServer();
  u = await createUser();
});
after(async () => {
  await stopServer();
});

test("evolution route: 400 for unsupported period", async () => {
  const res = await api("GET", "/api/workouts/evolution?days=5", { token: u.token });
  assert.equal(res.status, 400);
});

test("evolution route: 401 without token", async () => {
  const res = await api("GET", "/api/workouts/evolution");
  assert.equal(res.status, 401);
});

test("evolution route: reflects a completed workout with one done set", async () => {
  const wk = await api("POST", "/api/workouts", {
    token: u.token,
    body: { name: "Push", completed: true, date: todayUtc(), muscle_groups: ["Peito"] },
  });
  assert.equal(wk.status, 201);
  const ex = await api("POST", `/api/workouts/${wk.body.id}/exercises`, {
    token: u.token,
    body: { name: "Supino" },
  });
  assert.equal(ex.status, 201);
  const set = await api("POST", `/api/workouts/${wk.body.id}/exercises/${ex.body.id}/sets`, {
    token: u.token,
    body: { weight: 60, reps: 8, completed: true, order_index: 1 },
  });
  assert.equal(set.status, 201);

  const res = await api("GET", "/api/workouts/evolution?days=7", { token: u.token });
  assert.equal(res.status, 200);
  assert.equal(res.body.current.treinos, 1);
  assert.equal(res.body.current.volume_kg, 480);
  assert.equal(res.body.current.kcal, 18); // peso padrão 70 kg, 1 série
  assert.equal(res.body.kcal_estimated, true);
  assert.equal(res.body.highlight.exercise, "Supino");
});
