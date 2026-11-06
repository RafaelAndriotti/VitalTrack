import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let u: TestUser;
let other: TestUser;

before(async () => {
  await startServer();
  u = await createUser();
  other = await createUser();
});
after(async () => {
  await stopServer();
});

const TREINO_A = {
  name: "Treino A · Peito",
  muscle_groups: ["Peito", "Tríceps"],
  exercises: [
    {
      name: "Supino reto",
      sets: [
        { kind: "warmup", label: "Aquecimento", planned_reps: 12, planned_weight: 40 },
        { kind: "work", planned_reps: 8, planned_weight: 60 },
        { kind: "work", planned_reps: 8, planned_weight: 60 },
      ],
    },
    { name: "Tríceps na polia", sets: [{ kind: "drop", planned_reps: 10, planned_weight: 25 }] },
  ],
};

async function createTemplate(body: unknown = TREINO_A, token = u.token) {
  return api("POST", "/api/workouts/templates", { token, body });
}

test("templates: create returns tree with kind, label and planned values", async () => {
  const res = await createTemplate();
  assert.equal(res.status, 201);
  assert.equal(res.body.name, "Treino A · Peito");
  assert.deepEqual(res.body.muscle_groups, ["Peito", "Tríceps"]);
  assert.equal(res.body.exercises.length, 2);
  assert.equal(res.body.exercises[0].order_index, 0);
  const first = res.body.exercises[0].sets[0];
  assert.equal(first.kind, "warmup");
  assert.equal(first.label, "Aquecimento");
  assert.equal(first.planned_reps, 12);
  assert.equal(first.planned_weight, 40);
  assert.equal(res.body.exercises[0].sets[1].kind, "work");
  assert.equal(res.body.exercises[0].sets[1].label, null);
});

test("templates: list only returns the user's templates", async () => {
  await createTemplate({ name: "Só meu", exercises: [{ name: "Remada", sets: [{}] }] });
  const mine = await api("GET", "/api/workouts/templates", { token: u.token });
  assert.equal(mine.status, 200);
  assert.ok(mine.body.some((t: any) => t.name === "Só meu"));
  const theirs = await api("GET", "/api/workouts/templates", { token: other.token });
  assert.ok(!theirs.body.some((t: any) => t.name === "Só meu"));
});

test("templates: validation rejects empty exercises, bad kind and long label", async () => {
  const noEx = await createTemplate({ name: "X", exercises: [] });
  assert.equal(noEx.status, 400);
  const badKind = await createTemplate({
    name: "X",
    exercises: [{ name: "E", sets: [{ kind: "superset" }] }],
  });
  assert.equal(badKind.status, 400);
  const longLabel = await createTemplate({
    name: "X",
    exercises: [{ name: "E", sets: [{ label: "x".repeat(31) }] }],
  });
  assert.equal(longLabel.status, 400);
});

test("templates: PUT replaces the whole tree; 404 for another user's template", async () => {
  const created = await createTemplate();
  const id = created.body.id;
  const put = await api("PUT", `/api/workouts/templates/${id}`, {
    token: u.token,
    body: { name: "Treino A v2", exercises: [{ name: "Crucifixo", sets: [{ planned_reps: 12 }] }] },
  });
  assert.equal(put.status, 200);
  assert.equal(put.body.name, "Treino A v2");
  assert.equal(put.body.exercises.length, 1);
  assert.equal(put.body.exercises[0].name, "Crucifixo");

  const foreign = await api("PUT", `/api/workouts/templates/${id}`, {
    token: other.token,
    body: TREINO_A,
  });
  assert.equal(foreign.status, 404);
});

test("templates: start copies tree into a workout (kind, label, planned values, not done)", async () => {
  const tpl = await createTemplate({ ...TREINO_A, name: "Treino Start" });
  // Garante que o usuário "start" não tem treino em andamento.
  const start = await api("POST", `/api/workouts/templates/${tpl.body.id}/start`, { token: u.token });
  assert.equal(start.status, 201, JSON.stringify(start.body));
  assert.equal(start.body.name, "Treino Start");
  assert.equal(start.body.completed, false);
  assert.equal(start.body.exercises.length, 2);
  assert.equal(start.body.exercises[0].name, "Supino reto");
  const warm = start.body.exercises[0].exercise_sets[0];
  assert.equal(warm.kind, "warmup");
  assert.equal(warm.label, "Aquecimento");
  assert.equal(warm.weight, 40);
  assert.equal(warm.reps, 12);
  assert.equal(warm.completed, false);
  assert.equal(start.body.exercises[1].exercise_sets[0].kind, "drop");
});

test("templates: start 409 while another workout is in progress", async () => {
  const tpl = await createTemplate({ ...TREINO_A, name: "Treino Conflito" });
  const res = await api("POST", `/api/workouts/templates/${tpl.body.id}/start`, { token: u.token });
  assert.equal(res.status, 409);
});

test("templates: start on another user's template is 404", async () => {
  const tpl = await createTemplate();
  const res = await api("POST", `/api/workouts/templates/${tpl.body.id}/start`, { token: other.token });
  assert.equal(res.status, 404);
});

test("sets: label can be renamed, cleared (null → automatic) and kind changed", async () => {
  const x = await createUser(); // usuário próprio: sem treino em andamento dos outros testes
  const tpl = await createTemplate({ ...TREINO_A, name: "Treino Rótulo" }, x.token);
  const start = await api("POST", `/api/workouts/templates/${tpl.body.id}/start`, { token: x.token });
  assert.equal(start.status, 201);
  const ex = start.body.exercises[0];
  const set = ex.exercise_sets[1];
  const url = `/api/workouts/${start.body.id}/exercises/${ex.id}/sets/${set.id}`;

  const renamed = await api("PUT", url, { token: x.token, body: { label: "  Pico  " } });
  assert.equal(renamed.status, 200);
  assert.equal(renamed.body.label, "Pico");

  const cleared = await api("PUT", url, { token: x.token, body: { label: null } });
  assert.equal(cleared.body.label, null);

  const kind = await api("PUT", url, { token: x.token, body: { kind: "failure" } });
  assert.equal(kind.body.kind, "failure");
  assert.equal(kind.body.label, null);
});
