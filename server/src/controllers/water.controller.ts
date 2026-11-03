import { dailyWaterModel } from "../models/dailyWater.model.js";
import { renderWater, renderDefaultWater } from "../views/water.view.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { today } from "../utils/date.js";

interface UpsertWaterBody {
  date?: string;
  amount_ml?: number;
  goal_ml?: number;
}

// GET /api/water?date=YYYY-MM-DD
export const getWater = asyncHandler(
  async (req, res) => {
    const date = (req.query.date as string) || today();

    const data = dailyWaterModel.findByDate(req.userId!, date);

    // Se não existe registro para o dia, retornamos um default
    if (!data) {
      // Busca a última meta de água configurada pelo usuário
      const latestGoal = dailyWaterModel.findLatestGoal(req.userId!);
      res.json(renderDefaultWater(req.userId, date, latestGoal));
      return;
    }

    res.json(renderWater(data));
  },
  "Get water error",
  "Failed to fetch daily water"
);

// POST /api/water
// Cria ou atualiza o registro do dia (Upsert atômico via UNIQUE(user_id, date))
export const upsertWater = asyncHandler(
  async (req, res) => {
    const { date, amount_ml, goal_ml } = req.body as UpsertWaterBody;
    const targetDate = date || today();

    // goal_ml must be positive — a 0/negative goal persists and later causes
    // division-by-zero (NaN/Infinity) in the hydration progress bar.
    if (goal_ml !== undefined && (typeof goal_ml !== "number" || goal_ml <= 0)) {
      throw new HttpError(400, "goal_ml must be a positive number");
    }
    // amount_ml cannot be negative.
    if (
      amount_ml !== undefined &&
      (typeof amount_ml !== "number" || amount_ml < 0)
    ) {
      throw new HttpError(400, "amount_ml must be a non-negative number");
    }

    dailyWaterModel.upsert(req.userId!, targetDate, amount_ml, goal_ml);

    const result = dailyWaterModel.findByDate(req.userId!, targetDate)!;
    res.json(renderWater(result));
  },
  "Update water error",
  "Failed to update daily water"
);
