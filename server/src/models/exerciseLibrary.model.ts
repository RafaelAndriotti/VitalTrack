import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface ExerciseLibraryRow {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string | null;
  created_at: string;
  updated_at: string;
}

const selectVisible = db.prepare(
  `SELECT * FROM exercise_library
   WHERE user_id = ? OR user_id IS NULL
   ORDER BY name ASC`
);
const selectById = db.prepare("SELECT * FROM exercise_library WHERE id = ?");
const insertEntry = db.prepare(
  "INSERT INTO exercise_library (id, user_id, name, muscle_group) VALUES (?, ?, ?, ?)"
);
// Only the user's own rows (user_id = ? excludes globals, which have NULL).
const deleteOwned = db.prepare(
  "DELETE FROM exercise_library WHERE id = ? AND user_id = ?"
);

export const exerciseLibraryModel = {
  /** Global entries plus the user's own. */
  listVisibleToUser(userId: string): ExerciseLibraryRow[] {
    return selectVisible.all(userId) as ExerciseLibraryRow[];
  },

  findById(id: string): ExerciseLibraryRow | undefined {
    return selectById.get(id) as ExerciseLibraryRow | undefined;
  },

  /** Inserts and returns the new id. */
  create(input: {
    userId: string;
    name: string;
    muscleGroup?: string | null;
  }): string {
    const id = randomUUID();
    insertEntry.run(id, input.userId, input.name, input.muscleGroup || null);
    return id;
  },

  /** Only allow deleting user's own entries (user_id = ? excludes globals). */
  deleteOwned(input: { id: string; userId: string }): boolean {
    return deleteOwned.run(input.id, input.userId).changes > 0;
  },
};
