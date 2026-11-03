import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";

export interface ExerciseRow {
  id: string;
  workout_id: string;
  name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const selectByWorkout = db.prepare(
  "SELECT * FROM exercises WHERE workout_id = ? ORDER BY created_at ASC"
);
const selectById = db.prepare("SELECT * FROM exercises WHERE id = ?");
const insertExercise = db.prepare(
  "INSERT INTO exercises (id, workout_id, name, notes) VALUES (?, ?, ?, ?)"
);
const deleteInWorkout = db.prepare(
  "DELETE FROM exercises WHERE id = ? AND workout_id = ?"
);
const updateExercise = db.prepare(
  `UPDATE exercises
   SET name = COALESCE(@name, name), notes = COALESCE(@notes, notes)
   WHERE id = @exerciseId AND workout_id = @workoutId`
);
const selectOwnership = db.prepare(
  `SELECT e.id FROM exercises e
   JOIN workouts w ON w.id = e.workout_id
   WHERE e.id = ? AND e.workout_id = ? AND w.user_id = ?`
);

export const exerciseModel = {
  listByWorkout(workoutId: string): ExerciseRow[] {
    return selectByWorkout.all(workoutId) as ExerciseRow[];
  },

  findById(id: string): ExerciseRow | undefined {
    return selectById.get(id) as ExerciseRow | undefined;
  },

  // Confirm the exercise belongs to this workout AND the workout belongs to the
  // user. Guards the set operations so an exerciseId from a different workout
  // cannot be grafted onto this one (ownership-chain integrity).
  ownsExercise(exerciseId: string, workoutId: string, userId: string): boolean {
    return !!selectOwnership.get(exerciseId, workoutId, userId);
  },

  /** Inserts and returns the new id. Caller must have verified workout ownership. */
  create(workoutId: string, name: string, notes: string | null | undefined): string {
    const id = randomUUID();
    insertExercise.run(id, workoutId, name, notes || null);
    return id;
  },

  /** Returns true if a row was updated. Caller must have verified workout ownership. */
  update(
    exerciseId: string,
    workoutId: string,
    name: string | null | undefined,
    notes: string | null | undefined
  ): boolean {
    const info = updateExercise.run({
      exerciseId,
      workoutId,
      name: name ?? null,
      notes: notes ?? null,
    });
    return info.changes > 0;
  },

  /** Returns true if a row was deleted. Caller must have verified workout ownership. */
  delete(exerciseId: string, workoutId: string): boolean {
    return deleteInWorkout.run(exerciseId, workoutId).changes > 0;
  },
};
