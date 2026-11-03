import { workoutModel, type WorkoutRow } from "../models/workout.model.js";
import { exerciseModel } from "../models/exercise.model.js";
import { exerciseSetModel } from "../models/exerciseSet.model.js";
import { exerciseLibraryModel } from "../models/exerciseLibrary.model.js";
import {
  renderWorkout,
  renderExercise,
  renderExerciseWithSets,
  renderSet,
  renderExerciseLibrary,
  renderExerciseLibraryEntry,
  type WorkoutResponse,
} from "../views/workout.view.js";
import { validatedBody } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { requireUserId } from "../utils/requireUserId.js";
import { requireFound } from "../utils/requireFound.js";
import {
  createWorkoutBody,
  updateWorkoutBody,
  createExerciseLibraryBody,
  createExerciseBody,
  updateExerciseBody,
  createSetBody,
  updateSetBody,
} from "../validators/workouts.validator.js";

// Attach exercises (with their sets) to a workout row and render it.
function loadWorkout(workout: WorkoutRow): WorkoutResponse {
  const exercises = exerciseModel.listByWorkout(workout.id).map((exercise) => ({
    exercise,
    sets: exerciseSetModel.listByExercise(exercise.id),
  }));
  return renderWorkout(workout, exercises);
}

// Load a single owned workout fully hydrated. Throws (500) if the row is missing;
// only used right after a successful insert/update.
function getWorkout(id: string, userId: string): WorkoutResponse {
  const workout = requireFound(workoutModel.findOwned({ id, userId }));
  return loadWorkout(workout);
}

// GET /api/workouts/library/exercises — list global and user's exercises
export const listExerciseLibrary = asyncHandler(
  async (req, res) => {
    const data = exerciseLibraryModel.listVisibleToUser(requireUserId(req));
    res.json(renderExerciseLibrary(data));
  },
  "List exercise library error",
  "Failed to fetch exercise library"
);

// POST /api/workouts/library/exercises — add exercise to library
export const createExerciseLibrary = asyncHandler(
  async (req, res) => {
    const { name, muscle_group } = validatedBody(req, createExerciseLibraryBody);

    const id = exerciseLibraryModel.create({
      userId: requireUserId(req),
      name,
      muscleGroup: muscle_group,
    });
    const data = requireFound(exerciseLibraryModel.findById(id));
    res.status(201).json(renderExerciseLibraryEntry(data));
  },
  "Create exercise library error",
  "Failed to create exercise in library"
);

// DELETE /api/workouts/library/exercises/:id — delete user's exercise
export const deleteExerciseLibrary = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // Only allow deleting user's own exercises (user_id = ? excludes globals)
    if (!exerciseLibraryModel.deleteOwned({ id, userId: requireUserId(req) })) {
      throw new HttpError(404, "Exercise not found or cannot be deleted");
    }
    res.status(204).send();
  },
  "Delete exercise library error",
  "Failed to delete exercise from library"
);

// GET /api/workouts — list user's workouts with exercises and sets
export const listWorkouts = asyncHandler(
  async (req, res) => {
    const workouts = workoutModel.listByUser(requireUserId(req));
    res.json(workouts.map(loadWorkout));
  },
  "List workouts error",
  "Failed to fetch workouts"
);

// POST /api/workouts — create a workout
export const createWorkout = asyncHandler(
  async (req, res) => {
    const { name, date, notes, completed, muscle_groups } = validatedBody(req, createWorkoutBody);
    const userId = requireUserId(req);

    const id = workoutModel.create({
      userId,
      name,
      date,
      completed,
      notes,
      muscleGroups: muscle_groups,
    });

    res.status(201).json(getWorkout(id, userId));
  },
  "Create workout error",
  "Failed to create workout"
);

// PUT /api/workouts/:id — update a workout
export const updateWorkout = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const { name, date, notes, completed, muscle_groups } = validatedBody(req, updateWorkoutBody);
    const userId = requireUserId(req);

    const updated = workoutModel.update({
      id,
      userId,
      name,
      date,
      notes,
      completed,
      muscleGroups: muscle_groups,
    });

    if (!updated) {
      throw new HttpError(404, "Workout not found");
    }

    res.json(getWorkout(id, userId));
  },
  "Update workout error",
  "Failed to update workout"
);

