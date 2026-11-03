import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface FoodLibraryRow {
  id: string;
  user_id: string | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
  created_at: string;
  updated_at: string;
}

export interface CreateFoodInput {
  userId: string;
  name: string;
  calories?: number | null;
  protein?: number | null;
  carbs?: number | null;
  fat?: number | null;
  servingSize?: number | null;
}

const selectVisible = db.prepare(
  `SELECT * FROM food_library
   WHERE user_id = ? OR user_id IS NULL
   ORDER BY name ASC`
);
const selectById = db.prepare("SELECT * FROM food_library WHERE id = ?");
const insertFood = db.prepare(
  `INSERT INTO food_library (id, user_id, name, calories, protein, carbs, fat, serving_size)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
);
// Only the user's own rows (user_id = ? excludes globals, which have NULL).
const deleteOwned = db.prepare(
  "DELETE FROM food_library WHERE id = ? AND user_id = ?"
);

export const foodLibraryModel = {
  /** Global entries plus the user's own. */
  listVisibleToUser(userId: string): FoodLibraryRow[] {
    return selectVisible.all(userId) as FoodLibraryRow[];
  },

  findById(id: string): FoodLibraryRow | undefined {
    return selectById.get(id) as FoodLibraryRow | undefined;
  },

  /** Inserts and returns the new id. */
  create(input: CreateFoodInput): string {
    const id = randomUUID();
    insertFood.run(
      id,
      input.userId,
      input.name,
      input.calories || 0,
      input.protein || 0,
      input.carbs || 0,
      input.fat || 0,
      input.servingSize || 100
    );
    return id;
  },

  /** Only allow deleting user's own entries (user_id = ? excludes globals). */
  deleteOwned(input: { id: string; userId: string }): boolean {
    return deleteOwned.run(input.id, input.userId).changes > 0;
  },
};
