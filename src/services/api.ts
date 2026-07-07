import { API_URL } from '@/constants/config';
import type { AuthResponse, Workout, Exercise, ExerciseSet, Meal, MealItem, ExerciseLibraryItem, FoodLibraryItem, DailyWater } from '@/types';

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // Previne perda de token no hot-reload
  if (!authToken) {
    try {
      if (Platform.OS === 'web') {
        authToken = localStorage.getItem('vitaltrack_token');
      } else {
        authToken = await SecureStore.getItemAsync('vitaltrack_token');
      }
    } catch {}
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return { message: 'Sucesso' } as T;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro de conexão' }));
    throw new Error(error.error || `Erro ${response.status}`);
  }

  return response.json();
}

// Auth
export const auth = {
  register: (email: string, password: string, name: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Workouts
export const workouts = {
  list: () => request<Workout[]>('/workouts'),

  create: (data: { name: string; date?: string; notes?: string; completed?: boolean }) =>
    request<Workout>('/workouts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLibraryExercises: () => request<ExerciseLibraryItem[]>('/workouts/library/exercises'),
  
  addLibraryExercise: (data: { name: string; muscle_group?: string }) =>
    request<ExerciseLibraryItem>('/workouts/library/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    
  deleteLibraryExercise: (id: string) =>
    request<{ message: string }>(`/workouts/library/exercises/${id}`, { method: 'DELETE' }),

  update: (id: string, data: { name?: string; date?: string; notes?: string; completed?: boolean }) =>
    request<Workout>(`/workouts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/workouts/${id}`, { method: 'DELETE' }),

  addExercise: (workoutId: string, data: { name: string; notes?: string }) =>
    request<Exercise>(`/workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateExercise: (workoutId: string, exerciseId: string, data: { name?: string; notes?: string }) =>
    request<Exercise>(`/workouts/${workoutId}/exercises/${exerciseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteExercise: (workoutId: string, exerciseId: string) =>
    request<{ message: string }>(`/workouts/${workoutId}/exercises/${exerciseId}`, {
      method: 'DELETE',
    }),

  addSet: (workoutId: string, exerciseId: string, data: { weight?: number; reps?: number; completed?: boolean; order_index?: number }) =>
    request<ExerciseSet>(`/workouts/${workoutId}/exercises/${exerciseId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateSet: (workoutId: string, exerciseId: string, setId: string, data: Partial<ExerciseSet>) =>
    request<ExerciseSet>(`/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteSet: (workoutId: string, exerciseId: string, setId: string) =>
    request<{ message: string }>(`/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`, {
      method: 'DELETE',
    }),
};

// Meals
export const meals = {
  list: (date?: string) =>
    request<Meal[]>(date ? `/meals?date=${date}` : '/meals'),

  create: (data: { name: string; date?: string; time?: string }) =>
    request<Meal>('/meals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getLibraryFoods: () => request<FoodLibraryItem[]>('/meals/library/foods'),

  addLibraryFood: (data: { name: string; calories: number; protein: number; carbs: number; fat: number; serving_size?: number }) =>
    request<FoodLibraryItem>('/meals/library/foods', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteLibraryFood: (id: string) =>
    request<{ message: string }>(`/meals/library/foods/${id}`, { method: 'DELETE' }),

  update: (id: string, data: Partial<Meal>) =>
    request<Meal>(`/meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/meals/${id}`, { method: 'DELETE' }),

  addFoodItem: (mealId: string, data: { name: string; amount: number; calories: number; protein: number; carbs: number; fat: number }) =>
    request<MealItem>(`/meals/${mealId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteFoodItem: (mealId: string, itemId: string) =>
    request<{ message: string }>(`/meals/${mealId}/items/${itemId}`, {
      method: 'DELETE',
    }),
};

// Water
export const water = {
  get: (date?: string) =>
    request<DailyWater>(date ? `/water?date=${date}` : '/water'),

  update: (data: { date?: string; amount_ml?: number; goal_ml?: number }) =>
    request<DailyWater>('/water', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
