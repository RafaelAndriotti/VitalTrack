import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { mealsApi } from '@/features/diet/api';
import { errorMessage, rawErrorMessage } from '@/services/http';
import { todayISO } from '@/lib/date';
import type { Meal, FoodLibraryItem, CreateMealItemPayload, CreateLibraryFoodPayload } from '@/types';

function sortByTime(list: Meal[]): Meal[] {
  return [...list].sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });
}

export function useMeals() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      // "Hoje" recalculado a cada carga (foco/refresh): o app pode ficar aberto à meia-noite.
      const [mealsData, libraryData] = await Promise.all([
        mealsApi.list(todayISO()),
        mealsApi.listLibraryFoods(),
      ]);
      setMeals(sortByTime(mealsData));
      setFoodLibrary(libraryData);
    } catch (err) {
      setError(rawErrorMessage(err, 'Erro ao carregar dados'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  /** Executa uma mutação e recarrega. Retorna `true` em sucesso. */
  async function run(action: () => Promise<unknown>, failMessage: string): Promise<boolean> {
    try {
      setError('');
      await action();
    } catch (err) {
      setError(errorMessage(err, failMessage));
      return false;
    }
    await load();
    return true;
  }

  const addMeal = (name: string, time: string) =>
    run(
      () => mealsApi.create({ name, date: todayISO(), time: time || undefined }),
      'Erro ao criar refeição'
    );

  const removeMeal = (mealId: string) =>
    run(() => mealsApi.remove(mealId), 'Erro ao deletar refeição');

  const removeFood = (mealId: string, itemId: string) =>
    run(() => mealsApi.removeItem(mealId, itemId), 'Erro ao deletar alimento');

  const addLibraryFoodToMeal = (mealId: string, item: CreateMealItemPayload) =>
    run(() => mealsApi.addItem(mealId, item), 'Erro ao adicionar alimento da biblioteca');

  // Alimento já salvo na biblioteca cujo addItem falhou: o retry reaproveita, sem duplicar.
  const pendingLibraryFood = useRef<{ key: string; saved: FoodLibraryItem } | null>(null);

  /** Cadastra o alimento na biblioteca e já o adiciona à refeição (proporcional à quantidade). */
  const addCustomFoodToMeal = async (
    mealId: string,
    food: CreateLibraryFoodPayload,
    quantity: number
  ): Promise<boolean> => {
    const key = JSON.stringify(food);
    let saved: FoodLibraryItem;
    const pending = pendingLibraryFood.current;
    if (pending && pending.key === key) {
      saved = pending.saved;
    } else {
      pendingLibraryFood.current = null;
      try {
        setError('');
        saved = await mealsApi.addLibraryFood(food);
      } catch (err) {
        setError(errorMessage(err, 'Erro ao cadastrar alimento'));
        return false;
      }
    }
    const ratio = quantity / 100;
    try {
      await mealsApi.addItem(mealId, {
        name: food.name,
        amount: quantity,
        calories: Math.round(saved.calories * ratio),
        protein: Math.round(saved.protein * ratio),
        carbs: Math.round(saved.carbs * ratio),
        fat: Math.round(saved.fat * ratio),
      });
    } catch {
      pendingLibraryFood.current = { key, saved };
      await load(); // mostra o alimento novo na biblioteca
      setError('Alimento salvo na biblioteca, mas não foi adicionado à refeição.');
      return false;
    }
    pendingLibraryFood.current = null;
    await load();
    return true;
  };

  return {
    meals,
    foodLibrary,
    loading,
    refreshing,
    error,
    clearError: () => setError(''),
    refresh,
    addMeal,
    removeMeal,
    removeFood,
    addLibraryFoodToMeal,
    addCustomFoodToMeal,
  };
}