// DELETE /api/workouts/:id — delete a workout
export const deleteWorkout = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!workoutModel.delete({ id, userId: requireUserId(req) })) {
      throw new HttpError(404, "Workout not found");
    }

    res.status(204).send();
  },
  "Delete workout error",
  "Failed to delete workout"
);

// POST /api/workouts/:id/exercises — add exercise to workout
export const addExercise = asyncHandler(
  async (req, res) => {
    const { id: workoutId } = req.params;
    const { name, notes } = validatedBody(req, createExerciseBody);

    if (!workoutModel.ownsWorkout({ workoutId, userId: requireUserId(req) })) {
      throw new HttpError(404, "Workout not found");
    }

    const id = exerciseModel.create({ workoutId, name, notes });
    const data = requireFound(exerciseModel.findById(id));
    res.status(201).json(renderExerciseWithSets(data, []));
  },
  "Add exercise error",
  "Failed to add exercise"
);

// DELETE /api/workouts/:id/exercises/:exerciseId — delete exercise
export const deleteExercise = asyncHandler(
  async (req, res) => {
    const { id: workoutId, exerciseId } = req.params;

    if (!workoutModel.ownsWorkout({ workoutId, userId: requireUserId(req) })) {
      throw new HttpError(404, "Workout not found");
    }

    if (!exerciseModel.delete({ exerciseId, workoutId })) {
      throw new HttpError(404, "Exercise not found");
    }

    res.status(204).send();
  },
  "Delete exercise error",
  "Failed to delete exercise"
);

// PUT /api/workouts/:id/exercises/:exerciseId — update exercise
export const updateExercise = asyncHandler(
  async (req, res) => {
    const { id: workoutId, exerciseId } = req.params;
    const { name, notes } = validatedBody(req, updateExerciseBody);

    if (!workoutModel.ownsWorkout({ workoutId, userId: requireUserId(req) })) {
      throw new HttpError(404, "Workout not found");
    }

    if (!exerciseModel.update({ exerciseId, workoutId, name, notes })) {
      throw new HttpError(404, "Exercise not found");
    }

    const updatedExercise = requireFound(exerciseModel.findById(exerciseId));
    res.json(renderExercise(updatedExercise));
  },
  "Update exercise error",
  "Failed to update exercise"
);

// POST /api/workouts/:id/exercises/:exerciseId/sets — add set to exercise
export const addSet = asyncHandler(
  async (req, res) => {
    const { id: workoutId, exerciseId } = req.params;
    const { weight, reps, completed, order_index } = validatedBody(req, createSetBody);

    if (!exerciseModel.ownsExercise({
      exerciseId,
      workoutId,
      userId: requireUserId(req),
    })) {
      throw new HttpError(404, "Exercise not found");
    }

    const id = exerciseSetModel.create({
      exerciseId,
      weight,
      reps,
      completed,
      orderIndex: order_index,
    });

    const data = requireFound(exerciseSetModel.findById(id));
    res.status(201).json(renderSet(data));
  },
  "Add set error",
  "Failed to add set"
);

// PUT /api/workouts/:id/exercises/:exerciseId/sets/:setId — update set
export const updateSet = asyncHandler(
  async (req, res) => {
    const { id: workoutId, exerciseId, setId } = req.params;
    const { weight, reps, completed, order_index } = validatedBody(req, updateSetBody);

    if (!exerciseModel.ownsExercise({
      exerciseId,
      workoutId,
      userId: requireUserId(req),
    })) {
      throw new HttpError(404, "Set not found");
    }

    const updated = exerciseSetModel.update({
      setId,
      exerciseId,
      weight,
      reps,
      completed,
      orderIndex: order_index,
    });

    if (!updated) {
      throw new HttpError(404, "Set not found");
    }

    const data = requireFound(exerciseSetModel.findById(setId));
    res.json(renderSet(data));
  },
  "Update set error",
  "Failed to update set"
);

// DELETE /api/workouts/:id/exercises/:exerciseId/sets/:setId — delete set
export const deleteSet = asyncHandler(
  async (req, res) => {
    const { id: workoutId, exerciseId, setId } = req.params;

    if (!exerciseModel.ownsExercise({
      exerciseId,
      workoutId,
      userId: requireUserId(req),
    })) {
      throw new HttpError(404, "Set not found");
    }

    if (!exerciseSetModel.delete({ setId, exerciseId })) {
      throw new HttpError(404, "Set not found");
    }

    res.status(204).send();
  },
  "Delete set error",
  "Failed to delete set"
);
