import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { api, startServer, stopServer, createUser, type TestUser } from "./helpers.js";

let u: TestUser;
const today = () => new Date().toISOString().split("T")[0];

before(async () => {
  await startServer();
  u = await createUser();
});
after(async () => {
  await stopServer();
});

const WORKOUT_KEYS = [
  "calories_burned", "completed", "created_at", "date", "estimated", "exercises", "id",
  "muscle_groups", "name", "notes", "source_template_id", "updated_at", "user_id", "weight_kg_used",
];
const SET_KEYS = [
  "completed", "created_at", "exercise_id", "id", "kind", "label", "order_index", "reps",
  "updated_at", "weight",
];

async function mkWorkout(body: Record<string, unknown> = { name: "W" }) {
  const res = await api("POST", "/api/workouts", { token: u.token, body });
  assert.equal(res.status, 201);
  return res.body;
}
async function getAll() {
  const res = await api("GET", "/api/workouts", { token: u.token });
  assert.equal(res.status, 200);
  return res.body as any[];
}
async function getOne(id: string) {
  return (await getAll()).find((w) => w.id === id);
}

test("workouts: create with defaults", async () => {
  const w = await mkWorkout({ name: "Push" });
  assert.deepEqual(Object.keys(w).sort(), WORKOUT_KEYS);
  assert.equal(w.user_id, u.id);
  assert.equal(w.name, "Push");
  assert.equal(w.date, today());
  assert.equal(w.completed, false);
  assert.equal(w.notes, null);
  assert.deepEqual(w.muscle_groups, []);
  assert.deepEqual(w.exercises, []);
  assert.deepEqual(await getOne(w.id), w);
});

test("workouts: create 400 without name", async () => {
  const res = await api("POST", "/api/workouts", { token: u.token, body: { date: "2024-01-01" } });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body, { error: "Workout name is required" });
});

test("workouts: create with all fields; muscle_groups array and CSV string", async () => {
  const a = await mkWorkout({
    name: "Legs", date: "2024-05-01", notes: "heavy", completed: true,
    muscle_groups: ["Quadríceps", "Glúteos"],
  });
  assert.equal(a.date, "2024-05-01");
  assert.equal(a.notes, "heavy");
  assert.equal(a.completed, true);
  assert.deepEqual(a.muscle_groups, ["Quadríceps", "Glúteos"]);

  const b = await mkWorkout({ name: "Upper", muscle_groups: "Peito,Costas,,Ombros" });
  assert.deepEqual(b.muscle_groups, ["Peito", "Costas", "Ombros"]); // empty CSV parts filtered
  assert.equal(b.completed, false);

  const c = await mkWorkout({ name: "Empty", muscle_groups: [] });
  assert.deepEqual(c.muscle_groups, []);

  assert.deepEqual(await getOne(a.id), a);
  assert.deepEqual(await getOne(b.id), b);
});

test("workouts: list returns only own workouts", async () => {
  const other = await createUser("Other");
  const mine = await mkWorkout({ name: "mine-list" });
  const res = await api("POST", "/api/workouts", { token: other.token, body: { name: "theirs" } });
  assert.equal(res.status, 201);
  const ids = (await getAll()).map((w) => w.id);
  assert.ok(ids.includes(mine.id));
  assert.ok(!ids.includes(res.body.id));
});

test("workouts: PUT partial preserves omitted fields (COALESCE)", async () => {
  const w = await mkWorkout({
    name: "Orig", date: "2024-01-02", notes: "n", completed: false, muscle_groups: ["Peito"],
  });
  const r1 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { completed: true } });
  assert.equal(r1.status, 200);
  assert.deepEqual(Object.keys(r1.body).sort(), WORKOUT_KEYS);
  assert.equal(r1.body.completed, true);
  assert.equal(r1.body.name, "Orig");
  assert.equal(r1.body.date, "2024-01-02");
  assert.equal(r1.body.notes, "n");
  assert.deepEqual(r1.body.muscle_groups, ["Peito"]);

  const r2 = await api("PUT", `/api/workouts/${w.id}`, {
    token: u.token,
    body: { name: "New", muscle_groups: ["Costas", "Bíceps"], completed: false },
  });
  assert.equal(r2.body.name, "New");
  assert.equal(r2.body.completed, false);
  assert.deepEqual(r2.body.muscle_groups, ["Costas", "Bíceps"]);
  assert.equal(r2.body.notes, "n");

  const r3 = await api("PUT", `/api/workouts/${w.id}`, {
    token: u.token, body: { muscle_groups: "A,B", date: "2024-02-02", notes: "z" },
  });
  assert.deepEqual(r3.body.muscle_groups, ["A", "B"]);
  assert.equal(r3.body.date, "2024-02-02");
  assert.equal(r3.body.notes, "z");

  // [] clears muscle groups (joins to "" which COALESCE keeps as non-null)
  const r4 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { muscle_groups: [] } });
  assert.deepEqual(r4.body.muscle_groups, []);

  // Empty body: nothing changes, still 200
  const r5 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: {} });
  assert.equal(r5.status, 200);
  assert.equal(r5.body.name, "New");

  assert.deepEqual(await getOne(w.id), r5.body);
});

