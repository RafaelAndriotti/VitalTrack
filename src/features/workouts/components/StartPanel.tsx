import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EmptyState, useDialog } from '@/components/ui';
import { NewWorkoutCard } from './NewWorkoutCard';
import { HistoryCard } from './HistoryCard';
import { TemplatesSection } from './TemplatesSection';
import { TemplateEditor } from './TemplateEditor';
import type { WorkoutsApi } from '@/features/workouts/hooks/useWorkouts';
import { Colors, Spacing, FontSize, Font } from '@/constants/theme';
import type { WorkoutTemplate } from '@/types';

/** Sem treino em andamento: meus treinos (modelos), treino livre e histórico. */
export function StartPanel({ data }: { data: WorkoutsApi }) {
  const dialog = useDialog();
  // null = lista; 'new' = criar modelo; objeto = editar esse modelo.
  const [editing, setEditing] = useState<WorkoutTemplate | 'new' | null>(null);

  if (editing !== null) {
    return (
      <TemplateEditor
        template={editing === 'new' ? undefined : editing}
        data={data}
        onDone={() => setEditing(null)}
      />
    );
  }

  async function handleReopen(workoutId: string) {
    // Garante no máximo um treino em andamento. (Aqui não há ativo; a checagem
    // cobre o caso de a lista ter mudado entre o render e o toque.)
    if (data.active) {
      await dialog.alert({
        title: 'Treino em andamento',
        message: 'Você já possui um treino em andamento. Conclua-o ou exclua-o antes de editar outro treino.',
      });
      return;
    }
    await data.reopenWorkout(workoutId);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Registro de treino</Text>

      <TemplatesSection data={data} onNew={() => setEditing('new')} onEdit={setEditing} />

      <Text style={styles.sectionTitle}>Treino livre</Text>
      <NewWorkoutCard onStart={data.startWorkout} />

      <Text style={styles.sectionTitle}>Histórico</Text>
      {data.history.length === 0 ? (
        <EmptyState text="Nenhum treino realizado ainda." />
      ) : (
        data.history.map((workout) => (
          <HistoryCard key={workout.id} workout={workout} onReopen={() => handleReopen(workout.id)} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5 },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text, marginTop: Spacing.sm },
});
