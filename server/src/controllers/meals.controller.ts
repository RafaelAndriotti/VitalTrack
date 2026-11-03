import { mealModel, type MealRow } from "../models/meal.model.js";
import { mealItemModel } from "../models/mealItem.model.js";
import { foodLibraryModel } from "../models/foodLibrary.model.js";
import {
  renderMeal,
  renderMealItem,
  renderFoodLibrary,
  renderFoodLibraryEntry,
  type MealResponse,
} from "../views/meal.view.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { requireUserId } from "../utils/requireUserId.js";
import { requireFound } from "../utils/requireFound.js";

interface FoodLibraryBody {
  name?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  serving_size?: number;
}

interface MealBody {
  name?: string;
  date?: string;
  time?: string;
}

interface MealItemBody {
  name?: string;
  amount?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

function loadMeal(meal: MealRow): MealResponse {
  return renderMeal(meal, mealItemModel.listByMeal(meal.id));
}

// Load a meal with its items, scoped to the owner. Throws (500) if the row is
// missing; only used right after a successful insert/update.
function getMealWithItems(id: string, userId: string): MealResponse {
  const meal = requireFound(mealModel.findOwned({ id, userId }));
  return loadMeal(meal);
}

// GET /api/meals/library/foods — list global and user's food
export const listFoodLibrary = asyncHandler(
  async (req, res) => {
    const data = foodLibraryModel.listVisibleToUser(requireUserId(req));
    res.json(renderFoodLibrary(data));
  },
  "List food library error",
  "Failed to fetch food library"
);

// POST /api/meals/library/foods — add food to library
export const createFoodLibrary = asyncHandler(
  async (req, res) => {
    const { name, calories, protein, carbs, fat, serving_size } =
      req.body as FoodLibraryBody;
    if (!name) {
      throw new HttpError(400, "Food name is required");
    }

    const id = foodLibraryModel.create({
      userId: requireUserId(req),
      name,
      calories,
      protein,
      carbs,
      fat,
      servingSize: serving_size,
    });

    const data = requireFound(foodLibraryModel.findById(id));
    res.status(201).json(renderFoodLibraryEntry(data));
  },
  "Create food library error",
  "Failed to create food in library"
);

// DELETE /api/meals/library/foods/:id — delete user's food
export const deleteFoodLibrary = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // Only allow deleting user's own foods (user_id = ? excludes globals)
    if (!foodLibraryModel.deleteOwned({ id, userId: requireUserId(req) })) {
      throw new HttpError(404, "Food not found or cannot be deleted");
    }
    res.status(204).send();
  },
  "Delete food library error",
  "Failed to delete food from library"
);

// GET /api/meals — list user's meals with meal items (optional ?date=YYYY-MM-DD filter)
export const listMeals = asyncHandler(
  async (req, res) => {
    const { date } = req.query;

    const meals = mealModel.listByUser({
      userId: requireUserId(req),
      date: date && typeof date === "string" ? date : undefined,
    });

    res.json(meals.map(loadMeal));
  },
  "List meals error",
  "Failed to fetch meals"
);

// POST /api/meals — create a meal
export const createMeal = asyncHandler(
  async (req, res) => {
    const { name, date, time } = req.body as MealBody;

    if (!name) {
      throw new HttpError(400, "Meal name is required");
    }

    const userId = requireUserId(req);
    const id = mealModel.create({ userId, name, date, time });

    res.status(201).json(getMealWithItems(id, userId));
  },
  "Create meal error",
  "Failed to create meal"
);

// PUT /api/meals/:id — update a meal
export const updateMeal = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const { name, date, time } = req.body as MealBody;

    const userId = requireUserId(req);

    if (!mealModel.update({ id, userId, name, date, time })) {
      throw new HttpError(404, "Meal not found");
    }

    res.json(getMealWithItems(id, userId));
  },
  "Update meal error",
  "Failed to update meal"
);

// DELETE /api/meals/:id — delete a meal
export const deleteMeal = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!mealModel.delete({ id, userId: requireUserId(req) })) {
      throw new HttpError(404, "Meal not found");
    }

    res.status(204).send();
  },
  "Delete meal error",
  "Failed to delete meal"
);

// POST /api/meals/:id/items — add food item to meal
export const addMealItem = asyncHandler(
  async (req, res) => {
    const { id: mealId } = req.params;
    const { name, amount, calories, protein, carbs, fat } = req.body as MealItemBody;

    if (!name) {
      throw new HttpError(400, "Food name is required");
    }

    // Verify ownership
    if (!mealModel.ownsMeal({ mealId, userId: requireUserId(req) })) {
      throw new HttpError(404, "Meal not found");
    }

    const id = mealItemModel.create({
      mealId,
      name,
      amount,
      calories,
      protein,
      carbs,
      fat,
    });

    const data = requireFound(mealItemModel.findById(id));
    res.status(201).json(renderMealItem(data));
  },
  "Add food item error",
  "Failed to add food item"
);

// PUT /api/meals/:id/items/:itemId — update food item
export const updateMealItem = asyncHandler(
  async (req, res) => {
    const { id: mealId, itemId } = req.params;
    const { name, amount, calories, protein, carbs, fat } = req.body as MealItemBody;

    // Verify ownership
    if (!mealModel.ownsMeal({ mealId, userId: requireUserId(req) })) {
      throw new HttpError(404, "Meal not found");
    }

    const updated = mealItemModel.update({
      itemId,
      mealId,
      name,
      amount,
      calories,
      protein,
      carbs,
      fat,
    });

    if (!updated) {
      throw new HttpError(404, "Food item not found");
    }

    const data = requireFound(mealItemModel.findById(itemId));
    res.json(renderMealItem(data));
  },
  "Update food item error",
  "Failed to update food item"
);

// DELETE /api/meals/:id/items/:itemId — delete food item
export const deleteMealItem = asyncHandler(
  async (req, res) => {
    const { id: mealId, itemId } = req.params;

    // Verify ownership
    if (!mealModel.ownsMeal({ mealId, userId: requireUserId(req) })) {
      throw new HttpError(404, "Meal not found");
    }

    if (!mealItemModel.delete({ itemId, mealId })) {
      throw new HttpError(404, "Food item not found");
    }

    res.status(204).send();
  },
  "Delete food item error",
  "Failed to delete food item"
);
