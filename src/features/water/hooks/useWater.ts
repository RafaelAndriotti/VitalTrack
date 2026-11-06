import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { waterApi } from '@/features/water/api';
import {
  DEFAULT_WATER_GOAL,
  WATER_GOAL_MAX,
  WATER_GOAL_MIN,
  WATER_GOAL_DEBOUNCE_MS,
  WATER_GOAL_STEP,
} from '@/features/water/constants';
import { errorMessage, rawErrorMessage } from '@/services/http';
import { todayISO } from '@/lib/date';
import type { DailyWater } from '@/types';

export type GoalStatus = 'idle' | 'saving' | 'saved';

export function useWater() {
  const [daily, setDaily] = useState<DailyWater | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [goalStatus, setGoalStatus] = useState<GoalStatus>('idle');
  // Espelho síncrono do estado: toques rápidos não calculam sobre valor velho.
  const latest = useRef<DailyWater | null>(null);
  // Sequência de operações (envios e recargas): só a mais recente aplica resposta
  // ou reverte; respostas fora de ordem são descartadas.
  const seq = useRef(0);
  // Meta: o ajuste com +/− é salvo depois de uma pausa, não a cada toque.
  const goalTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((next: DailyWater | null) => {
    latest.current = next;
    setDaily(next);
  }, []);

  /** Recarrega o dia. O erro só é limpo em sucesso; `keepError` preserva um erro de save já exibido. */
  const refetch = useCallback(async ({ keepError = false }: { keepError?: boolean } = {}) => {
    const mine = ++seq.current;
    try {
      const data = await waterApi.get(todayISO());
      if (mine === seq.current) {
        apply(data);
        if (!keepError) setError('');
      }
    } catch (err) {
      if (mine === seq.current) setError(rawErrorMessage(err, 'Erro ao carregar hidratação'));
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  useEffect(() => () => {
    if (goalTimer.current) clearTimeout(goalTimer.current);
  }, []);

  const optimistic = (amount_ml: number, goal_ml: number): DailyWater => ({
    id: latest.current?.id ?? '',
    user_id: latest.current?.user_id ?? '',
    date: latest.current?.date ?? todayISO(),
    amount_ml,
    goal_ml,
  });

  /**
   * Soma (ou subtrai, se negativo) `ml` ao total do dia.
   * Retorna false quando a soma seria recusada (passaria da meta).
   */
  async function addWater(ml: number): Promise<boolean> {
    const currentAmount = latest.current?.amount_ml ?? 0;
    const currentGoal = latest.current?.goal_ml ?? DEFAULT_WATER_GOAL;
    // Ao adicionar, o total não pode ultrapassar a meta. Para registrar mais,
    // o usuário precisa aumentar a meta primeiro.
    if (ml > 0 && currentAmount + ml > currentGoal) {
      setError(
        `Passa a meta em ${(currentAmount + ml - currentGoal).toLocaleString('pt-BR')} ml. Aumente a meta ou use um valor menor.`
      );
      return false;
    }
    setError('');
    const next = Math.max(0, currentAmount + ml);
    apply(optimistic(next, currentGoal)); // otimista, mesmo sem registro prévio do dia
    const mine = ++seq.current;
    try {
      // Primeiro save do dia: envia a meta exibida para o backend não gravar o padrão.
      const saved = await waterApi.save({
        date: todayISO(),
        amount_ml: next,
        ...(latest.current?.id ? {} : { goal_ml: currentGoal }),
      });
      if (mine === seq.current) apply(saved);
    } catch (err) {
      if (mine !== seq.current) return true;
      setError(errorMessage(err, 'Erro ao registrar água'));
      void refetch({ keepError: true });
    }
    return true;
  }

  /** Muda a meta em passos de 250 ml. Salva após a pausa de digitação. */
  function stepGoal(delta: number) {
    const current = latest.current?.goal_ml ?? DEFAULT_WATER_GOAL;
    const next = Math.min(WATER_GOAL_MAX, Math.max(WATER_GOAL_MIN, current + delta * WATER_GOAL_STEP));
    if (next === current) return;
    apply(optimistic(latest.current?.amount_ml ?? 0, next));
    setGoalStatus('saving');
    if (goalTimer.current) clearTimeout(goalTimer.current);
    goalTimer.current = setTimeout(() => void saveGoal(), WATER_GOAL_DEBOUNCE_MS);
  }

  async function saveGoal() {
    goalTimer.current = null;
    const goal = latest.current?.goal_ml ?? DEFAULT_WATER_GOAL;
    const mine = ++seq.current;
    try {
      const saved = await waterApi.save({ date: todayISO(), goal_ml: goal });
      if (mine === seq.current) {
        apply(saved);
        setGoalStatus('saved');
      }
    } catch (err) {
      if (mine !== seq.current) return;
      setGoalStatus('idle');
      setError(errorMessage(err, 'Erro ao atualizar meta'));
      void refetch({ keepError: true });
    }
  }

  return {
    loading,
    error,
    amount: daily?.amount_ml ?? 0,
    goal: daily?.goal_ml ?? DEFAULT_WATER_GOAL,
    goalStatus,
    addWater,
    stepGoal,
  };
}
