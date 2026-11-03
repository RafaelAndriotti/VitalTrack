import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface MealItemRow {
  id: string;
  meal_id: string;
  name: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  updated_at: string;
}

export interface MealItemFields {
  name?: string | null;
  amount?: number | null;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
}

export interface CreateMealItemInput extends MealItemFields {
  mealId: string;
  name: string;
}

export interface UpdateMealItemInput extends MealItemFields {
  itemId: string;
  mealId: string;
}

const selectByMeal =db.prepare(
  "SELECT * FROM meal_items WHERE meal_id = ? ORDER BY created_at ASC"
);
const selectById = db.prepare("SELECT * FROM meal_items WHERE id = ?");
const insertItem = db.prepare(
  `INSERT INTO meal_items (id, meal_id, name, amount, calories, protein, carbs, fat)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
// Partial update: keep current column value when the client omits a field.
const updateItem = db.prepare(
  `UPDATE meal_items
   SET name = COALESCE(@name, name),
       amount = COALESCE(@amount, amount),
       calories = COALESCE(@calories, calories),
       protein = COALESCE(@protein, protein),
       carbs = COALESCE(@carbs, carbs),
       fat = COALESCE(@fat, fat)
   WHERE id = @itemId AND meal_id = @mealId`
);
const deleteInMeal = db.prepare(
  "DELETE FROM meal_items WHERE id = ? AND meal_id = ?"
);

export const mealItemModel = {
  listByMeal(mealId: string): MealItemRow[] {
    return selectByMeal.all(mealId) as MealItemRow[];
  },

  findById(id: string): MealItemRow | undefined {
    return selectById.get(id) as MealItemRow | undefined;
  },

  /** Inserts and returns the new id. Caller must have verified meal ownership. */
  create(fields: CreateMealItemInput): string {
    const id = randomUUID();
    insertItem.run(
      id,
      fields.mealId,
      fields.name,
      fields.amount || 100,
      fields.calories || 0,
      fields.protein || 0,
      fields.carbs || 0,
      fields.fat || 0
    );
    return id;
  },

  /** Returns true if a row was updated. Caller must have verified meal ownership. */
  update(fields: UpdateMealItemInput): boolean {
    const info = updateItem.run({
      itemId: fields.itemId,
      mealId: fields.mealId,
      name: fields.name ?? null,
      amount: fields.amount ?? null,
      calories: fields.calories ?? null,
      protein: fields.protein ?? null,
      carbs: fields.carbs ?? null,
      fat: fields.fat ?? null,
    });
    return info.changes > 0;
  },

  /** Returns true if a row was deleted. Caller must have verified meal ownership. */
  delete(input: { itemId: string; mealId: string }): boolean {
    return deleteInMeal.run(input.itemId, input.mealId).changes > 0;
  },
};
