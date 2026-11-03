import type { DailyWaterRow } from "../models/dailyWater.model.js";

export interface DefaultWaterResponse {
  user_id: string | undefined;
  date: string;
  amount_ml: number;
  goal_ml: number;
}

export type WaterResponse = DailyWaterRow | DefaultWaterResponse;

export function renderWater(row: DailyWaterRow): DailyWaterRow {
  return row;
}

/** Shape returned when the day has no record yet (goal: last known or 2000). */
export function renderDefaultWater(
  userId: string | undefined,
  date: string,
  latestGoal: number | undefined
): DefaultWaterResponse {
  return {
    user_id: userId,
    date,
    amount_ml: 0,
    goal_ml: latestGoal !== undefined ? latestGoal : 2000,
  };
}
