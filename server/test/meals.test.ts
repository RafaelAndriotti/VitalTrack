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

const MEAL_KEYS = ["created_at", "date", "id", "meal_items", "name", "time", "updated_at", "user_id"];
const ITEM_KEYS = [
  "amount", "calories", "carbs", "created_at", "fat", "id", "meal_id", "name", "protein", "updated_at",
];
const FOOD_KEYS = [
  "calories", "carbs", "created_at", "fat", "id", "name", "protein", "serving_size", "updated_at", "user_id",
];

async function mkMeal(body: Record<string, unknown> = { name: "M" }) {
  const res = await api("POST", "/api/meals", { token: u.token, body });
  assert.equal(res.status, 201);
  return res.body;
}
async function listMeals(query = "") {
  const res = await api("GET", `/api/meals${query}`, { token: u.token });
  assert.equal(res.status, 200);
  return res.body as any[];
}

test("meals: create defaults, validation, persisted", async () => {
  const m = await mkMeal({ name: "Cafe" });
  assert.deepEqual(Object.keys(m).sort(), MEAL_KEYS);
  assert.equal(m.user_id, u.id);
  assert.equal(m.name, "Cafe");
  assert.equal(m.date, today());
  assert.equal(m.time, null);
  assert.deepEqual(m.meal_items, []);
  assert.deepEqual((await listMeals()).find((x) => x.id === m.id), m);

  const full = await mkMeal({ name: "Almoco", date: "2024-03-03", time: "12:30" });
  assert.equal(full.date, "2024-03-03");
  assert.equal(full.time, "12:30");

  const bad = await api("POST", "/api/meals", { token: u.token, body: { date: "2024-01-01" } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: "Meal name is required" });
});

test("meals: list ?date= filter and own-only", async () => {
  const other = await createUser("Meal Other");
  const a = await mkMeal({ name: "A", date: "2031-01-01" });
  const b = await mkMeal({ name: "B", date: "2031-01-01" });
  const c = await mkMeal({ name: "C", date: "2031-01-02" });
  const theirs = await api("POST", "/api/meals", { token: other.token, body: { name: "T", date: "2031-01-01" } });

  const day1 = await listMeals("?date=2031-01-01");
  assert.deepEqual(day1.map((m) => m.id).sort(), [a.id, b.id].sort());
  const day2 = await listMeals("?date=2031-01-02");
  assert.deepEqual(day2.map((m) => m.id), [c.id]);
  assert.deepEqual(await listMeals("?date=1999-01-01"), []);

  const all = (await listMeals()).map((m) => m.id);
  assert.ok([a.id, b.id, c.id].every((id) => all.includes(id)));
  assert.ok(!all.includes(theirs.body.id));
  // empty ?date= is falsy -> no filter
  const emptyDate = (await listMeals("?date=")).map((m) => m.id);
  assert.ok([a.id, b.id, c.id].every((id) => emptyDate.includes(id)));
});

test("meals: PUT partial, 404, DELETE 204 + cascade items", async () => {
  const m = await mkMeal({ name: "Orig", date: "2024-04-04", time: "08:00" });
  const r1 = await api("PUT", `/api/meals/${m.id}`, { token: u.token, body: { name: "Renamed" } });
  assert.equal(r1.status, 200);
  assert.deepEqual(Object.keys(r1.body).sort(), MEAL_KEYS);
  assert.equal(r1.body.name, "Renamed");
  assert.equal(r1.body.date, "2024-04-04");
  assert.equal(r1.body.time, "08:00");
  const r2 = await api("PUT", `/api/meals/${m.id}`, { token: u.token, body: { time: "09:15", date: "2024-04-05" } });
  assert.equal(r2.body.name, "Renamed");
  assert.equal(r2.body.time, "09:15");
  assert.equal(r2.body.date, "2024-04-05");
  // BUG conhecido: null = "omitido" (COALESCE); nao e possivel limpar time.
  const r3 = await api("PUT", `/api/meals/${m.id}`, { token: u.token, body: { time: null } });
  assert.equal(r3.body.time, "09:15");

  const item = (await api("POST", `/api/meals/${m.id}/items`, { token: u.token, body: { name: "Ovo" } })).body;
  const withItem = await api("PUT", `/api/meals/${m.id}`, { token: u.token, body: {} });
  assert.equal(withItem.status, 200);
  assert.deepEqual(withItem.body.meal_items.map((i: any) => i.id), [item.id]);
  assert.deepEqual((await listMeals()).find((x) => x.id === m.id), withItem.body);

  const nf = await api("PUT", "/api/meals/nope", { token: u.token, body: { name: "x" } });
  assert.equal(nf.status, 404);
  assert.deepEqual(nf.body, { error: "Meal not found" });
  const nfD = await api("DELETE", "/api/meals/nope", { token: u.token });
  assert.equal(nfD.status, 404);
  assert.deepEqual(nfD.body, { error: "Meal not found" });

  const del = await api("DELETE", `/api/meals/${m.id}`, { token: u.token });
  assert.equal(del.status, 204);
  assert.equal(del.text, "");
  assert.equal((await listMeals()).find((x) => x.id === m.id), undefined);
  const { db } = await import("../src/config/db.js");
  assert.equal((db.prepare("SELECT COUNT(*) c FROM meal_items WHERE id = ?").get(item.id) as any).c, 0);
  const again = await api("DELETE", `/api/meals/${m.id}`, { token: u.token });
  assert.equal(again.status, 404);
});

