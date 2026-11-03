import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import { GroupTags } from './GroupTags';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';
import type { Workout } from '@/types';

export function HistoryCard({ workout, onReopen }: { workout: Workout; onReopen: () => void }) {
  const exercises = workout.exercises ?? [];
  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{workout.name}</Text>
          <Text style={styles.date}>
            {new Date(workout.date + 'T00:00:00').toLocaleDateString('pt-BR')}
          </Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.reopenBtn} onPress={onReopen}>
          <Text style={styles.reopenText}>Editar</Text>
        </Pressable>
      </View>
      <GroupTags groups={workout.muscle_groups} />
      <Text style={styles.sub}>{exercises.length} exercícios</Text>
      {exercises.length > 0 ? (
        <View style={styles.exercises}>
          {exercises.map((ex) => (
            <Text key={ex.id} style={styles.exerciseItem}>
              {ex.name} · {ex.exercise_sets?.length || 0} séries
            </Text>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: Spacing.sm },
  title: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  date: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium, marginTop: 1 },
  reopenBtn: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  reopenText: { color: Colors.text, fontSize: FontSize.xs, fontFamily: Font.semibold },
  sub: { fontSize: FontSize.sm, color: Colors.primary, marginBottom: Spacing.sm, marginTop: Spacing.xs, fontFamily: Font.semibold },
  exercises: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, gap: 4 },
  exerciseItem: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular },
});
