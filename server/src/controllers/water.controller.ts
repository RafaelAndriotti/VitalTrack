import { Response } from "express";
import { randomUUID } from "node:crypto";
import { AuthRequest } from "../middlewares/auth.js";
import { db } from "../config/db.js";

// GET /api/water?date=YYYY-MM-DD
export async function getWater(req: AuthRequest, res: Response): Promise<void> {
  try {
    const date =
      (req.query.date as string) || new Date().toISOString().split("T")[0];

    const data = db
      .prepare("SELECT * FROM daily_water WHERE user_id = ? AND date = ?")
      .get(req.userId!, date) as
      | { goal_ml: number; amount_ml: number }
      | undefined;

    // Se não existe registro para o dia, retornamos um default
    if (!data) {
      // Busca a última meta de água configurada pelo usuário
      const lastRecord = db
        .prepare(
          "SELECT goal_ml FROM daily_water WHERE user_id = ? ORDER BY date DESC LIMIT 1"
        )
        .get(req.userId!) as { goal_ml: number } | undefined;

      res.json({
        user_id: req.userId,
        date,
        amount_ml: 0,
        goal_ml: lastRecord ? lastRecord.goal_ml : 2000,
      });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error("Get water error:", (err as Error).message);
    res.status(500).json({ error: "Failed to fetch daily water" });
  }
}

// POST /api/water
// Cria ou atualiza o registro do dia (Upsert atômico via UNIQUE(user_id, date))
export async function upsertWater(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { date, amount_ml, goal_ml } = req.body;
    const targetDate = date || new Date().toISOString().split("T")[0];

    // goal_ml must be positive — a 0/negative goal persists and later causes
    // division-by-zero (NaN/Infinity) in the hydration progress bar.
    if (goal_ml !== undefined && (typeof goal_ml !== "number" || goal_ml <= 0)) {
      res.status(400).json({ error: "goal_ml must be a positive number" });
      return;
    }
    // amount_ml cannot be negative.
    if (
      amount_ml !== undefined &&
      (typeof amount_ml !== "number" || amount_ml < 0)
    ) {
      res.status(400).json({ error: "amount_ml must be a non-negative number" });
      return;
    }

    // New rows fall back to 0 / 2000. On conflict, COALESCE(@param, current)
    // keeps the existing value when the field is not sent — preserving the
    // "don't overwrite" semantics of the original select-then-update code.
    // The named params are shared across the whole statement, so the UPDATE
    // clause reads the raw (possibly null) value, not the defaulted one.
    db.prepare(
      `INSERT INTO daily_water (id, user_id, date, amount_ml, goal_ml)
       VALUES (@id, @user_id, @date, COALESCE(@amount_ml, 0), COALESCE(@goal_ml, 2000))
       ON CONFLICT(user_id, date) DO UPDATE SET
         amount_ml = COALESCE(@amount_ml, daily_water.amount_ml),
         goal_ml   = COALESCE(@goal_ml, daily_water.goal_ml)`
    ).run({
      id: randomUUID(),
      user_id: req.userId!,
      date: targetDate,
      amount_ml: amount_ml ?? null,
      goal_ml: goal_ml ?? null,
    });

    const result = db
      .prepare("SELECT * FROM daily_water WHERE user_id = ? AND date = ?")
      .get(req.userId!, targetDate);

    res.json(result);
  } catch (err) {
    console.error("Update water error:", (err as Error).message);
    res.status(500).json({ error: "Failed to update daily water" });
  }
}
