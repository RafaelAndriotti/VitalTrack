import { randomUUID } from "node:crypto";
import { db } from "../config/db.js";
import { HttpError } from "../utils/httpError.js";
import { today } from "../utils/date.js";
import type { SetKind } from "./exerciseSet.model.js";

export interface TemplateRow {
  id: string;
  user_id: string;
  name: string;
  muscle_groups: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateExerciseRow {
  id: string;
  template_id: string;
  name: string;
  notes: string | null;
  order_index: number;
}

export interface TemplateSetRow {
  id: string;
  template_exercise_id: string;
  kind: SetKind;
  label: string | null;
  planned_reps: number | null;
  planned_weight: number | null;
  order_index: number;
}

export interface TemplateSetInput {
  kind?: SetKind | null;
  label?: string | null;
  planned_reps?: number | null;
  planned_weight?: number | null;
}

export interface TemplateExerciseInput {
  name: string;
  notes?: string | null;
  sets: TemplateSetInput[];
}

export interface TemplateInput {
  name: string;
  /** Array ou CSV; guardado como CSV. */
  muscleGroups?: string[] | string | null;
  notes?: string | null;
  exercises: TemplateExerciseInput[];
}

const selectByUser = db.prepare(
  "SELECT * FROM workout_templates WHERE user_id = ? ORDER BY created_at ASC"
);
const selectOwned = db.prepare(
  "SELECT * FROM workout_templates WHERE id = ? AND user_id = ?"
);
const insertTemplate = db.prepare(
  "INSERT INTO workout_templates (id, user_id, name, muscle_groups, notes) VALUES (?, ?, ?, ?, ?)"
);
const updateTemplate = db.prepare(
  "UPDATE workout_templates SET name = ?, muscle_groups = ?, notes = ? WHERE id = ? AND user_id = ?"
);
const deleteTemplate = db.prepare("DELETE FROM workout_templates WHERE id = ? AND user_id = ?");
const selectExercises = db.prepare(
  "SELECT * FROM template_exercises WHERE template_id = ? ORDER BY order_index ASC"
);
const insertTemplateExercise = db.prepare(
  "INSERT INTO template_exercises (id, template_id, name, notes, order_index) VALUES (?, ?, ?, ?, ?)"
);
const selectSets = db.prepare(
  "SELECT * FROM template_sets WHERE template_exercise_id = ? ORDER BY order_index ASC"
);
const insertTemplateSet = db.prepare(
  `INSERT INTO template_sets (id, template_exercise_id, kind, label, planned_reps, planned_weight, order_index)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
);
const countActive = db.prepare(
  "SELECT COUNT(*) AS n FROM workouts WHERE user_id = ? AND completed = 0"
);
const insertWorkoutFromTemplate = db.prepare(
  `INSERT INTO workouts (id, user_id, name, date, completed, muscle_groups, source_template_id)
   VALUES (?, ?, ?, ?, 0, ?, ?)`
);
const insertExercise = db.prepare(
  "INSERT INTO exercises (id, workout_id, name, notes, order_index) VALUES (?, ?, ?, ?, ?)"
);
const insertSet = db.prepare(
  `INSERT INTO exercise_sets (id, exercise_id, weight, reps, completed, order_index, kind, label)
   VALUES (?, ?, ?, ?, 0, ?, ?, ?)`
);

const csv = (v: string[] | string | null | undefined): string | null =>
  Array.isArray(v) ? v.join(",") : v || null;

/** Grava exercícios e séries de um modelo (já dentro de transação). */
function writeTree(templateId: string, exercises: TemplateExerciseInput[]): void {
  exercises.forEach((ex, i) => {
    const exId = randomUUID();
    insertTemplateExercise.run(exId, templateId, ex.name, ex.notes || null, i);
    ex.sets.forEach((s, j) => {
      insertTemplateSet.run(
        randomUUID(),
        exId,
        s.kind ?? "work",
        s.label ?? null,
        s.planned_reps ?? null,
        s.planned_weight ?? null,
        j
      );
    });
  });
}

export const templateModel = {
  listByUser(userId: string): TemplateRow[] {
    return selectByUser.all(userId) as TemplateRow[];
  },

  /** Owner-scoped lookup: undefined if the template is not the user's. */
  findOwned(id: string, userId: string): TemplateRow | undefined {
    return selectOwned.get(id, userId) as TemplateRow | undefined;
  },

  /** Exercícios e séries de um modelo, na ordem. */
  loadTree(templateId: string): { exercise: TemplateExerciseRow; sets: TemplateSetRow[] }[] {
    return (selectExercises.all(templateId) as TemplateExerciseRow[]).map((exercise) => ({
      exercise,
      sets: selectSets.all(exercise.id) as TemplateSetRow[],
    }));
  },

  create(userId: string, input: TemplateInput): string {
    const id = randomUUID();
    db.transaction(() => {
      insertTemplate.run(id, userId, input.name, csv(input.muscleGroups), input.notes || null);
      writeTree(id, input.exercises);
    })();
    return id;
  },

  /** Substitui nome, grupos, notas e a árvore de exercícios/séries. False se não for do usuário. */
  replace(id: string, userId: string, input: TemplateInput): boolean {
    return db.transaction(() => {
      const info = updateTemplate.run(input.name, csv(input.muscleGroups), input.notes || null, id, userId);
      if (info.changes === 0) return false;
      // Apagar os exercícios leva as séries junto (ON DELETE CASCADE).
      db.prepare("DELETE FROM template_exercises WHERE template_id = ?").run(id);
      writeTree(id, input.exercises);
      return true;
    })();
  },

  delete(id: string, userId: string): boolean {
    return deleteTemplate.run(id, userId).changes > 0;
  },

  /**
   * Cria um treino a partir do modelo. Copia exercícios e séries (com tipo e
   * rótulo); as séries saem não concluídas, com a carga e as reps planejadas.
   * Só pode haver um treino em andamento: lança 409 se já existir um.
   */
  startWorkout(templateId: string, userId: string): string {
    return db.transaction(() => {
      const tpl = selectOwned.get(templateId, userId) as TemplateRow | undefined;
      if (!tpl) throw new HttpError(404, "Template not found");
      const active = countActive.get(userId) as { n: number };
      if (active.n > 0) {
        throw new HttpError(409, "Você já tem um treino em andamento. Conclua ou exclua antes de iniciar outro.");
      }

      const workoutId = randomUUID();
      insertWorkoutFromTemplate.run(
        workoutId,
        userId,
        tpl.name,
        today(),
        tpl.muscle_groups,
        tpl.id
      );

      for (const { exercise, sets } of this.loadTree(tpl.id)) {
        const exId = randomUUID();
        insertExercise.run(exId, workoutId, exercise.name, exercise.notes, exercise.order_index);
        for (const s of sets) {
          insertSet.run(
            randomUUID(),
            exId,
            s.planned_weight ?? 0,
            s.planned_reps ?? 0,
            s.order_index,
            s.kind,
            s.label
          );
        }
      }
      return workoutId;
    })();
  },
};
