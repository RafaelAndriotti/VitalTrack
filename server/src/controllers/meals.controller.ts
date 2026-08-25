import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.js";
import { supabase } from "../config/supabase.js";

// GET /api/meals/library/foods — list global and user's food
export async function listFoodLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { data, error } = await supabase
      .from("food_library")
      .select("*")
      .or(`user_id.eq.${req.userId},user_id.is.null`)
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("List food library error:", err);
    res.status(500).json({ error: "Failed to fetch food library" });
  }
}

// POST /api/meals/library/foods — add food to library
export async function createFoodLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, calories, protein, carbs, fat, serving_size } = req.body;
    if (!name) {
      res.status(400).json({ error: "Food name is required" });
      return;
    }

    const { data, error } = await supabase
      .from("food_library")
      .insert({
        user_id: req.userId!,
        name,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
        serving_size: serving_size || 100,
      })
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Create food library error:", err);
    res.status(500).json({ error: "Failed to create food in library" });
  }
}

// DELETE /api/meals/library/foods/:id — delete user's food
export async function deleteFoodLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const { error, count } = await supabase
      .from("food_library")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", req.userId!);

    if (error) throw error;
    if (count === 0) {
      res.status(404).json({ error: "Food not found or cannot be deleted" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete food library error:", err);
    res.status(500).json({ error: "Failed to delete food from library" });
  }
}

// GET /api/meals — list user's meals with meal items (optional ?date=YYYY-MM-DD filter)
export async function listMeals(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { date } = req.query;

    let query = supabase
      .from("meals")
      .select("*, meal_items(*)")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: true });

    if (date && typeof date === "string") {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("List meals error:", err);
    res.status(500).json({ error: "Failed to fetch meals" });
  }
}

// POST /api/meals — create a meal
export async function createMeal(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, date, time } = req.body;

    if (!name) {
      res.status(400).json({ error: "Meal name is required" });
      return;
    }

    const { data, error } = await supabase
      .from("meals")
      .insert({
        user_id: req.userId!,
        name,
        date: date || new Date().toISOString().split("T")[0],
        time: time || null,
      })
      .select("*, meal_items(*)")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Create meal error:", err);
    res.status(500).json({ error: "Failed to create meal" });
  }
}

// PUT /api/meals/:id — update a meal
export async function updateMeal(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, date, time } = req.body;

    const { data, error } = await supabase
      .from("meals")
      .update({ name, date, time })
      .eq("id", id)
      .eq("user_id", req.userId!)
      .select("*, meal_items(*)")
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error("Update meal error:", err);
    res.status(500).json({ error: "Failed to update meal" });
  }
}

// DELETE /api/meals/:id — delete a meal
export async function deleteMeal(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const { error, count } = await supabase
      .from("meals")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", req.userId!);

    if (error) throw error;

    if (count === 0) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete meal error:", err);
    res.status(500).json({ error: "Failed to delete meal" });
  }
}

// POST /api/meals/:id/items — add food item to meal
export async function addMealItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id: mealId } = req.params;
    const { name, amount, calories, protein, carbs, fat } = req.body;

    if (!name) {
      res.status(400).json({ error: "Food name is required" });
      return;
    }

    // Verify ownership
    const { data: meal } = await supabase
      .from("meals")
      .select("id")
      .eq("id", mealId)
      .eq("user_id", req.userId!)
      .single();

    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    const { data, error } = await supabase
      .from("meal_items")
      .insert({
        meal_id: mealId,
        name,
        amount: amount || 100,
        calories: calories || 0,
        protein: protein || 0,
        carbs: carbs || 0,
        fat: fat || 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Add food item error:", err);
    res.status(500).json({ error: "Failed to add food item" });
  }
}

// PUT /api/meals/:id/items/:itemId — update food item
export async function updateMealItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id: mealId, itemId } = req.params;
    const { name, amount, calories, protein, carbs, fat } = req.body;

    // Verify ownership
    const { data: meal } = await supabase
      .from("meals")
      .select("id")
      .eq("id", mealId)
      .eq("user_id", req.userId!)
      .single();

    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    const { data, error } = await supabase
      .from("meal_items")
      .update({ name, amount, calories, protein, carbs, fat })
      .eq("id", itemId)
      .eq("meal_id", mealId)
      .select("*")
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error("Update food item error:", err);
    res.status(500).json({ error: "Failed to update food item" });
  }
}

// DELETE /api/meals/:id/items/:itemId — delete food item
export async function deleteMealItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id: mealId, itemId } = req.params;

    // Verify ownership
    const { data: meal } = await supabase
      .from("meals")
      .select("id")
      .eq("id", mealId)
      .eq("user_id", req.userId!)
      .single();

    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    const { error, count } = await supabase
      .from("meal_items")
      .delete({ count: "exact" })
      .eq("id", itemId)
      .eq("meal_id", mealId);

    if (error) throw error;

    if (count === 0) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete food item error:", err);
    res.status(500).json({ error: "Failed to delete food item" });
  }
}
