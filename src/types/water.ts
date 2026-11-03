export interface DailyWater {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  goal_ml: number;
}

export interface SaveWaterPayload {
  date: string;
  amount_ml?: number;
  goal_ml?: number;
}
