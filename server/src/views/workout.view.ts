import type { WorkoutRow } from "../models/workout.model.js";
import type { ExerciseRow } from "../models/exercise.model.js";
import type { ExerciseSetRow } from "../models/exerciseSet.model.js";
import type { ExerciseLibraryRow } from "../models/exerciseLibrary.model.js";
import {
  estimateStrengthCalories,
  type CaloriesEstimate,
} from "../utils/calories.js";

export type ExerciseSetResponse = Omit<ExerciseSetRow, "completed"> & {
  completed: boolean;
};

export type ExerciseResponse = ExerciseRow;

export type ExerciseWithSetsResponse = ExerciseRow & {
  exercise_sets: ExerciseSetResponse[];
};

export type WorkoutResponse = Omit<WorkoutRow, "completed" | "muscle_groups"> & {
  completed: boolean;
  muscle_groups: string[];
  exercises: ExerciseWithSetsResponse[];
} & CaloriesEstimate;

/** An exercise row together with its (already loaded) set rows. */
export interface ExerciseTree {
  exercise: ExerciseRow;
  sets: ExerciseSetRow[];
}

// SQLite stores booleans as 0/1; the front-end expects real booleans.
export function renderSet(set: ExerciseSetRow): ExerciseSetResponse {
  return { ...set, completed: !!set.completed };
}

export function renderExercise(exercise: ExerciseRow): ExerciseResponse {
  return exercise;
}

export function renderExerciseWithSets(
  exercise: ExerciseRow,
  sets: ExerciseSetRow[]
): ExerciseWithSetsResponse {
  return { ...exercise, exercise_sets: sets.map(renderSet) };
}

// Normalize 0/1 to boolean, CSV muscle_groups to string[], nest exercises
// (with their sets) under the workout, and attach the calorie estimate
// computed from the completed sets and the user's body weight.
export function renderWorkout(
  workout: WorkoutRow,
  exercises: ExerciseTree[],
  userWeightKg: number | null
): WorkoutResponse {
  const completedSets = exercises.reduce(
    (n, e) => n + e.sets.filter((s) => !!s.completed).length,
    0
  );
  return {
    ...workout,
    completed: !!workout.completed,
    muscle_groups: workout.muscle_groups
      ? String(workout.muscle_groups).split(",").filter(Boolean)
      : [],
    exercises: exercises.map((e) => renderExerciseWithSets(e.exercise, e.sets)),
    ...estimateStrengthCalories(completedSets, userWeightKg),
  };
}

export function renderExerciseLibraryEntry(
  entry: ExerciseLibraryRow
): ExerciseLibraryRow {
  return entry;
}

export function renderExerciseLibrary(
  entries: ExerciseLibraryRow[]
): ExerciseLibraryRow[] {
  return entries.map(renderExerciseLibraryEntry);
}
