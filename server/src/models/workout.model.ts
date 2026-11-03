import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { today } from "../utils/date.js";

export interface WorkoutRow {
  id: string;
  user_id: string;
  name: string;
  date: string;
  completed: number;
  notes: string | null;
  muscle_groups: string | null;
  created_at: string;
  updated_at: string;
}

/** muscle_groups arrives as an array or a raw string; stored as CSV. */
export type MuscleGroupsInput = string[] | string | null | undefined;

export interface CreateWorkoutInput {
  userId: string;
  name: string;
  date?: string | null;
  completed?: unknown;
  notes?: string | null;
  muscleGroups?: MuscleGroupsInput;
}

export interface UpdateWorkoutInput {
  id: string;
  userId: string;
  name?: string | null;
  date?: string | null;
  notes?: string | null;
  completed?: unknown;
  muscleGroups?: MuscleGroupsInput;
}

const selectOwnedById = db.prepare(
  "SELECT * FROM workouts WHERE id = ? AND user_id = ?"
);
const selectOwnedIdOnly = db.prepare(
  "SELECT id FROM workouts WHERE id = ? AND user_id = ?"
);
const selectByUser = db.prepare(
  "SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC"
);
const insertWorkout = db.prepare(
  "INSERT INTO workouts (id, user_id, name, date, completed, notes, muscle_groups) VALUES (?, ?, ?, ?, ?, ?, ?)"
);
// Partial update: COALESCE keeps the current column value when the client
// omits a field (front sends partial payloads like { completed: true }).
const updateWorkout = db.prepare(
  `UPDATE workouts
   SET name = COALESCE(@name, name),
       date = COALESCE(@date, date),
       notes = COALESCE(@notes, notes),
       completed = COALESCE(@completed, completed),
       muscle_groups = COALESCE(@muscle_groups, muscle_groups)
   WHERE id = @id AND user_id = @user_id`
);
const deleteOwned = db.prepare(
  "DELETE FROM workouts WHERE id = ? AND user_id = ?"
);

export const workoutModel = {
  /** Owner-scoped lookup: undefined if the workout is not the user's. */
  findOwned(input: { id: string; userId: string }): WorkoutRow | undefined {
    return selectOwnedById.get(input.id, input.userId) as WorkoutRow | undefined;
  },

  listByUser(userId: string): WorkoutRow[] {
    return selectByUser.all(userId) as WorkoutRow[];
  },

  // Confirm the workout belongs to the user before touching child rows (IDOR guard).
  ownsWorkout(input: { workoutId: string; userId: string }): boolean {
    return !!selectOwnedIdOnly.get(input.workoutId, input.userId);
  },

  /** Inserts and returns the new id. */
  create(input: CreateWorkoutInput): string {
    const id = randomUUID();
    insertWorkout.run(
      id,
      input.userId,
      input.name,
      input.date || today(),
      input.completed ? 1 : 0,
      input.notes || null,
      Array.isArray(input.muscleGroups)
        ? input.muscleGroups.join(",")
        : input.muscleGroups || null
    );
    return id;
  },

  /** Returns true if a row owned by the user was updated. */
  update(input: UpdateWorkoutInput): boolean {
    const info = updateWorkout.run({
      id: input.id,
      user_id: input.userId,
      name: input.name ?? null,
      date: input.date ?? null,
      notes: input.notes ?? null,
      completed: input.completed === undefined ? null : input.completed ? 1 : 0,
      muscle_groups: Array.isArray(input.muscleGroups)
        ? input.muscleGroups.join(",")
        : input.muscleGroups ?? null,
    });
    return info.changes > 0;
  },

  /** Returns true if a row owned by the user was deleted. */
  delete(input: { id: string; userId: string }): boolean {
    return deleteOwned.run(input.id, input.userId).changes > 0;
  },
};
