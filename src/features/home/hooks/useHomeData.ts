import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { workoutsApi } from '@/features/workouts/api';
import { mealsApi } from '@/features/diet/api';
import { waterApi } from '@/features/water/api';
import { rawErrorMessage } from '@/services/http';
import { todayISO } from '@/lib/date';
import type { Workout, Meal, DailyWater } from '@/types';

export function useHomeData() {
  const [active, setActive] = useState<Workout | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [daily, setDaily] = useState<DailyWater | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    const date = todayISO();
    try {
      setError('');
      const [workoutList, mealList, waterData] = await Promise.all([
        workoutsApi.list(),
        mealsApi.list(date),
        waterApi.get(date),
      ]);
      setActive(workoutList.find((w) => !w.completed) || null);
      setMeals(mealList);
      setDaily(waterData);
    } catch (err) {
      setError(rawErrorMessage(err, 'Erro ao carregar'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void refetch();
  }, [refetch]);

  return { active, meals, daily, loading, refreshing, error, refresh };
}