test("workouts: PUT cannot clear notes with null; empty name accepted", async () => {
  const w = await mkWorkout({ name: "Keep", notes: "note" });
  // BUG conhecido: null e tratado como "omitido" (COALESCE), nao e possivel limpar notes com null.
  const r1 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { notes: null } });
  assert.equal(r1.body.notes, "note");
  // "" e gravado como esta.
  const r2 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { notes: "" } });
  assert.equal(r2.body.notes, "");
  // Corrigido: PUT com name vazio agora e 400 (antes 200 e gravava "").
  const r3 = await api("PUT", `/api/workouts/${w.id}`, { token: u.token, body: { name: "" } });
  assert.equal(r3.status, 400);
  assert.deepEqual(r3.body, { error: "Workout name is required" });
  assert.equal((await getOne(w.id)).name, "Keep");
});

test("workouts: PUT/DELETE 404 for unknown id", async () => {
  const p = await api("PUT", "/api/workouts/nope", { token: u.token, body: { name: "x" } });
  assert.equal(p.status, 404);
  assert.deepEqual(p.body, { error: "Workout not found" });
  const d = await api("DELETE", "/api/workouts/nope", { token: u.token });
  assert.equal(d.status, 404);
  assert.deepEqual(d.body, { error: "Workout not found" });
});

test("workouts: DELETE 204 empty body, removes workout", async () => {
  const w = await mkWorkout({ name: "ToDelete" });
  const d = await api("DELETE", `/api/workouts/${w.id}`, { token: u.token });
  assert.equal(d.status, 204);
  assert.equal(d.text, "");
  assert.equal(await getOne(w.id), undefined);
  const again = await api("DELETE", `/api/workouts/${w.id}`, { token: u.token });
  assert.equal(again.status, 404);
});

test("exercises: add returns exercise_sets [] and persists; validations", async () => {
  const w = await mkWorkout({ name: "Ex" });
  const res = await api("POST", `/api/workouts/${w.id}/exercises`, {
    token: u.token, body: { name: "Supino", notes: "slow" },
  });
  assert.equal(res.status, 201);
  assert.deepEqual(Object.keys(res.body).sort(), [
    "created_at", "exercise_sets", "id", "name", "notes", "order_index", "updated_at", "workout_id",
  ]);
  assert.equal(res.body.workout_id, w.id);
  assert.equal(res.body.name, "Supino");
  assert.equal(res.body.notes, "slow");
  assert.deepEqual(res.body.exercise_sets, []);

  const noNotes = await api("POST", `/api/workouts/${w.id}/exercises`, {
    token: u.token, body: { name: "Agachamento" },
  });
  assert.equal(noNotes.body.notes, null);

  const persisted = await getOne(w.id);
  assert.equal(persisted.exercises.length, 2);
  const found = persisted.exercises.find((e: any) => e.id === res.body.id);
  assert.deepEqual(found, res.body);

  const bad = await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: {} });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: "Exercise name is required" });

  const nf = await api("POST", "/api/workouts/nope/exercises", { token: u.token, body: { name: "x" } });
  assert.equal(nf.status, 404);
  assert.deepEqual(nf.body, { error: "Workout not found" });
});

test("exercises: validation runs before ownership (400 even for unknown workout)", async () => {
  const res = await api("POST", "/api/workouts/nope/exercises", { token: u.token, body: {} });
  assert.equal(res.status, 400);
});

