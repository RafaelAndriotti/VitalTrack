import { dailyWaterModel } from "../models/dailyWater.model.js";
import { renderWater, renderDefaultWater } from "../views/water.view.js";
import { validatedBody, validatedQuery } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireUserId } from "../utils/requireUserId.js";
import { requireFound } from "../utils/requireFound.js";
import { getWaterQuery, upsertWaterBody } from "../validators/water.validator.js";

// GET /api/water?date=YYYY-MM-DD
export const getWater = asyncHandler(
  async (req, res) => {
    const userId = requireUserId(req);

    const { date, row, latestGoal } = dailyWaterModel.getDay({
      userId,
      date: validatedQuery(res, getWaterQuery).date,
    });

    // Se não existe registro para o dia, retornamos um default
    // (com a última meta de água configurada pelo usuário, se houver)
    if (!row) {
      res.json(renderDefaultWater(userId, date, latestGoal));
      return;
    }

    res.json(renderWater(row));
  },
  "Get water error",
  "Failed to fetch daily water"
);

// POST /api/water
// Cria ou atualiza o registro do dia (Upsert atômico via UNIQUE(user_id, date))
export const upsertWater = asyncHandler(
  async (req, res) => {
    const userId = requireUserId(req);
    const { date, amount_ml, goal_ml } = validatedBody(req, upsertWaterBody);

    // upsertWaterBody guarantees goal_ml > 0 (a 0/negative goal would cause a
    // division by zero in the app's progress bar) and amount_ml >= 0.
    const result = requireFound(
      dailyWaterModel.upsert({
        userId,
        date,
        amountMl: amount_ml,
        goalMl: goal_ml,
      })
    );
    res.json(renderWater(result));
  },
  "Update water error",
  "Failed to update daily water"
);
