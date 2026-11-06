import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estimateStrengthCalories,
  STRENGTH_MET,
  MINUTES_PER_SET,
  DEFAULT_WEIGHT_KG,
} from "../src/utils/calories.js";

test("calories: zero completed sets burns zero", () => {
  const r = estimateStrengthCalories(0, 80);
  assert.equal(r.calories_burned, 0);
  assert.equal(r.estimated, false);
});

test("calories: MET × kg × hours with user weight", () => {
  // 10 séries × 3 min = 0,5 h ; 5,0 × 80 × 0,5 = 200
  const r = estimateStrengthCalories(10, 80);
  assert.equal(r.calories_burned, Math.round(STRENGTH_MET * 80 * ((10 * MINUTES_PER_SET) / 60)));
  assert.equal(r.calories_burned, 200);
  assert.equal(r.weight_kg_used, 80);
  assert.equal(r.estimated, false);
});

test("calories: missing or invalid weight falls back to default and is flagged", () => {
  for (const w of [null, undefined, 0, -5]) {
    const r = estimateStrengthCalories(4, w);
    assert.equal(r.weight_kg_used, DEFAULT_WEIGHT_KG);
    assert.equal(r.estimated, true);
  }
});

test("calories: negative set count is clamped to zero", () => {
  assert.equal(estimateStrengthCalories(-3, 70).calories_burned, 0);
});
