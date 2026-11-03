import type { MealRow } from "../models/meal.model.js";
import type { MealItemRow } from "../models/mealItem.model.js";
import type { FoodLibraryRow } from "../models/foodLibrary.model.js";

export type MealItemResponse = MealItemRow;

export type MealResponse = MealRow & { meal_items: MealItemResponse[] };

export function renderMealItem(item: MealItemRow): MealItemResponse {
  return item;
}

export function renderMeal(meal: MealRow, items: MealItemRow[]): MealResponse {
  return { ...meal, meal_items: items.map(renderMealItem) };
}

export function renderFoodLibraryEntry(entry: FoodLibraryRow): FoodLibraryRow {
  return entry;
}

export function renderFoodLibrary(entries: FoodLibraryRow[]): FoodLibraryRow[] {
  return entries.map(renderFoodLibraryEntry);
}
