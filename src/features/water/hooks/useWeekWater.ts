import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { waterApi } from '@/features/water/api';
import { currentWeek } from '@/lib/date';
import type { WeekDay } from '@/lib/date';
import type { DailyWater } from '@/types';

export interface WaterDay extends WeekDay {
  /** null em dia futuro ou quando o dia não pôde ser carregado. */
  water: DailyWater | null;
}

/**
 * Água de cada dia da semana corrente (segunda a domingo). Dias futuros não são
 * buscados. Hoje vem do estado ao vivo da tela, não daqui: assim a barra de hoje
 * acompanha o toque sem esperar uma recarga.
 */
export function useWeekWater() {
  const [days, setDays] = useState<WaterDay[]>(() => currentWeek().map((d) => ({ ...d, water: null })));

  const refetch = useCallback(async () => {
    const week = currentWeek();
    const loaded = await Promise.all(
      week.map(async (d) => {
        if (d.isFuture || d.isToday) return { ...d, water: null };
        try {
          return { ...d, water: await waterApi.get(d.iso) };
        } catch {
          // Um dia que falha vira lacuna no gráfico; não derruba a tela.
          return { ...d, water: null };
        }
      })
    );
    setDays(loaded);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  return days;
}
