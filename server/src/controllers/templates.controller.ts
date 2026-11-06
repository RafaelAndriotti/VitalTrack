import { templateModel, type TemplateRow, type TemplateExerciseRow, type TemplateSetRow } from "../models/template.model.js";
import { workoutModel } from "../models/workout.model.js";
import { validatedBody } from "../middlewares/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { requireUserId } from "../utils/requireUserId.js";
import { templateBody, type TemplateBody } from "../validators/workouts.validator.js";
import { getWorkoutView } from "./workouts.controller.js";

interface TemplateResponse {
  id: string;
  name: string;
  muscle_groups: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises: {
    id: string;
    name: string;
    notes: string | null;
    order_index: number;
    sets: {
      id: string;
      kind: string;
      label: string | null;
      planned_reps: number | null;
      planned_weight: number | null;
      order_index: number;
    }[];
  }[];
}

function renderTemplate(
  row: TemplateRow,
  tree: { exercise: TemplateExerciseRow; sets: TemplateSetRow[] }[]
): TemplateResponse {
  return {
    id: row.id,
    name: row.name,
    muscle_groups: row.muscle_groups ? row.muscle_groups.split(",").filter(Boolean) : [],
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    exercises: tree.map(({ exercise, sets }) => ({
      id: exercise.id,
      name: exercise.name,
      notes: exercise.notes,
      order_index: exercise.order_index,
      sets: sets.map((s) => ({
        id: s.id,
        kind: s.kind,
        label: s.label,
        planned_reps: s.planned_reps,
        planned_weight: s.planned_weight,
        order_index: s.order_index,
      })),
    })),
  };
}

function toInput(body: TemplateBody) {
  return {
    name: body.name,
    muscleGroups: body.muscle_groups,
    notes: body.notes,
    exercises: body.exercises.map((e) => ({
      name: e.name,
      notes: e.notes,
      sets: e.sets.map((s) => ({
        kind: s.kind ?? "work",
        label: s.label,
        planned_reps: s.planned_reps,
        planned_weight: s.planned_weight,
      })),
    })),
  };
}

// GET /api/workouts/templates — modelos do usuário, com exercícios e séries
export const listTemplates = asyncHandler(
  async (req, res) => {
    const userId = requireUserId(req);
    const rows = templateModel.listByUser(userId);
    res.json(rows.map((r) => renderTemplate(r, templateModel.loadTree(r.id))));
  },
  "List templates error",
  "Failed to fetch templates"
);

// POST /api/workouts/templates — cria um modelo
export const createTemplate = asyncHandler(
  async (req, res) => {
    const body = validatedBody(req, templateBody);
    const userId = requireUserId(req);
    const id = templateModel.create(userId, toInput(body));
    const row = templateModel.findOwned(id, userId);
    if (!row) throw new HttpError(500, "Failed to create template");
    res.status(201).json(renderTemplate(row, templateModel.loadTree(id)));
  },
  "Create template error",
  "Failed to create template"
);

// PUT /api/workouts/templates/:id — substitui o modelo
export const updateTemplate = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const body = validatedBody(req, templateBody);
    const userId = requireUserId(req);
    if (!templateModel.replace(id, userId, toInput(body))) {
      throw new HttpError(404, "Template not found");
    }
    const row = templateModel.findOwned(id, userId);
    if (!row) throw new HttpError(404, "Template not found");
    res.json(renderTemplate(row, templateModel.loadTree(id)));
  },
  "Update template error",
  "Failed to update template"
);

// DELETE /api/workouts/templates/:id — apaga o modelo (treinos já feitos ficam)
export const deleteTemplate = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    if (!templateModel.delete(id, requireUserId(req))) {
      throw new HttpError(404, "Template not found");
    }
    res.status(204).send();
  },
  "Delete template error",
  "Failed to delete template"
);

// POST /api/workouts/templates/:id/start — cria um treino a partir do modelo
export const startFromTemplate = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const userId = requireUserId(req);
    const workoutId = templateModel.startWorkout(id, userId);
    const workout = workoutModel.findOwned({ id: workoutId, userId });
    if (!workout) throw new HttpError(500, "Failed to start workout");
    res.status(201).json(getWorkoutView(workout, userId));
  },
  "Start from template error",
  "Failed to start workout"
);
