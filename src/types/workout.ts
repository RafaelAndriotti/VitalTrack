export interface ExerciseSet {
  id: string;
  exercise_id: string;
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
