import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface MealRow {
  id: string;
  user_id: string;
  name: string;
  date: string;
  time: string | null;
  created_at: string;
  updated_at: string;
}

const selectOwnedById = db.prepare(
  "SELECT * FROM meals WHERE id = ? AND user_id = ?"
);
const selectOwnedIdOnly = db.prepare(
  "SELECT id FROM meals WHERE id = ? AND user_id = ?"
);
const selectByUserAndDate = db.prepare(
  "SELECT * FROM meals WHERE user_id = ? AND date = ? ORDER BY created_at ASC"
);
const selectByUser = db.prepare(
  "SELECT * FROM meals WHERE user_id = ? ORDER BY created_at ASC"
);
const insertMeal = db.prepare(
  "INSERT INTO meals (id, user_id, name, date, time) VALUES (?, ?, ?, ?, ?)"
);
// Partial update: keep current column value when the client omits a field.
const updateMeal = db.prepare(
  `UPDATE meals
   SET name = COALESCE(@name, name),
       date = COALESCE(@date, date),
       time = COALESCE(@time, time)
   WHERE id = @id AND user_id = @user_id`
);
const deleteOwned = db.prepare("DELETE FROM meals WHERE id = ? AND user_id = ?");

export const mealModel = {
  /** Owner-scoped lookup: undefined if the meal is not the user's. */
  findOwned(id: string, userId: string): MealRow | undefined {
    return selectOwnedById.get(id, userId) as MealRow | undefined;
  },

  // Verify ownership before touching child rows (IDOR guard).
  ownsMeal(mealId: string, userId: string): boolean {
    return !!selectOwnedIdOnly.get(mealId, userId);
  },

  /** All of the user's meals, optionally filtered by date. */
  listByUser(userId: string, date?: string): MealRow[] {
    return (
      date ? selectByUserAndDate.all(userId, date) : selectByUser.all(userId)
    ) as MealRow[];
  },

  /** Inserts and returns the new id. */
  create(
    userId: string,
    name: string,
    date: string,
    time: string | null | undefined
  ): string {
    const id = randomUUID();
    insertMeal.run(id, userId, name, date, time || null);
    return id;
  },

  /** Returns true if a row owned by the user was updated. */
  update(
    id: string,
    userId: string,
    name: string | null | undefined,
    date: string | null | undefined,
    time: string | null | undefined
  ): boolean {
    const info = updateMeal.run({
      id,
      user_id: userId,
      name: name ?? null,
      date: date ?? null,
      time: time ?? null,
    });
    return info.changes > 0;
  },

  /** Returns true if a row owned by the user was deleted. */
  delete(id: string, userId: string): boolean {
    return deleteOwned.run(id, userId).changes > 0;
  },
};