test("meal items: add defaults/explicit, validation, 404", async () => {
  const m = await mkMeal({ name: "Items" });
  const base = `/api/meals/${m.id}/items`;

  const d = await api("POST", base, { token: u.token, body: { name: "Arroz" } });
  assert.equal(d.status, 201);
  assert.deepEqual(Object.keys(d.body).sort(), ITEM_KEYS);
  assert.equal(d.body.meal_id, m.id);
  assert.equal(d.body.amount, 100);
  assert.equal(d.body.calories, 0);
  assert.equal(d.body.protein, 0);
  assert.equal(d.body.carbs, 0);
  assert.equal(d.body.fat, 0);

  const e = await api("POST", base, {
    token: u.token,
    body: { name: "Frango", amount: 150, calories: 250, protein: 46.5, carbs: 0, fat: 5.4 },
  });
  assert.equal(e.status, 201);
  assert.equal(e.body.amount, 150);
  assert.equal(e.body.calories, 250);
  assert.equal(e.body.protein, 46.5);
  assert.equal(e.body.fat, 5.4);

  // Corrigido: amount 0 agora e 400 (antes virava 100 por causa do ||).
  const z = await api("POST", base, { token: u.token, body: { name: "Zero", amount: 0 } });
  assert.equal(z.status, 400);
  assert.deepEqual(z.body, { error: "amount must be greater than 0" });

  const stored = (await listMeals()).find((x) => x.id === m.id);
  assert.equal(stored.meal_items.length, 2); // Corrigido: o item amount=0 nao e mais criado (era 3)
  assert.deepEqual(stored.meal_items.find((i: any) => i.id === e.body.id), e.body);

  const bad = await api("POST", base, { token: u.token, body: { calories: 10 } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: "Food name is required" });
  const nf = await api("POST", "/api/meals/nope/items", { token: u.token, body: { name: "x" } });
  assert.equal(nf.status, 404);
  assert.deepEqual(nf.body, { error: "Meal not found" });
});

test("meal items: PUT partial (amount 0 rejected, same as POST), DELETE, 404s, itemId from another meal", async () => {
  const m = await mkMeal({ name: "ItemsU" });
  const m2 = await mkMeal({ name: "ItemsU2" });
  const it = (await api("POST", `/api/meals/${m.id}/items`, {
    token: u.token, body: { name: "Pao", amount: 50, calories: 130, protein: 4, carbs: 25, fat: 1 },
  })).body;
  const base = `/api/meals/${m.id}/items/${it.id}`;

  const r1 = await api("PUT", base, { token: u.token, body: { calories: 140 } });
  assert.equal(r1.status, 200);
  assert.deepEqual(Object.keys(r1.body).sort(), ITEM_KEYS);
  assert.equal(r1.body.calories, 140);
  assert.equal(r1.body.name, "Pao");
  assert.equal(r1.body.amount, 50);
  assert.equal(r1.body.protein, 4);

  // Corrigido: regra igual ao POST (amount deve ser > 0 no update)
  const rBad = await api("PUT", base, { token: u.token, body: { amount: 0, fat: 0, name: "Pao2" } });
  assert.equal(rBad.status, 400);
  assert.equal(rBad.body.error, "amount must be greater than 0");

  // 0 is still honored on update for the other fields (?? not ||)
  const r2 = await api("PUT", base, { token: u.token, body: { fat: 0, name: "Pao2" } });
  assert.equal(r2.body.amount, 50);
  assert.equal(r2.body.fat, 0);
  assert.equal(r2.body.name, "Pao2");
  assert.equal(r2.body.carbs, 25);

  const stored = (await listMeals()).find((x) => x.id === m.id);
  assert.deepEqual(stored.meal_items, [r2.body]);

  const nfItem = await api("PUT", `/api/meals/${m.id}/items/nope`, { token: u.token, body: { name: "x" } });
  assert.equal(nfItem.status, 404);
  assert.deepEqual(nfItem.body, { error: "Food item not found" });
  const nfMeal = await api("PUT", `/api/meals/nope/items/${it.id}`, { token: u.token, body: { name: "x" } });
  assert.equal(nfMeal.status, 404);
  assert.deepEqual(nfMeal.body, { error: "Meal not found" });

  // item of meal 1 addressed via meal 2 (same user)
  const cross = await api("PUT", `/api/meals/${m2.id}/items/${it.id}`, { token: u.token, body: { name: "hack" } });
  assert.equal(cross.status, 404);
  assert.deepEqual(cross.body, { error: "Food item not found" });
  const crossDel = await api("DELETE", `/api/meals/${m2.id}/items/${it.id}`, { token: u.token });
  assert.equal(crossDel.status, 404);
  assert.deepEqual(crossDel.body, { error: "Food item not found" });
  assert.equal((await listMeals()).find((x) => x.id === m.id).meal_items[0].name, "Pao2");

  const del = await api("DELETE", base, { token: u.token });
  assert.equal(del.status, 204);
  assert.equal(del.text, "");
  assert.deepEqual((await listMeals()).find((x) => x.id === m.id).meal_items, []);
  const again = await api("DELETE", base, { token: u.token });
  assert.equal(again.status, 404);
  assert.deepEqual(again.body, { error: "Food item not found" });
  const nfDelMeal = await api("DELETE", `/api/meals/nope/items/${it.id}`, { token: u.token });
  assert.equal(nfDelMeal.status, 404);
  assert.deepEqual(nfDelMeal.body, { error: "Meal not found" });
});

