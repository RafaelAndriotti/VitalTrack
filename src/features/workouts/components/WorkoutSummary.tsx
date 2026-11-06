import { View, Text, StyleSheet } from 'react-native';
import { Check, Repeat } from 'lucide-react-native';
import { Button, Card } from '@/components/ui';
import { GroupTags } from './GroupTags';
import { useBusy } from '@/lib/useBusy';
import type { WorkoutsApi } from '@/features/workouts/hooks/useWorkouts';
import { Colors, Spacing, FontSize, Font, Icon } from '@/constants/theme';
import type { Workout } from '@/types';

interface WorkoutSummaryProps {
  workout: Workout;
  data: WorkoutsApi;
  onViewHistory: () => void;
}

/** Resumo exibido logo após finalizar um treino. */
export function WorkoutSummary({ workout, data, onViewHistory }: WorkoutSummaryProps) {
  const reopen = useBusy();
  const exercises = workout.exercises ?? [];
  const sets = exercises.flatMap((e) => e.exercise_sets ?? []);
  const doneSets = sets.filter((s) => s.completed);
  const volume = doneSets.reduce((sum, s) => sum + Number(s.weight) * Number(s.reps), 0);
  const kcal = Math.round(workout.calories_burned ?? 0);
  const weight = Math.round((workout.weight_kg_used ?? 0) * 10) / 10;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Treino concluído</Text>
      <Text style={styles.title}>{workout.name}</Text>
      <GroupTags groups={workout.muscle_groups} />

      <Card>
        <Text style={styles.label}>Calorias queimadas · estimado</Text>
        <Text style={styles.big}>
          {kcal.toLocaleString('pt-BR')} <Text style={styles.unit}>kcal</Text>
        </Text>
        <Text style={styles.hint}>
          {workout.estimated
            ? `${weight} kg (padrão, sem peso cadastrado)`
            : `${weight} kg`}
          {' · cálculo pelas séries concluídas'}
        </Text>
      </Card>

      <View style={styles.metrics}>
        <Metric value={exercises.length} label="Exercícios" />
        <Metric value={`${doneSets.length} de ${sets.length}`} label="Séries" />
        <Metric value={`${Math.round(volume).toLocaleString('pt-BR')} kg`} label="Volume" />
      </View>

      <Text style={styles.section}>Exercícios</Text>
      {exercises.map((ex) => (
        <Card key={ex.id}>
          <Text style={styles.exName}>{ex.name}</Text>
          {(ex.exercise_sets ?? []).map((s, i) => (
            <View key={s.id} style={styles.setRow}>
              <Text style={styles.setText}>Série {i + 1}</Text>
              <Text style={styles.setText}>{Number(s.weight)} kg × {s.reps}</Text>
              <Text style={s.completed ? styles.done : styles.missed}>
                {s.completed ? 'feita' : 'não feita'}
              </Text>
            </View>
          ))}
        </Card>
      ))}

      <View style={styles.actions}>
        <Button
          label="Reabrir treino"
          variant="secondary"
          icon={<Repeat size={Icon.sm} color={Colors.text} strokeWidth={Icon.stroke} />}
          style={styles.action}
          loading={reopen.busy}
          onPress={() => void reopen.guard(() => data.reopenWorkout(workout.id))}
        />
        <Button
          label="Ver histórico"
          glow
          icon={<Check size={Icon.sm} color={Colors.textInverted} strokeWidth={Icon.stroke} />}
          style={styles.action}
          onPress={onViewHistory}
        />
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  eyebrow: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium },
  title: { fontSize: FontSize.xxl, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium },
  big: { fontSize: FontSize.display, fontFamily: Font.bold, color: Colors.primary, marginTop: Spacing.xs },
  unit: { fontSize: FontSize.md, fontFamily: Font.semibold },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.regular, marginTop: 2 },
  metrics: { flexDirection: 'row', gap: Spacing.sm },
  metric: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 16, padding: Spacing.md },
  metricValue: { fontSize: FontSize.md, fontFamily: Font.bold, color: Colors.text },
  metricLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium, marginTop: 2 },
  section: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text, marginTop: Spacing.sm },
  exName: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text, marginBottom: Spacing.sm },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  setText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular },
  done: { fontSize: FontSize.sm, color: Colors.primary, fontFamily: Font.semibold },
  missed: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.regular },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  action: { flex: 1 },
});
