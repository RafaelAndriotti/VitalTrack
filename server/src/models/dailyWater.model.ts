import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

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

export const dailyWaterModel = {
  findByDate(userId: string, date: string): DailyWaterRow | undefined {
    return selectByUserAndDate.get(userId, date) as DailyWaterRow | undefined;
  },

  /** Goal from the user's most recent record, if any. */
  findLatestGoal(userId: string): number | undefined {
    const row = selectLatestGoal.get(userId) as { goal_ml: number } | undefined;
    return row?.goal_ml;
  },

  /** Atomic upsert via UNIQUE(user_id, date); undefined means "keep current". */
  upsert(
    userId: string,
    date: string,
    amountMl: number | undefined,
    goalMl: number | undefined
  ): void {
    upsertWater.run({
      id: randomUUID(),
      user_id: userId,
      date,
      amount_ml: amountMl ?? null,
      goal_ml: goalMl ?? null,
    });
  },
};
