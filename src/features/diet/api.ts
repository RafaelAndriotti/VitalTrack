import { request, enc } from '@/services/http';
import type {
  Meal,
  MealItem,
  FoodLibraryItem,
  CreateMealPayload,
  UpdateMealPayload,
  CreateMealItemPayload,
  CreateLibraryFoodPayload,
} from '@/types';

export const mealsApi = {
  list: (date: string) => request<Meal[]>(`/meals?date=${enc(date)}`),

  create: (data: CreateMealPayload) => request<Meal>('/meals', { method: 'POST', body: data }),

  update: (id: string, data: UpdateMealPayload) =>
    request<Meal>(`/meals/${enc(id)}`, { method: 'PUT', body: data }),

  remove: (id: string) => request<void>(`/meals/${enc(id)}`, { method: 'DELETE' }),

  listLibraryFoods: () => request<FoodLibraryItem[]>('/meals/library/foods'),

  addLibraryFood: (data: CreateLibraryFoodPayload) =>
    request<FoodLibraryItem>('/meals/library/foods', { method: 'POST', body: data }),

  removeLibraryFood: (id: string) =>
    request<void>(`/meals/library/foods/${enc(id)}`, { method: 'DELETE' }),

  addItem: (mealId: string, data: CreateMealItemPayload) =>
    request<MealItem>(`/meals/${enc(mealId)}/items`, { method: 'POST', body: data }),

  removeItem: (mealId: string, itemId: string) =>
    request<void>(`/meals/${enc(mealId)}/items/${enc(itemId)}`, { method: 'DELETE' }),
};