test("exercises: PUT partial, 404s; PUT response has no exercise_sets", async () => {
  const w = await mkWorkout({ name: "ExU" });
  const ex = (await api("POST", `/api/workouts/${w.id}/exercises`, {
    token: u.token, body: { name: "A", notes: "keep" },
  })).body;

  const r = await api("PUT", `/api/workouts/${w.id}/exercises/${ex.id}`, {
    token: u.token, body: { name: "B" },
  });
  assert.equal(r.status, 200);
  // BUG conhecido: PUT exercise nao devolve exercise_sets (POST devolve []).
  assert.deepEqual(Object.keys(r.body).sort(), [
    "created_at", "id", "name", "notes", "order_index", "updated_at", "workout_id",
  ]);
  assert.equal(r.body.name, "B");
  assert.equal(r.body.notes, "keep");

  const r2 = await api("PUT", `/api/workouts/${w.id}/exercises/${ex.id}`, {
    token: u.token, body: { notes: "new" },
  });
  assert.equal(r2.body.name, "B");
  assert.equal(r2.body.notes, "new");

  const persisted = (await getOne(w.id)).exercises[0];
  assert.equal(persisted.name, "B");
  assert.equal(persisted.notes, "new");

  const nfEx = await api("PUT", `/api/workouts/${w.id}/exercises/nope`, { token: u.token, body: { name: "x" } });
  assert.equal(nfEx.status, 404);
  assert.deepEqual(nfEx.body, { error: "Exercise not found" });
  const nfW = await api("PUT", `/api/workouts/nope/exercises/${ex.id}`, { token: u.token, body: { name: "x" } });
  assert.equal(nfW.status, 404);
  assert.deepEqual(nfW.body, { error: "Workout not found" });
});

test("exercises: DELETE 204 and 404s", async () => {
  const w = await mkWorkout({ name: "ExD" });
  const ex = (await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: { name: "A" } })).body;
  const d = await api("DELETE", `/api/workouts/${w.id}/exercises/${ex.id}`, { token: u.token });
  assert.equal(d.status, 204);
  assert.equal(d.text, "");
  assert.deepEqual((await getOne(w.id)).exercises, []);
  const again = await api("DELETE", `/api/workouts/${w.id}/exercises/${ex.id}`, { token: u.token });
  assert.equal(again.status, 404);
  assert.deepEqual(again.body, { error: "Exercise not found" });
  const nfW = await api("DELETE", `/api/workouts/nope/exercises/${ex.id}`, { token: u.token });
  assert.equal(nfW.status, 404);
  assert.deepEqual(nfW.body, { error: "Workout not found" });
});

test("exercises: exerciseId from another workout (same user) is rejected 404", async () => {
  const w1 = await mkWorkout({ name: "W1" });
  const w2 = await mkWorkout({ name: "W2" });
  const ex2 = (await api("POST", `/api/workouts/${w2.id}/exercises`, { token: u.token, body: { name: "E2" } })).body;
  const set2 = (await api("POST", `/api/workouts/${w2.id}/exercises/${ex2.id}/sets`, {
    token: u.token, body: { weight: 10, reps: 5 },
  })).body;

  const put = await api("PUT", `/api/workouts/${w1.id}/exercises/${ex2.id}`, { token: u.token, body: { name: "hack" } });
  assert.equal(put.status, 404);
  assert.deepEqual(put.body, { error: "Exercise not found" });
  const del = await api("DELETE", `/api/workouts/${w1.id}/exercises/${ex2.id}`, { token: u.token });
  assert.equal(del.status, 404);
  assert.deepEqual(del.body, { error: "Exercise not found" });
  const addSet = await api("POST", `/api/workouts/${w1.id}/exercises/${ex2.id}/sets`, { token: u.token, body: {} });
  assert.equal(addSet.status, 404);
  assert.deepEqual(addSet.body, { error: "Exercise not found" });
  const putSet = await api("PUT", `/api/workouts/${w1.id}/exercises/${ex2.id}/sets/${set2.id}`, {
    token: u.token, body: { reps: 99 },
  });
  assert.equal(putSet.status, 404);
  assert.deepEqual(putSet.body, { error: "Set not found" });
  const delSet = await api("DELETE", `/api/workouts/${w1.id}/exercises/${ex2.id}/sets/${set2.id}`, { token: u.token });
  assert.equal(delSet.status, 404);
  assert.deepEqual(delSet.body, { error: "Set not found" });

  const after2 = await getOne(w2.id);
  assert.equal(after2.exercises[0].name, "E2");
  assert.equal(after2.exercises[0].exercise_sets.length, 1);
  assert.equal(after2.exercises[0].exercise_sets[0].reps, 5);
  assert.deepEqual((await getOne(w1.id)).exercises, []);
});

