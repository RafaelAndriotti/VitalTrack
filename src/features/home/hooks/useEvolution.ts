import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { workoutsApi } from '@/features/workouts/api';
import { rawErrorMessage } from '@/services/http';
import type { Evolution, EvolutionPeriod } from '@/types';

/** Resumo de evolução para o período escolhido; recarrega ao voltar para a home. */
export function useEvolution(period: EvolutionPeriod) {
  const [data, setData] = useState<Evolution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setData(await workoutsApi.evolution(period));
    } catch (err) {
      setError(rawErrorMessage(err, 'Erro ao carregar evolução'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  return { data, loading, error };
}
