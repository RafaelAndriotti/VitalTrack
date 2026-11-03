import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { today } from "../utils/date.js";

export interface DailyWaterRow {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  goal_ml: number;
  created_at: string;
  updated_at: string;
}

const selectByUserAndDate = db.prepare(
  "SELECT * FROM daily_water WHERE user_id = ? AND date = ?"
);
const selectLatestGoal = db.prepare(
  "SELECT goal_ml FROM daily_water WHERE user_id = ? ORDER BY date DESC LIMIT 1"
);
// New rows fall back to 0 / 2000. On conflict, COALESCE(@param, current)
// keeps the existing value when the field is not sent — preserving the
// "don't overwrite" semantics of the original select-then-update code.
// The named params are shared across the whole statement, so the UPDATE
// clause reads the raw (possibly null) value, not the defaulted one.
const upsertWater = db.prepare(
  `INSERT INTO daily_water (id, user_id, date, amount_ml, goal_ml)
   VALUES (@id, @user_id, @date, COALESCE(@amount_ml, 0), COALESCE(@goal_ml, 2000))
   ON CONFLICT(user_id, date) DO UPDATE SET
     amount_ml = COALESCE(@amount_ml, daily_water.amount_ml),
     goal_ml   = COALESCE(@goal_ml, daily_water.goal_ml)`
);

export interface WaterDay {
  date: string;
  /** undefined when the day has no record yet. */
  row: DailyWaterRow | undefined;
  /** Goal from the user's most recent record; only looked up when row is missing. */
  latestGoal: number | undefined;
}

export interface UpsertWaterInput {
  userId: string;
  date?: string;
  amountMl?: number;
  goalMl?: number;
}

export const dailyWaterModel = {
  /** Record for the day (default: today) plus the fallback goal when absent. */
  getDay(input: { userId: string; date?: string }): WaterDay {
    const date = input.date || today();
    const row = selectByUserAndDate.get(input.userId, date) as
      | DailyWaterRow
      | undefined;
    const latestGoal = row
      ? undefined
      : (selectLatestGoal.get(input.userId) as { goal_ml: number } | undefined)
          ?.goal_ml;
    return { date, row, latestGoal };
  },

  /**
   * Atomic upsert via UNIQUE(user_id, date); undefined amount/goal means
   * "keep current". Date defaults to today. Returns the stored row.
   */
  upsert(input: UpsertWaterInput): DailyWaterRow | undefined {
    const date = input.date || today();
    upsertWater.run({
      id: randomUUID(),
      user_id: input.userId,
      date,
      amount_ml: input.amountMl ?? null,
      goal_ml: input.goalMl ?? null,
    });
    return selectByUserAndDate.get(input.userId, date) as DailyWaterRow | undefined;
  },
};
