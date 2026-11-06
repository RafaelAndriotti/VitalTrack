import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { waterApi } from '@/features/water/api';
import { currentWeek } from '@/lib/date';
import type { WeekDay } from '@/lib/date';
import type { DailyWater } from '@/types';

export interface WaterDay extends WeekDay {
  /** null em dia futuro, em hoje (vem do estado ao vivo) ou quando o dia falhou. */
  water: DailyWater | null;
  /** true quando a busca deste dia falhou: a barra mostra "—" e toque recarrega o dia. */
  failed: boolean;
}

/**
 * Água de cada dia da semana corrente (segunda a domingo). Dias futuros não são
 * buscados. Hoje vem do estado ao vivo da tela, não daqui: assim a barra de hoje
 * acompanha o toque sem esperar uma recarga.
 */
export function useWeekWater() {
  const [days, setDays] = useState<WaterDay[]>(() =>
    currentWeek().map((d) => ({ ...d, water: null, failed: false }))
  );

  const refetch = useCallback(async () => {
    const week = currentWeek();
    const loaded = await Promise.all(
      week.map(async (d): Promise<WaterDay> => {
        if (d.isFuture || d.isToday) return { ...d, water: null, failed: false };
        try {
          return { ...d, water: await waterApi.get(d.iso), failed: false };
        } catch {
          // Um dia que falha não derruba a semana: fica marcado para o usuário recarregar.
          return { ...d, water: null, failed: true };
        }
      })
    );
    setDays(loaded);
  }, []);

  /** Recarrega um único dia (toque na barra com "—"). */
  const reloadDay = useCallback(async (iso: string) => {
    try {
      const water = await waterApi.get(iso);
      setDays((prev) => prev.map((d) => (d.iso === iso ? { ...d, water, failed: false } : d)));
    } catch {
      // Continua marcado como falha; o usuário pode tentar de novo.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  return { days, reloadDay };
}
