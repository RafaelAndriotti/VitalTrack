import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import {
  listFoodLibrary,
  createFoodLibrary,
  deleteFoodLibrary,
  listMeals,
  createMeal,
  updateMeal,
  deleteMeal,
  addMealItem,
  updateMealItem,
  deleteMealItem,
} from "../controllers/meals.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Food library
router.get("/library/foods", listFoodLibrary);
router.post("/library/foods", createFoodLibrary);
router.delete("/library/foods/:id", deleteFoodLibrary);

// Meals
router.get("/", listMeals);
router.post("/", createMeal);
router.put("/:id", updateMeal);
router.delete("/:id", deleteMeal);

// Meal items
router.post("/:id/items", addMealItem);
router.put("/:id/items/:itemId", updateMealItem);
router.delete("/:id/items/:itemId", deleteMealItem);

export default router;
