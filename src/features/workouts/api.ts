import { request, enc } from '@/services/http';
import type {
  Workout,
  Exercise,
  ExerciseSet,
  ExerciseLibraryItem,
  CreateWorkoutPayload,
  UpdateWorkoutPayload,
  CreateExercisePayload,
  UpdateExercisePayload,
  CreateSetPayload,
  UpdateSetPayload,
  CreateLibraryExercisePayload,
  Evolution,
  EvolutionPeriod,
} from '@/types';

const exercisePath = (workoutId: string, exerciseId: string) =>
  `/workouts/${enc(workoutId)}/exercises/${enc(exerciseId)}`;

export const workoutsApi = {
  list: () => request<Workout[]>('/workouts'),

  evolution: (days: EvolutionPeriod) =>
    request<Evolution>(`/workouts/evolution?days=${days}`),

  create: (data: CreateWorkoutPayload) =>
    request<Workout>('/workouts', { method: 'POST', body: data }),

  update: (id: string, data: UpdateWorkoutPayload) =>
    request<Workout>(`/workouts/${enc(id)}`, { method: 'PUT', body: data }),

  remove: (id: string) => request<void>(`/workouts/${enc(id)}`, { method: 'DELETE' }),

  // Biblioteca de exercícios
  listLibrary: () => request<ExerciseLibraryItem[]>('/workouts/library/exercises'),

  addLibraryExercise: (data: CreateLibraryExercisePayload) =>
    request<ExerciseLibraryItem>('/workouts/library/exercises', { method: 'POST', body: data }),

  removeLibraryExercise: (id: string) =>
    request<void>(`/workouts/library/exercises/${enc(id)}`, { method: 'DELETE' }),

  // Exercícios do treino
  addExercise: (workoutId: string, data: CreateExercisePayload) =>
    request<Exercise>(`/workouts/${enc(workoutId)}/exercises`, { method: 'POST', body: data }),

  updateExercise: (workoutId: string, exerciseId: string, data: UpdateExercisePayload) =>
    request<Exercise>(exercisePath(workoutId, exerciseId), { method: 'PUT', body: data }),

  removeExercise: (workoutId: string, exerciseId: string) =>
    request<void>(exercisePath(workoutId, exerciseId), { method: 'DELETE' }),

  // Séries
  addSet: (workoutId: string, exerciseId: string, data: CreateSetPayload) =>
    request<ExerciseSet>(`${exercisePath(workoutId, exerciseId)}/sets`, { method: 'POST', body: data }),

  updateSet: (workoutId: string, exerciseId: string, setId: string, data: UpdateSetPayload) =>
    request<ExerciseSet>(`${exercisePath(workoutId, exerciseId)}/sets/${enc(setId)}`, {
      method: 'PUT',
      body: data,
    }),

  removeSet: (workoutId: string, exerciseId: string, setId: string) =>
    request<void>(`${exercisePath(workoutId, exerciseId)}/sets/${enc(setId)}`, { method: 'DELETE' }),
};
