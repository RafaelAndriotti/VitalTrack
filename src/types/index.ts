export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  notes: string | null;
  exercise_sets: ExerciseSet[];
}

export interface ExerciseSet {
  id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  completed: boolean;
  order_index: number;
}

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  date: string;
  time: string | null;
  meal_items: MealItem[];
}

export interface MealItem {
  id: string;
  meal_id: string;
  name: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ExerciseLibraryItem {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string | null;
}

export interface FoodLibraryItem {
  id: string;
  user_id: string | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: number;
}

export interface DailyWater {
  id: string;
  user_id: string;
  date: string;
  amount_ml: number;
  goal_ml: number;
}