test("library/foods: global + own, create defaults, validate, delete", async () => {
  const other = await createUser("Food Other");
  const mine = await api("POST", "/api/meals/library/foods", {
    token: u.token,
    body: { name: "Meu alimento", calories: 200, protein: 10.5, carbs: 20, fat: 3.3, serving_size: 30 },
  });
  assert.equal(mine.status, 201);
  assert.deepEqual(Object.keys(mine.body).sort(), FOOD_KEYS);
  assert.equal(mine.body.user_id, u.id);
  assert.equal(mine.body.calories, 200);
  assert.equal(mine.body.protein, 10.5);
  assert.equal(mine.body.serving_size, 30);

  const def = await api("POST", "/api/meals/library/foods", { token: u.token, body: { name: "Default" } });
  assert.equal(def.status, 201);
  assert.equal(def.body.calories, 0);
  assert.equal(def.body.protein, 0);
  assert.equal(def.body.carbs, 0);
  assert.equal(def.body.fat, 0);
  assert.equal(def.body.serving_size, 100);

  const bad = await api("POST", "/api/meals/library/foods", { token: u.token, body: { calories: 1 } });
  assert.equal(bad.status, 400);
  assert.deepEqual(bad.body, { error: "Food name is required" });

  const list = await api("GET", "/api/meals/library/foods", { token: u.token });
  assert.equal(list.status, 200);
  const globals = list.body.filter((f: any) => f.user_id === null);
  assert.ok(globals.length >= 6);
  const arroz = globals.find((f: any) => f.name === "Arroz Branco Cozido");
  assert.equal(arroz.calories, 130);
  assert.equal(arroz.serving_size, 100);
  assert.ok(list.body.some((f: any) => f.id === mine.body.id));
  assert.ok(list.body.every((f: any) => f.user_id === null || f.user_id === u.id));
  const otherList = await api("GET", "/api/meals/library/foods", { token: other.token });
  assert.ok(!otherList.body.some((f: any) => f.id === mine.body.id));

  const del = await api("DELETE", `/api/meals/library/foods/${mine.body.id}`, { token: u.token });
  assert.equal(del.status, 204);
  assert.equal(del.text, "");
  const list2 = await api("GET", "/api/meals/library/foods", { token: u.token });
  assert.ok(!list2.body.some((f: any) => f.id === mine.body.id));
  const again = await api("DELETE", `/api/meals/library/foods/${mine.body.id}`, { token: u.token });
  assert.equal(again.status, 404);
  assert.deepEqual(again.body, { error: "Food not found or cannot be deleted" });

  const delG = await api("DELETE", `/api/meals/library/foods/${arroz.id}`, { token: u.token });
  assert.equal(delG.status, 404);
  assert.deepEqual(delG.body, { error: "Food not found or cannot be deleted" });
  const list3 = await api("GET", "/api/meals/library/foods", { token: u.token });
  assert.ok(list3.body.some((f: any) => f.id === arroz.id));
});
