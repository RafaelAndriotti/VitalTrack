import { Response } from "express";
import { randomUUID } from "node:crypto";
import { AuthRequest } from "../middlewares/auth.js";
import { db } from "../config/db.js";

// Load a meal with its items, scoped to the owner. Returns undefined if the
// meal does not belong to the user (used both for reads and 404s).
function getMealWithItems(mealId: string, userId: string) {
  const meal = db
    .prepare("SELECT * FROM meals WHERE id = ? AND user_id = ?")
    .get(mealId, userId) as Record<string, unknown> | undefined;
  if (!meal) return undefined;
  meal.meal_items = db
    .prepare("SELECT * FROM meal_items WHERE meal_id = ? ORDER BY created_at ASC")
    .all(mealId);
  return meal;
}

// GET /api/meals/library/foods — list global and user's food
export async function listFoodLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const data = db
      .prepare(
        `SELECT * FROM food_library
         WHERE user_id = ? OR user_id IS NULL
         ORDER BY name ASC`
      )
      .all(req.userId!);
    res.json(data);
  } catch (err) {
    console.error("List food library error:", (err as Error).message);
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

    const id = randomUUID();
    db.prepare(
      `INSERT INTO food_library (id, user_id, name, calories, protein, carbs, fat, serving_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      req.userId!,
      name,
      calories || 0,
      protein || 0,
      carbs || 0,
      fat || 0,
      serving_size || 100
    );

    const data = db.prepare("SELECT * FROM food_library WHERE id = ?").get(id);
    res.status(201).json(data);
  } catch (err) {
    console.error("Create food library error:", (err as Error).message);
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

    const info = db
      .prepare("DELETE FROM food_library WHERE id = ? AND user_id = ?")
      .run(id, req.userId!);

    if (info.changes === 0) {
      res.status(404).json({ error: "Food not found or cannot be deleted" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete food library error:", (err as Error).message);
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

    const meals = (
      date && typeof date === "string"
        ? db
            .prepare(
              "SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC"
            )
            .all(req.userId!, date)
        : db
            .prepare(
              "SELECT * FROM meals WHERE user_id = ? ORDER BY created_at ASC"
            )
            .all(req.userId!)
    ) as Record<string, unknown>[];

    const itemStmt = db.prepare(
      "SELECT * FROM meal_items WHERE meal_id = ? ORDER BY created_at ASC"
    );
    for (const meal of meals) {
      meal.meal_items = itemStmt.all(meal.id as string);
    }

    res.json(meals);
  } catch (err) {
    console.error("List meals error:", (err as Error).message);
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

    const id = randomUUID();
    db.prepare(
      "INSERT INTO meals (id, user_id, name, date, time) VALUES (?, ?, ?, ?, ?)"
    ).run(
      id,
      req.userId!,
      name,
      date || new Date().toISOString().split("T")[0],
      time || null
    );

    res.status(201).json(getMealWithItems(id, req.userId!));
  } catch (err) {
    console.error("Create meal error:", (err as Error).message);
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

    // Partial update: keep current column value when the client omits a field.
    const info = db
      .prepare(
        `UPDATE meals
         SET name = COALESCE(@name, name),
             date = COALESCE(@date, date),
             time = COALESCE(@time, time)
         WHERE id = @id AND user_id = @user_id`
      )
      .run({
        id,
        user_id: req.userId!,
        name: name ?? null,
        date: date ?? null,
        time: time ?? null,
      });

    if (info.changes === 0) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    res.json(getMealWithItems(id, req.userId!));
  } catch (err) {
    console.error("Update meal error:", (err as Error).message);
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

    const info = db
      .prepare("DELETE FROM meals WHERE id = ? AND user_id = ?")
      .run(id, req.userId!);

    if (info.changes === 0) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete meal error:", (err as Error).message);
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
    const meal = db
      .prepare("SELECT id FROM meals WHERE id = ? AND user_id = ?")
      .get(mealId, req.userId!);

    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO meal_items (id, meal_id, name, amount, calories, protein, carbs, fat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      mealId,
      name,
      amount || 100,
      calories || 0,
      protein || 0,
      carbs || 0,
      fat || 0
    );

    const data = db.prepare("SELECT * FROM meal_items WHERE id = ?").get(id);
    res.status(201).json(data);
  } catch (err) {
    console.error("Add food item error:", (err as Error).message);
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
    const meal = db
      .prepare("SELECT id FROM meals WHERE id = ? AND user_id = ?")
      .get(mealId, req.userId!);

    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    // Partial update: keep current column value when the client omits a field.
    const info = db
      .prepare(
        `UPDATE meal_items
         SET name = COALESCE(@name, name),
             amount = COALESCE(@amount, amount),
             calories = COALESCE(@calories, calories),
             protein = COALESCE(@protein, protein),
             carbs = COALESCE(@carbs, carbs),
             fat = COALESCE(@fat, fat)
         WHERE id = @itemId AND meal_id = @mealId`
      )
      .run({
        itemId,
        mealId,
        name: name ?? null,
        amount: amount ?? null,
        calories: calories ?? null,
        protein: protein ?? null,
        carbs: carbs ?? null,
        fat: fat ?? null,
      });

    if (info.changes === 0) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }

    const data = db.prepare("SELECT * FROM meal_items WHERE id = ?").get(itemId);
    res.json(data);
  } catch (err) {
    console.error("Update food item error:", (err as Error).message);
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
    const meal = db
      .prepare("SELECT id FROM meals WHERE id = ? AND user_id = ?")
      .get(mealId, req.userId!);

    if (!meal) {
      res.status(404).json({ error: "Meal not found" });
      return;
    }

    const info = db
      .prepare("DELETE FROM meal_items WHERE id = ? AND meal_id = ?")
      .run(itemId, mealId);

    if (info.changes === 0) {
      res.status(404).json({ error: "Food item not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete food item error:", (err as Error).message);
    res.status(500).json({ error: "Failed to delete food item" });
  }
}
