import { View, StyleSheet } from 'react-native';
import { Screen, Loading, ErrorBanner, EmptyState, Button } from '@/components/ui';
import { useWorkouts } from '@/features/workouts/hooks/useWorkouts';
import { useState } from 'react';
import { WorkoutTabs, type WorkoutsView } from './WorkoutTabs';
import { ActiveWorkout } from './ActiveWorkout';
import { StartPanel } from './StartPanel';
import { WorkoutSummary } from './WorkoutSummary';
import { ExerciseLibraryPanel } from './ExerciseLibraryPanel';

export function WorkoutsScreen() {
  const data = useWorkouts();
  const [view, setView] = useState<WorkoutsView>('treino');
  // Treino recém-finalizado, exibido no resumo até o usuário ir ao histórico.
  const [summaryId, setSummaryId] = useState<string | null>(null);

  if (data.loading && !data.refreshing) return <Loading />;

  const summary = summaryId ? data.history.find((w) => w.id === summaryId) : undefined;

  return (
    <Screen onRefresh={data.refresh} refreshing={data.refreshing}>
      <ErrorBanner message={data.error} />
      <WorkoutTabs view={view} onChange={setView} />

      {/* Os dois painéis ficam montados e só alternam visibilidade: trocar de
          aba interna não pode perder formulários nem edição pendente. */}
      <View style={view === 'treino' ? undefined : styles.hidden}>
        {!data.loaded ? (
          // Sem carga bem-sucedida não sabemos se há treino ativo: não oferecer
          // "Iniciar novo treino" (poderia criar um segundo treino em andamento).
          <View style={styles.retry}>
            <EmptyState text="Não foi possível carregar seus treinos." />
            <Button label="Tentar novamente" variant="secondary" size="sm" onPress={data.refresh} loading={data.refreshing} />
          </View>
        ) : summary ? (
          <WorkoutSummary workout={summary} data={data} onViewHistory={() => setSummaryId(null)} />
        ) : data.active ? (
          <ActiveWorkout
            key={data.active.id}
            workout={data.active}
            data={data}
            onFinished={setSummaryId}
          />
        ) : (
          <StartPanel data={data} />
        )}
      </View>
      <View style={view === 'exercicios' ? undefined : styles.hidden}>
        <ExerciseLibraryPanel data={data} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hidden: { display: 'none' },
  retry: { gap: 12, alignItems: 'center' },
});
