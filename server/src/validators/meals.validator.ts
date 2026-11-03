import { z } from "zod";
import {
  bodyObject,
  idParam,
  isoDate,
  nonNegative,
  optionalDate,
  optionalNonEmptyString,
  optionalString,
  positive,
  requiredString,
} from "./common.js";

const FOOD_NAME_REQUIRED = "Food name is required";
const MEAL_NAME_REQUIRED = "Meal name is required";

// Plausibility ceilings: far above anything real, they only stop absurd values.
const CALORIES_MAX = 100_000;
const MACRO_MAX = 10_000;
const AMOUNT_MAX = 100_000;

// ---- params ----
export const idParams = z.object({ id: idParam("id") });
export const itemParams = z.object({
  id: idParam("id"),
  itemId: idParam("itemId"),
});

// ---- query ----
// Empty `?date=` still means "no filter", like before; an array (?date=a&date=b) fails.
export const listMealsQuery = z.object({
  date: z.preprocess((v) => (v === "" ? undefined : v), isoDate("date").optional()),
});

// ---- food library ----
export const createFoodLibraryBody = bodyObject({
  name: requiredString(FOOD_NAME_REQUIRED, "Food name", 100),
  calories: nonNegative("calories", CALORIES_MAX),
  protein: nonNegative("protein", MACRO_MAX),
  carbs: nonNegative("carbs", MACRO_MAX),
  fat: nonNegative("fat", MACRO_MAX),
  serving_size: positive("serving_size", AMOUNT_MAX),
});

// ---- meals ----
// `time` is free text typed by the user (placeholder "ex: 08:00"), so only its length is checked.
export const createMealBody = bodyObject({
  name: requiredString(MEAL_NAME_REQUIRED, "Meal name", 100),
  date: optionalDate(),
  time: optionalString("time", 50),
});

export const updateMealBody = bodyObject({
  name: optionalNonEmptyString(MEAL_NAME_REQUIRED, "Meal name", 100),
  date: optionalDate(),
  time: optionalString("time", 50),
});

// ---- meal items ----
export const createMealItemBody = bodyObject({
  name: requiredString(FOOD_NAME_REQUIRED, "Food name", 100),
  amount: positive("amount", AMOUNT_MAX),
  calories: nonNegative("calories", CALORIES_MAX),
  protein: nonNegative("protein", MACRO_MAX),
  carbs: nonNegative("carbs", MACRO_MAX),
  fat: nonNegative("fat", MACRO_MAX),
});

// Partial update; amount must be > 0, same as create.
export const updateMealItemBody = bodyObject({
  name: optionalNonEmptyString(FOOD_NAME_REQUIRED, "Food name", 100),
  amount: positive("amount", AMOUNT_MAX),
  calories: nonNegative("calories", CALORIES_MAX),
  protein: nonNegative("protein", MACRO_MAX),
  carbs: nonNegative("carbs", MACRO_MAX),
  fat: nonNegative("fat", MACRO_MAX),
});

export type CreateFoodLibraryBody = z.infer<typeof createFoodLibraryBody>;
export type CreateMealBody = z.infer<typeof createMealBody>;
export type UpdateMealBody = z.infer<typeof updateMealBody>;
export type CreateMealItemBody = z.infer<typeof createMealItemBody>;
export type UpdateMealItemBody = z.infer<typeof updateMealItemBody>;
export type ListMealsQuery = z.infer<typeof listMealsQuery>;
