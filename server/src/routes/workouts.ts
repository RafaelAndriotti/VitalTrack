import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { userRateLimit } from "../middlewares/userRateLimit.js";
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
import { getEvolution } from "../controllers/evolution.controller.js";
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  startFromTemplate,
} from "../controllers/templates.controller.js";
import { evolutionQuery, templateBody } from "../validators/workouts.validator.js";
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
router.use(authenticate, userRateLimit);

// Exercise library
router.get("/library/exercises", listExerciseLibrary);
router.post(
  "/library/exercises",
  validate({ body: createExerciseLibraryBody }),
  createExerciseLibrary
);
router.delete("/library/exercises/:id", validate({ params: idParams }), deleteExerciseLibrary);

// Modelos de treino (antes de "/:id" para não colidir)
router.get("/templates", listTemplates);
router.post("/templates", validate({ body: templateBody }), createTemplate);
router.put("/templates/:id", validate({ params: idParams, body: templateBody }), updateTemplate);
router.delete("/templates/:id", validate({ params: idParams }), deleteTemplate);
router.post("/templates/:id/start", validate({ params: idParams }), startFromTemplate);

// Evolution (antes de "/:id" para não colidir com rotas de treino)
router.get("/evolution", validate({ query: evolutionQuery }), getEvolution);

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
