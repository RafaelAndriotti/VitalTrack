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

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  date: string;
  time: string | null;
  meal_items: MealItem[];
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

export interface CreateMealPayload {
  name: string;
  date: string;
  time?: string;
}

export type UpdateMealPayload = Partial<CreateMealPayload>;

export interface CreateMealItemPayload {
  name: string;
  amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CreateLibraryFoodPayload {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size?: number;
}
