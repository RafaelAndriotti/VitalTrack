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

const router = Router();

// All routes require authentication
router.use(authenticate);

// Exercise library
router.get("/library/exercises", listExerciseLibrary);
router.post("/library/exercises", createExerciseLibrary);
router.delete("/library/exercises/:id", deleteExerciseLibrary);

// Workouts
router.get("/", listWorkouts);
router.post("/", createWorkout);
router.put("/:id", updateWorkout);
router.delete("/:id", deleteWorkout);

// Exercises
router.post("/:id/exercises", addExercise);
router.delete("/:id/exercises/:exerciseId", deleteExercise);
router.put("/:id/exercises/:exerciseId", updateExercise);

// Sets
router.post("/:id/exercises/:exerciseId/sets", addSet);
router.put("/:id/exercises/:exerciseId/sets/:setId", updateSet);
router.delete("/:id/exercises/:exerciseId/sets/:setId", deleteSet);

export default router;
