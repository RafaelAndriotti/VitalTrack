import { z } from "zod";
import {
  bodyObject,
  idParam,
  nonNegative,
  nonNegativeInt,
  optionalBoolean,
  optionalDate,
  optionalNonEmptyString,
  optionalString,
  requiredString,
} from "./common.js";

// Notes are free text; 10k characters is plenty for a workout/exercise note.
const NOTES_MAX = 10_000;
// Plausibility ceilings: far above anything real, they only stop absurd values.
const WEIGHT_MAX = 2000;
const REPS_MAX = 10_000;
const ORDER_INDEX_MAX = 10_000;
const WORKOUT_NAME_REQUIRED = "Workout name is required";
const EXERCISE_NAME_REQUIRED = "Exercise name is required";

// ---- params ----
export const idParams = z.object({ id: idParam("id") });
export const exerciseParams = z.object({
  id: idParam("id"),
  exerciseId: idParam("exerciseId"),
});
export const setParams = z.object({
  id: idParam("id"),
  exerciseId: idParam("exerciseId"),
  setId: idParam("setId"),
});

// ---- workouts ----
// muscle_groups: array of strings (1-50 chars each, max 20 items), or a raw
// string (accepted for compatibility). Array items must not contain commas
// because the column stores them as CSV. Type errors report MUSCLE_GROUPS_TYPE;
// size errors have their own messages (checked in superRefine so the first
// message is deterministic).
const MUSCLE_GROUPS_TYPE = "muscle_groups must be an array of strings or a string";
const muscleGroups = z
  .union([z.array(z.string()), z.string()], { error: MUSCLE_GROUPS_TYPE })
  .superRefine((value, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (typeof value === "string") {
      if (value.length > 1000) fail("muscle_groups must be at most 1000 characters");
      return;
    }
    if (value.length > 20) return fail("muscle_groups must have at most 20 items");
    if (value.some((item) => item.length === 0)) return fail("muscle_groups items must not be empty");
    if (value.some((item) => item.length > 50)) {
      return fail("muscle_groups items must be at most 50 characters");
    }
    if (value.some((item) => item.includes(","))) {
      return fail("muscle_groups items must not contain commas");
    }
  })
  .nullish();

export const createWorkoutBody = bodyObject({
  name: requiredString(WORKOUT_NAME_REQUIRED, "Workout name", 100),
  date: optionalDate(),
  notes: optionalString("notes", NOTES_MAX),
  completed: optionalBoolean("completed"),
  muscle_groups: muscleGroups,
});

export const updateWorkoutBody = bodyObject({
  name: optionalNonEmptyString(WORKOUT_NAME_REQUIRED, "Workout name", 100),
  date: optionalDate(),
  notes: optionalString("notes", NOTES_MAX),
  completed: optionalBoolean("completed"),
  muscle_groups: muscleGroups,
});

// ---- exercise library ----
export const createExerciseLibraryBody = bodyObject({
  name: requiredString(EXERCISE_NAME_REQUIRED, "Exercise name", 100),
  muscle_group: optionalString("muscle_group", 50),
});

// ---- exercises ----
export const createExerciseBody = bodyObject({
  name: requiredString(EXERCISE_NAME_REQUIRED, "Exercise name", 100),
  notes: optionalString("notes", NOTES_MAX),
});

export const updateExerciseBody = bodyObject({
  name: optionalNonEmptyString(EXERCISE_NAME_REQUIRED, "Exercise name", 100),
  notes: optionalString("notes", NOTES_MAX),
});

// ---- sets ----
export const createSetBody = bodyObject({
  weight: nonNegative("weight", WEIGHT_MAX),
  reps: nonNegative("reps", REPS_MAX),
  completed: optionalBoolean("completed"),
  order_index: nonNegativeInt("order_index", ORDER_INDEX_MAX),
});

// Partial update; same rules as create. reps may be decimal (the app's
// NumberInput uses parseFloat, so 8.5 can be sent).
export const updateSetBody = bodyObject({
  weight: nonNegative("weight", WEIGHT_MAX),
  reps: nonNegative("reps", REPS_MAX),
  completed: optionalBoolean("completed"),
  order_index: nonNegativeInt("order_index", ORDER_INDEX_MAX),
});

export type CreateWorkoutBody = z.infer<typeof createWorkoutBody>;
export type UpdateWorkoutBody = z.infer<typeof updateWorkoutBody>;
export type CreateExerciseLibraryBody = z.infer<typeof createExerciseLibraryBody>;
export type CreateExerciseBody = z.infer<typeof createExerciseBody>;
export type UpdateExerciseBody = z.infer<typeof updateExerciseBody>;
export type CreateSetBody = z.infer<typeof createSetBody>;
export type UpdateSetBody = z.infer<typeof updateSetBody>;
