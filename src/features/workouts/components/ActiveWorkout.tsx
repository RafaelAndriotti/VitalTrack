import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus, Check } from 'lucide-react-native';
import { Button, useConfirm } from '@/components/ui';
import { ActiveWorkoutHeader } from './ActiveWorkoutHeader';
import { ExerciseCard } from './ExerciseCard';
import { ExercisePicker } from './ExercisePicker';
import { useBusy } from '@/lib/useBusy';
import type { WorkoutsApi } from '@/features/workouts/hooks/useWorkouts';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import type { Workout } from '@/types';

interface ActiveWorkoutProps {
  workout: Workout;
  data: WorkoutsApi;
  /** Chamado após o treino ser marcado como concluído com sucesso. */
  onFinished: (workoutId: string) => void;
}

export function ActiveWorkout({ workout, data, onFinished }: ActiveWorkoutProps) {
  const confirm = useConfirm();
  const [picking, setPicking] = useState(false);
  const pick = useBusy();
  const finishing = useBusy();
  const deleting = useBusy();

  // Guarda cobre também o diálogo: toque duplo não abre dois pedidos de confirmação.
  const handleDelete = () =>
    deleting.guard(async () => {
      const ok = await confirm({
        title: 'Excluir treino',
        message: `Cancelar e excluir "${workout.name}"? Os exercícios e séries serão perdidos.`,
        confirmText: 'Excluir',
        destructive: true,
      });
      if (ok) await data.removeWorkout(workout.id);
    });

  async function handlePick(name: string) {
    const ok = await pick.guard(() => data.addExercise(workout.id, name));
    if (ok) setPicking(false);
  }

  const handleFinish = () => {
    void finishing.guard(async () => {
      const ok = await data.finishWorkout(workout.id);
      if (ok) onFinished(workout.id);
    });
  };

  return (
    <View style={styles.container}>
      <ActiveWorkoutHeader
        workout={workout}
        onRename={(name) => data.renameWorkout(workout.id, name)}
        onDelete={() => void handleDelete()}
        onFinish={handleFinish}
      />

      {workout.exercises?.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onRename={(name) => data.renameExercise(workout.id, exercise.id, name)}
          onRemove={() => data.removeExercise(workout.id, exercise.id)}
          onAddSet={() => data.addSet(workout.id, exercise.id, exercise.exercise_sets?.length ?? 0)}
          onUpdateSet={(setId, fields) => data.updateSet(workout.id, exercise.id, setId, fields)}
          onRemoveSet={(setId) => data.removeSet(workout.id, exercise.id, setId)}
        />
      ))}

      {picking ? (
        <ExercisePicker
          library={data.library}
          groups={workout.muscle_groups ?? []}
          onPick={handlePick}
          onCancel={() => setPicking(false)}
        />
      ) : (
        <Pressable accessibilityRole="button" style={styles.addExercise} onPress={() => setPicking(true)}>
          <Plus size={Icon.sm} color={Colors.primary} strokeWidth={Icon.stroke} />
          <Text style={styles.addExerciseText}>Adicionar exercício</Text>
        </Pressable>
      )}

      <Button
        label="Finalizar treino"
        icon={<Check size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />}
        style={styles.finish}
        loading={finishing.busy}
        onPress={handleFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  addExercise: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primarySoft,
  },
  addExerciseText: { fontSize: FontSize.sm, color: Colors.primary, fontFamily: Font.semibold },
  finish: { marginTop: Spacing.sm, ...Elevation.card },
});
