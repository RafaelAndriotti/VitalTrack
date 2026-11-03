import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { today } from "../utils/date.js";

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

export interface CreateMealInput {
  userId: string;
  name: string;
  date?: string | null;
  time?: string | null;
}

export interface UpdateMealInput {
  id: string;
  userId: string;
  name?: string | null;
  date?: string | null;
  time?: string | null;
}

export const mealModel = {
  /** Owner-scoped lookup: undefined if the meal is not the user's. */
  findOwned(input: { id: string; userId: string }): MealRow | undefined {
    return selectOwnedById.get(input.id, input.userId) as MealRow | undefined;
  },

  // Verify ownership before touching child rows (IDOR guard).
  ownsMeal(input: { mealId: string; userId: string }): boolean {
    return !!selectOwnedIdOnly.get(input.mealId, input.userId);
  },

  /** All of the user's meals, optionally filtered by date. */
  listByUser(input: { userId: string; date?: string }): MealRow[] {
    return (
      input.date
        ? selectByUserAndDate.all(input.userId, input.date)
        : selectByUser.all(input.userId)
    ) as MealRow[];
  },

  /** Inserts and returns the new id. Date defaults to today. */
  create(input: CreateMealInput): string {
    const id = randomUUID();
    insertMeal.run(
      id,
      input.userId,
      input.name,
      input.date || today(),
      input.time || null
    );
    return id;
  },

  /** Returns true if a row owned by the user was updated. */
  update(input: UpdateMealInput): boolean {
    const info = updateMeal.run({
      id: input.id,
      user_id: input.userId,
      name: input.name ?? null,
      date: input.date ?? null,
      time: input.time ?? null,
    });
    return info.changes > 0;
  },

  /** Returns true if a row owned by the user was deleted. */
  delete(input: { id: string; userId: string }): boolean {
    return deleteOwned.run(input.id, input.userId).changes > 0;
  },
};
