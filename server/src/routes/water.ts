import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth.js";
import { supabase } from "../db.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/water?date=YYYY-MM-DD
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const date = req.query.date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_water")
      .select("*")
      .eq("user_id", req.userId!)
      .eq("date", date)
      .maybeSingle(); // pode não existir ainda

    if (error) throw error;

    // Se não existe registro para o dia, retornamos um default
    if (!data) {
      // Busca a última meta de água configurada pelo usuário
      const { data: lastRecord } = await supabase
        .from("daily_water")
        .select("goal_ml")
        .eq("user_id", req.userId!)
        .order("date", { ascending: false })
        .limit(1)
        .maybeSingle();

      return res.json({
        user_id: req.userId,
        date,
        amount_ml: 0,
        goal_ml: lastRecord ? lastRecord.goal_ml : 2000
      });
    }

    res.json(data);
  } catch (err) {
    console.error("Get water error:", err);
    res.status(500).json({ error: "Failed to fetch daily water" });
  }
});

// POST /api/water
// Cria ou atualiza o registro do dia (Upsert)
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { date, amount_ml, goal_ml } = req.body;
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Verifica se já existe
    const { data: existing } = await supabase
      .from("daily_water")
      .select("id")
      .eq("user_id", req.userId!)
      .eq("date", targetDate)
      .maybeSingle();

    let result;

    if (existing) {
      // Atualiza
      const { data, error } = await supabase
        .from("daily_water")
        .update({
          amount_ml: amount_ml !== undefined ? amount_ml : undefined,
          goal_ml: goal_ml !== undefined ? goal_ml : undefined
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Cria novo
      const { data, error } = await supabase
        .from("daily_water")
        .insert({
          user_id: req.userId!,
          date: targetDate,
          amount_ml: amount_ml || 0,
          goal_ml: goal_ml || 2000
        })
        .select("*")
        .single();
        
      if (error) throw error;
      result = data;
    }

    res.json(result);
  } catch (err) {
    console.error("Update water error:", err);
    res.status(500).json({ error: "Failed to update daily water" });
  }
});

export default router;
