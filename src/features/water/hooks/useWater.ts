import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { waterApi } from '@/features/water/api';
import { DEFAULT_WATER_GOAL, MAX_WATER_ML } from '@/features/water/constants';
import { errorMessage, rawErrorMessage } from '@/services/http';
import { todayISO } from '@/lib/date';
import type { DailyWater } from '@/types';

export function useWater() {
  const [daily, setDaily] = useState<DailyWater | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [goalInput, setGoalInput] = useState(String(DEFAULT_WATER_GOAL));
  // Espelho síncrono do estado: toques rápidos não calculam sobre valor velho.
  const latest = useRef<DailyWater | null>(null);
  // Sequência de operações (envios e recargas): só a mais recente aplica resposta
  // ou reverte; respostas fora de ordem são descartadas.
  const seq = useRef(0);

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

  // Sincroniza o texto do campo de meta quando o valor chega do servidor,
  // sem sobrescrever o que o usuário está digitando (só reage a goal_ml).
  const goalMl = daily?.goal_ml;
  useEffect(() => {
    setGoalInput(goalMl !== undefined ? String(goalMl) : String(DEFAULT_WATER_GOAL));
  }, [goalMl]);

  const optimistic = (amount_ml: number, goal_ml: number): DailyWater => ({
    id: latest.current?.id ?? '',
    user_id: latest.current?.user_id ?? '',
    date: latest.current?.date ?? todayISO(),
    amount_ml,
    goal_ml,
  });

  /** Soma (ou subtrai, se negativo) `ml` ao total do dia. */
  async function addWater(ml: number) {
    const currentAmount = latest.current?.amount_ml ?? 0;
    const currentGoal = latest.current?.goal_ml ?? DEFAULT_WATER_GOAL;
    // Ao adicionar, o total não pode ultrapassar a meta. Para registrar mais,
    // o usuário precisa aumentar a meta primeiro.
    if (ml > 0 && currentAmount + ml > currentGoal) {
      setError(
        `Meta de ${currentGoal.toLocaleString('pt-BR')} ml atingida. Aumente a meta para registrar mais.`
      );
      return;
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
      if (mine !== seq.current) return;
      setError(errorMessage(err, 'Erro ao registrar água'));
      void refetch({ keepError: true });
    }
  }

  async function commitGoal() {
    const num = parseInt(goalInput, 10);
    if (isNaN(num) || num <= 0) {
      // Texto inválido/vazio: restaura o valor válido atual em vez de gravar lixo.
      setGoalInput(latest.current ? String(latest.current.goal_ml) : String(DEFAULT_WATER_GOAL));
      return;
    }
    if (num > MAX_WATER_ML) {
      setError(`A meta máxima é ${MAX_WATER_ML.toLocaleString('pt-BR')} ml.`);
      setGoalInput(latest.current ? String(latest.current.goal_ml) : String(DEFAULT_WATER_GOAL));
      return;
    }
    // onBlur e onSubmitEditing disparam ambos: sem mudança, não envia.
    if (num === (latest.current?.goal_ml ?? DEFAULT_WATER_GOAL)) {
      setGoalInput(String(num));
      return;
    }
    apply(optimistic(latest.current?.amount_ml ?? 0, num));
    const mine = ++seq.current;
    try {
      const saved = await waterApi.save({ date: todayISO(), goal_ml: num });
      if (mine === seq.current) apply(saved);
    } catch (err) {
      if (mine !== seq.current) return;
      setError(errorMessage(err, 'Erro ao atualizar meta'));
      void refetch({ keepError: true });
    }
  }

  return {
    loading,
    error,
    amount: daily?.amount_ml ?? 0,
    goal: daily?.goal_ml ?? DEFAULT_WATER_GOAL,
    goalInput,
    setGoalInput,
    addWater,
    commitGoal,
  };
}