test("sets: add defaults/explicit, shape, update partial, delete, 404s", async () => {
  const w = await mkWorkout({ name: "Sets" });
  const ex = (await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: { name: "E" } })).body;
  const base = `/api/workouts/${w.id}/exercises/${ex.id}/sets`;

  const d = await api("POST", base, { token: u.token, body: {} });
  assert.equal(d.status, 201);
  assert.deepEqual(Object.keys(d.body).sort(), SET_KEYS);
  assert.equal(d.body.exercise_id, ex.id);
  assert.equal(d.body.weight, 0);
  assert.equal(d.body.reps, 0);
  assert.equal(d.body.completed, false);
  assert.equal(d.body.order_index, 0);

  const s = await api("POST", base, {
    token: u.token, body: { weight: 52.5, reps: 8, completed: true, order_index: 1 },
  });
  assert.equal(s.status, 201);
  assert.equal(s.body.weight, 52.5);
  assert.equal(s.body.reps, 8);
  assert.equal(s.body.completed, true);
  assert.equal(s.body.order_index, 1);

  // Persisted + sets ordered by order_index
  let sets = (await getOne(w.id)).exercises[0].exercise_sets;
  assert.deepEqual(sets.map((x: any) => x.id), [d.body.id, s.body.id]);
  assert.deepEqual(sets[1], s.body);

  // Partial update
  const u1 = await api("PUT", `${base}/${s.body.id}`, { token: u.token, body: { weight: 60 } });
  assert.equal(u1.status, 200);
  assert.deepEqual(Object.keys(u1.body).sort(), SET_KEYS);
  assert.equal(u1.body.weight, 60);
  assert.equal(u1.body.reps, 8);
  assert.equal(u1.body.completed, true);
  assert.equal(u1.body.order_index, 1);

  const u2 = await api("PUT", `${base}/${s.body.id}`, { token: u.token, body: { completed: false, reps: 0 } });
  assert.equal(u2.body.completed, false);
  assert.equal(u2.body.reps, 0); // 0 is kept (?? not ||)
  assert.equal(u2.body.weight, 60);

  // Corrigido: regra igual ao POST (order_index inteiro >= 0 no update)
  const u3 = await api("PUT", `${base}/${s.body.id}`, { token: u.token, body: { order_index: -1 } });
  assert.equal(u3.status, 400);
  assert.equal(u3.body.error, "order_index must be greater than or equal to 0");
  sets = (await getOne(w.id)).exercises[0].exercise_sets;
  assert.deepEqual(sets.map((x: any) => x.id), [d.body.id, s.body.id]); // rejected update leaves order intact

  // Valid reorder: move d after s
  const u4 = await api("PUT", `${base}/${d.body.id}`, { token: u.token, body: { order_index: 2 } });
  assert.equal(u4.status, 200);
  assert.equal(u4.body.order_index, 2);
  sets = (await getOne(w.id)).exercises[0].exercise_sets;
  assert.deepEqual(sets.map((x: any) => x.id), [s.body.id, d.body.id]); // reordered
  assert.equal(sets[0].weight, 60);

  // 404s
  const nf = await api("PUT", `${base}/nope`, { token: u.token, body: { reps: 1 } });
  assert.equal(nf.status, 404);
  assert.deepEqual(nf.body, { error: "Set not found" });
  const nfEx = await api("POST", `/api/workouts/${w.id}/exercises/nope/sets`, { token: u.token, body: {} });
  assert.equal(nfEx.status, 404);
  assert.deepEqual(nfEx.body, { error: "Exercise not found" });
  const nfWk = await api("POST", `/api/workouts/nope/exercises/${ex.id}/sets`, { token: u.token, body: {} });
  assert.equal(nfWk.status, 404);
  assert.deepEqual(nfWk.body, { error: "Exercise not found" });
  const nfDel = await api("DELETE", `${base}/nope`, { token: u.token });
  assert.equal(nfDel.status, 404);
  assert.deepEqual(nfDel.body, { error: "Set not found" });

  // Delete
  const del = await api("DELETE", `${base}/${d.body.id}`, { token: u.token });
  assert.equal(del.status, 204);
  assert.equal(del.text, "");
  sets = (await getOne(w.id)).exercises[0].exercise_sets;
  assert.deepEqual(sets.map((x: any) => x.id), [s.body.id]);
  const again = await api("DELETE", `${base}/${d.body.id}`, { token: u.token });
  assert.equal(again.status, 404);
});

