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
import { validate } from "../middlewares/validate.js";
import {
  idParams,
  itemParams,
  listMealsQuery,
  createFoodLibraryBody,
  createMealBody,
  updateMealBody,
  createMealItemBody,
  updateMealItemBody,
} from "../validators/meals.validator.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Food library
router.get("/library/foods", listFoodLibrary);
router.post("/library/foods", validate({ body: createFoodLibraryBody }), createFoodLibrary);
router.delete("/library/foods/:id", validate({ params: idParams }), deleteFoodLibrary);

// Meals
router.get("/", validate({ query: listMealsQuery }), listMeals);
router.post("/", validate({ body: createMealBody }), createMeal);
router.put("/:id", validate({ params: idParams, body: updateMealBody }), updateMeal);
router.delete("/:id", validate({ params: idParams }), deleteMeal);

// Meal items
router.post("/:id/items", validate({ params: idParams, body: createMealItemBody }), addMealItem);
router.put(
  "/:id/items/:itemId",
  validate({ params: itemParams, body: updateMealItemBody }),
  updateMealItem
);
router.delete("/:id/items/:itemId", validate({ params: itemParams }), deleteMealItem);

export default router;
