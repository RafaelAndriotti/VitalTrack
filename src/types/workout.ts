export type SetKind = 'warmup' | 'work' | 'drop' | 'failure';

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  kind: SetKind;
  /** Nome dado pelo usuário; null = rótulo automático. */
  label: string | null;
  weight: number;
  reps: number;
  completed: boolean;
  order_index: number;
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  notes: string | null;
  exercise_sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  completed: boolean;
  notes: string | null;
  muscle_groups: string[];
  created_at: string;
  /** Modelo do qual o treino foi iniciado; null = treino livre. */
  source_template_id: string | null;
  exercises: Exercise[];
  /** Calorias estimadas pelas séries concluídas (calculado no backend). */
  calories_burned: number;
  /** Peso (kg) usado no cálculo. */
  weight_kg_used: number;
  /** true quando o peso é o padrão, não o informado pelo usuário. */
  estimated: boolean;
}

export interface ExerciseLibraryItem {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string | null;
}

export interface CreateWorkoutPayload {
  name: string;
  date?: string;
  notes?: string;
  completed?: boolean;
  muscle_groups?: string[];
}

export type UpdateWorkoutPayload = Partial<CreateWorkoutPayload>;

export interface CreateExercisePayload {
  name: string;
  notes?: string;
}

export type UpdateExercisePayload = Partial<CreateExercisePayload>;

export interface CreateSetPayload {
  kind?: SetKind;
  label?: string | null;
  weight: number;
  reps: number;
  completed: boolean;
  order_index: number;
}

export type UpdateSetPayload = Partial<CreateSetPayload>;

export interface CreateLibraryExercisePayload {
  name: string;
  muscle_group: string;
}

export type EvolutionPeriod = 7 | 30 | 90;

export interface EvolutionTotals {
  treinos: number;
  volume_kg: number;
  kcal: number;
}

export interface EvolutionBucket {
  /** Primeiro dia do intervalo (YYYY-MM-DD). */
  start: string;
  treinos: number;
  volume_kg: number;
}

export interface EvolutionHighlight {
  exercise: string;
  first_kg: number;
  last_kg: number;
  max_kg: number;
  points: { date: string; max_kg: number }[];
}

/** Resposta de GET /api/workouts/evolution. */
export interface Evolution {
  period_days: EvolutionPeriod;
  start: string;
  end: string;
  current: EvolutionTotals;
  previous: EvolutionTotals;
  bucket_days: number;
  buckets: EvolutionBucket[];
  highlight: EvolutionHighlight | null;
  kcal_estimated: boolean;
}

export interface TemplateSet {
  id: string;
  kind: SetKind;
  label: string | null;
  planned_reps: number | null;
  planned_weight: number | null;
  order_index: number;
}

export interface TemplateExercise {
  id: string;
  name: string;
  notes: string | null;
  order_index: number;
  sets: TemplateSet[];
}

/** Modelo de treino fixo (ex.: o treino definido pelo personal). */
export interface WorkoutTemplate {
  id: string;
  name: string;
  muscle_groups: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercises: TemplateExercise[];
}

export interface TemplateSetPayload {
  kind?: SetKind;
  label?: string | null;
  planned_reps?: number | null;
  planned_weight?: number | null;
}

export interface TemplatePayload {
  name: string;
  muscle_groups?: string[];
  notes?: string | null;
  exercises: { name: string; notes?: string | null; sets: TemplateSetPayload[] }[];
}