test("workouts: cascade delete removes exercises and sets", async () => {
  const w = await mkWorkout({ name: "Cascade" });
  const ex = (await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: { name: "E" } })).body;
  const set = (await api("POST", `/api/workouts/${w.id}/exercises/${ex.id}/sets`, {
    token: u.token, body: { reps: 3 },
  })).body;

  // Exercise delete cascades to its sets
  const ex2 = (await api("POST", `/api/workouts/${w.id}/exercises`, { token: u.token, body: { name: "E2" } })).body;
  await api("POST", `/api/workouts/${w.id}/exercises/${ex2.id}/sets`, { token: u.token, body: { reps: 1 } });
  await api("DELETE", `/api/workouts/${w.id}/exercises/${ex2.id}`, { token: u.token });
  const mid = await getOne(w.id);
  assert.deepEqual(mid.exercises.map((e: any) => e.id), [ex.id]);

  const d = await api("DELETE", `/api/workouts/${w.id}`, { token: u.token });
  assert.equal(d.status, 204);
  assert.equal(await getOne(w.id), undefined);

  // Children are gone: set/exercise endpoints under the deleted workout 404
  const putSet = await api("PUT", `/api/workouts/${w.id}/exercises/${ex.id}/sets/${set.id}`, {
    token: u.token, body: { reps: 9 },
  });
  assert.equal(putSet.status, 404);
  const { db } = await import("../src/config/db.js");
  assert.equal((db.prepare("SELECT COUNT(*) c FROM exercises WHERE workout_id = ?").get(w.id) as any).c, 0);
  assert.equal((db.prepare("SELECT COUNT(*) c FROM exercise_sets WHERE id = ?").get(set.id) as any).c, 0);
});

test("library/exercises: global + own; create/validate/delete", async () => {
  const other = await createUser("Lib Other");
  const mine = await api("POST", "/api/workouts/library/exercises", {
    token: u.token, body: { name: "Meu exercicio", muscle_group: "Peito" },
  });
  assert.equal(mine.status, 201);
  assert.deepEqual(Object.keys(mine.body).sort(), [
    "created_at", "id", "muscle_group", "name", "updated_at", "user_id",
  ]);
  assert.equal(mine.body.user_id, u.id);
  assert.equal(mine.body.muscle_group, "Peito");

  const noGroup = await api("POST", "/api/workouts/library/exercises", { token: u.token, body: { name: "Sem grupo" } });
  assert.equal(noGroup.status, 201);
  assert.equal(noGroup.body.muscle_group, null);

  const bad = await api("POST", "/api/workouts/library/exercises", { token: u.token, body: { muscle_group: "x" } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: "Exercise name is required" });

  const list = await api("GET", "/api/workouts/library/exercises", { token: u.token });
  assert.equal(list.status, 200);
  const globals = list.body.filter((e: any) => e.user_id === null);
  assert.ok(globals.length > 50);
  assert.ok(globals.some((e: any) => e.name === "Supino reto com barra" && e.muscle_group === "Peito"));
  assert.ok(list.body.some((e: any) => e.id === mine.body.id));
  assert.ok(list.body.every((e: any) => e.user_id === null || e.user_id === u.id));

  const otherList = await api("GET", "/api/workouts/library/exercises", { token: other.token });
  assert.ok(!otherList.body.some((e: any) => e.id === mine.body.id));
  assert.equal(otherList.body.filter((e: any) => e.user_id === null).length, globals.length);

  // Delete own
  const del = await api("DELETE", `/api/workouts/library/exercises/${mine.body.id}`, { token: u.token });
  assert.equal(del.status, 204);
  assert.equal(del.text, "");
  const list2 = await api("GET", "/api/workouts/library/exercises", { token: u.token });
  assert.ok(!list2.body.some((e: any) => e.id === mine.body.id));
  const again = await api("DELETE", `/api/workouts/library/exercises/${mine.body.id}`, { token: u.token });
  assert.equal(again.status, 404);
  assert.deepEqual(again.body, { error: "Exercise not found or cannot be deleted" });

  // Delete global -> 404 and global stays
  const g = globals[0];
  const delG = await api("DELETE", `/api/workouts/library/exercises/${g.id}`, { token: u.token });
  assert.equal(delG.status, 404);
  assert.deepEqual(delG.body, { error: "Exercise not found or cannot be deleted" });
  const list3 = await api("GET", "/api/workouts/library/exercises", { token: u.token });
  assert.ok(list3.body.some((e: any) => e.id === g.id));
});
