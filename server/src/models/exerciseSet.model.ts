import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface ExerciseSetRow {
  id: string;
  exercise_id: string;
  weight: number | null;
  reps: number | null;
  completed: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSetInput {
  exerciseId: string;
  weight?: number;
  reps?: number;
  completed?: unknown;
  orderIndex?: number;
}

export interface UpdateSetInput {
  setId: string;
  exerciseId: string;
  weight?: number | null;
  reps?: number | null;
  completed?: unknown;
  orderIndex?: number | null;
}

const selectByExercise = db.prepare(
  "SELECT * FROM exercise_sets WHERE exercise_id = ? ORDER BY order_index ASC"
);
const selectById = db.prepare("SELECT * FROM exercise_sets WHERE id = ?");
const insertSet = db.prepare(
  `INSERT INTO exercise_sets (id, exercise_id, weight, reps, completed, order_index)
   VALUES (?, ?, ?, ?, ?, ?)`
);
// Partial update: the front edits one field at a time ({ weight },
// { reps }, { completed }). COALESCE preserves the untouched columns.
const updateSet = db.prepare(
  `UPDATE exercise_sets
   SET weight = COALESCE(@weight, weight),
       reps = COALESCE(@reps, reps),
       completed = COALESCE(@completed, completed),
       order_index = COALESCE(@order_index, order_index)
   WHERE id = @setId AND exercise_id = @exerciseId`
);
const deleteInExercise = db.prepare(
  "DELETE FROM exercise_sets WHERE id = ? AND exercise_id = ?"
);

export const exerciseSetModel = {
  listByExercise(exerciseId: string): ExerciseSetRow[] {
    return selectByExercise.all(exerciseId) as ExerciseSetRow[];
  },

  findById(id: string): ExerciseSetRow | undefined {
    return selectById.get(id) as ExerciseSetRow | undefined;
  },

  /** Inserts and returns the new id. Caller must have verified exercise ownership. */
  create(input: CreateSetInput): string {
    const id = randomUUID();
    insertSet.run(
      id,
      input.exerciseId,
      input.weight || 0,
      input.reps || 0,
      input.completed ? 1 : 0,
      input.orderIndex || 0
    );
    return id;
  },

  /** Returns true if a row was updated. Caller must have verified exercise ownership. */
  update(input: UpdateSetInput): boolean {
    const info = updateSet.run({
      setId: input.setId,
      exerciseId: input.exerciseId,
      weight: input.weight ?? null,
      reps: input.reps ?? null,
      completed: input.completed === undefined ? null : input.completed ? 1 : 0,
      order_index: input.orderIndex ?? null,
    });
    return info.changes > 0;
  },

  /** Returns true if a row was deleted. Caller must have verified exercise ownership. */
  delete(setId: string, exerciseId: string): boolean {
    return deleteInExercise.run(setId, exerciseId).changes > 0;
  },
};
