import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { mealsApi } from '@/features/diet/api';
import { mealBandFor } from '@/features/diet/constants';
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

const pad = (n: number) => String(n).padStart(2, '0');

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

  /**
   * Refeição de destino para "Alimento": a do horário atual, se já existir; senão cria
   * a refeição da faixa (Café da manhã, Almoço…) com o horário de agora.
   */
  const ensureMealForNow = async (): Promise<Meal | null> => {
    try {
      setError('');
      const now = new Date();
      const band = mealBandFor(now.getHours());
      const todays = await mealsApi.list(todayISO());
      const inBand = todays.find((m) => {
        if (!m.time) return false;
        const h = Number(m.time.split(':')[0]);
        return band.fromHour < band.toHour
          ? h >= band.fromHour && h < band.toHour
          : h >= band.fromHour || h < band.toHour;
      });
      if (inBand) return inBand;
      const created = await mealsApi.create({
        name: band.name,
        date: todayISO(),
        time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
      });
      await load();
      return created;
    } catch (err) {
      setError(errorMessage(err, 'Erro ao preparar refeição'));
      return null;
    }
  };

  const removeMeal = (mealId: string) =>
    run(() => mealsApi.remove(mealId), 'Erro ao deletar refeição');

  const removeFood = (mealId: string, itemId: string) =>
    run(() => mealsApi.removeItem(mealId, itemId), 'Erro ao deletar alimento');

  /** Desfazer de exclusão de alimento: recria o item com os mesmos valores. */
  const restoreFood = (mealId: string, item: CreateMealItemPayload) =>
    run(() => mealsApi.addItem(mealId, item), 'Erro ao desfazer exclusão');

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
    ensureMealForNow,
    removeMeal,
    removeFood,
    restoreFood,
    addLibraryFoodToMeal,
    addCustomFoodToMeal,
  };
}
