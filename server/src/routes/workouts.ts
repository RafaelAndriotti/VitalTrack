import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  listExerciseLibrary,
  createExerciseLibrary,
  deleteExerciseLibrary,
  listWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addExercise,
  deleteExercise,
  updateExercise,
  addSet,
  updateSet,
  deleteSet,
} from "../controllers/workouts.controller.js";
import { validate } from "../middlewares/validate.js";
import {
  idParams,
  exerciseParams,
  setParams,
  createWorkoutBody,
  updateWorkoutBody,
  createExerciseLibraryBody,
  createExerciseBody,
  updateExerciseBody,
  createSetBody,
  updateSetBody,
} from "../validators/workouts.validator.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Exercise library
router.get("/library/exercises", listExerciseLibrary);
router.post(
  "/library/exercises",
  validate({ body: createExerciseLibraryBody }),
  createExerciseLibrary
);
router.delete("/library/exercises/:id", validate({ params: idParams }), deleteExerciseLibrary);

// Workouts
router.get("/", listWorkouts);
router.post("/", validate({ body: createWorkoutBody }), createWorkout);
router.put("/:id", validate({ params: idParams, body: updateWorkoutBody }), updateWorkout);
router.delete("/:id", validate({ params: idParams }), deleteWorkout);

// Exercises
router.post("/:id/exercises", validate({ params: idParams, body: createExerciseBody }), addExercise);
router.delete("/:id/exercises/:exerciseId", validate({ params: exerciseParams }), deleteExercise);
router.put(
  "/:id/exercises/:exerciseId",
  validate({ params: exerciseParams, body: updateExerciseBody }),
  updateExercise
);

// Sets
router.post(
  "/:id/exercises/:exerciseId/sets",
  validate({ params: exerciseParams, body: createSetBody }),
  addSet
);
router.put(
  "/:id/exercises/:exerciseId/sets/:setId",
  validate({ params: setParams, body: updateSetBody }),
  updateSet
);
router.delete(
  "/:id/exercises/:exerciseId/sets/:setId",
  validate({ params: setParams }),
  deleteSet
);

export default router;
