import { z } from "zod";
import { bodyObject, isoDate, optionalDate } from "./common.js";

// ---- query ----
export const getWaterQuery = z.object({
  date: z.preprocess((v) => (v === "" ? undefined : v), isoDate("date").optional()),
});

// ---- body ----
// goal_ml comes first: when both are invalid its message is reported first,
// matching the order of the previous manual checks. Null is NOT accepted for
// these two fields (it was a 400 before as well).
const GOAL_MSG = "goal_ml must be a positive number";
const AMOUNT_MSG = "amount_ml must be a non-negative number";
const WATER_MAX = 50_000;
const goalTooBig = `goal_ml must be less than or equal to ${WATER_MAX}`;
const amountTooBig = `amount_ml must be less than or equal to ${WATER_MAX}`;

export const upsertWaterBody = bodyObject({
  goal_ml: z.number({ error: GOAL_MSG }).gt(0, GOAL_MSG).max(WATER_MAX, goalTooBig).optional(),
  amount_ml: z.number({ error: AMOUNT_MSG }).min(0, AMOUNT_MSG).max(WATER_MAX, amountTooBig).optional(),
  date: optionalDate(),
});

export type GetWaterQuery = z.infer<typeof getWaterQuery>;
export type UpsertWaterBody = z.infer<typeof upsertWaterBody>;
