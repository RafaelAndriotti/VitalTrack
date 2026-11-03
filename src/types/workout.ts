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
