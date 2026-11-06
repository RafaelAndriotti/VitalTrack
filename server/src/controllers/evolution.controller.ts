import { workoutModel } from "../models/workout.model.js";
import { exerciseModel } from "../models/exercise.model.js";
import { exerciseSetModel } from "../models/exerciseSet.model.js";
import { userModel } from "../models/user.model.js";
import { buildEvolution, type EvoWorkout } from "../utils/evolution.js";
import { validatedQuery } from "../middlewares/validate.js";
import { evolutionQuery } from "../validators/workouts.validator.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireUserId } from "../utils/requireUserId.js";
import { today } from "../utils/date.js";

// GET /api/workouts/evolution?days=7|30|90 — resumo de evolução do usuário
export const getEvolution = asyncHandler(
  async (req, res) => {
    const userId = requireUserId(req);
    const { days } = validatedQuery(res, evolutionQuery);

    // Carrega só o necessário: treinos concluídos, exercícios e séries.
    const workouts: EvoWorkout[] = workoutModel.listByUser(userId).map((w) => ({
      date: w.date,
      completed: !!w.completed,
      exercises: w.completed
        ? exerciseModel.listByWorkout(w.id).map((ex) => ({
            name: ex.name,
            sets: exerciseSetModel.listByExercise(ex.id).map((s) => ({
              weight: s.weight,
              reps: s.reps,
              completed: !!s.completed,
            })),
          }))
        : [],
    }));

    res.json(
      buildEvolution({
        workouts,
        periodDays: days,
        today: today(),
        weightKg: userModel.findWeightKg(userId),
      })
    );
  },
  "Evolution error",
  "Failed to fetch evolution"
);

