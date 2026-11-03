import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Play } from 'lucide-react-native';
import { Card, Button } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import type { Workout } from '@/types';

export function WorkoutHeroCard({ active }: { active: Workout | null }) {
  if (active) {
    const exercises = active.exercises ?? [];
    const sets = exercises.flatMap((e) => e.exercise_sets ?? []);
    const done = sets.filter((s) => s.completed).length;
    const pct = sets.length > 0 ? done / sets.length : 0;

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Continuar ${active.name}, ${done} de ${sets.length} séries`}
        onPress={() => router.push('/(tabs)/workouts')}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <Card style={styles.activeCard}>
          <View style={styles.activeTop}>
            <View style={styles.dot} />
            <Text style={styles.activeStatus}>Treino em andamento</Text>
            <ChevronRight size={Icon.md} color={Colors.textInverted} strokeWidth={2} style={styles.chevron} />
          </View>
          <Text style={styles.activeName}>{active.name}</Text>
          <Text style={styles.activeMeta}>
            {exercises.length} exercício{exercises.length === 1 ? '' : 's'} · {done} de {sets.length} séries
          </Text>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
          </View>
        </Card>
      </Pressable>
    );
  }

  return (
    <Card style={styles.startCard}>
      <View>
        <Text style={styles.startTitle}>Treino de hoje</Text>
        <Text style={styles.startSub}>Nenhum treino em andamento</Text>
      </View>
      <Button
        label="Iniciar treino"
        glow
        icon={<Play size={Icon.sm} color={Colors.textInverted} fill={Colors.textInverted} strokeWidth={Icon.stroke} />}
        onPress={() => router.push('/(tabs)/workouts')}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },

  activeCard: { backgroundColor: Colors.primary, borderColor: Colors.primary, gap: Spacing.xs, ...Elevation.glow },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 8, height: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.textInverted },
  activeStatus: { flex: 1, fontSize: FontSize.sm, color: Colors.textInverted, fontFamily: Font.semibold },
  chevron: { marginRight: -4 },
  activeName: { fontSize: FontSize.xxl, color: Colors.textInverted, fontFamily: Font.bold, letterSpacing: -0.5 },
  activeMeta: {
    fontSize: FontSize.sm,
    color: Colors.textInverted,
    fontFamily: Font.medium,
    opacity: 0.8,
    fontVariant: ['tabular-nums'],
  },
  bar: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(11, 13, 16, 0.18)',
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  barFill: { height: '100%', borderRadius: BorderRadius.full, backgroundColor: Colors.textInverted },

  startCard: { gap: Spacing.md },
  startTitle: { fontSize: FontSize.lg, color: Colors.text, fontFamily: Font.semibold },
  startSub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular, marginTop: 2 },
});
