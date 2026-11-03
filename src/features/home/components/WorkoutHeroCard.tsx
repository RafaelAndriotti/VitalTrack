import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, ChevronRight, Play } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import type { Workout } from '@/types';

export function WorkoutHeroCard({ active }: { active: Workout | null }) {
  if (active) {
    const count = active.exercises?.length || 0;
    return (
      <Pressable onPress={() => router.push('/(tabs)/workouts')}>
        <Card style={styles.activeCard}>
          <View style={styles.activeTop}>
            <View style={styles.activeIcon}>
              <Dumbbell size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
            </View>
            <View style={styles.dot} />
            <Text style={styles.activeStatus}>Em andamento</Text>
          </View>
          <Text style={styles.activeName}>{active.name}</Text>
          <Text style={styles.activeMeta}>
            {count} exercício{count === 1 ? '' : 's'} · continuar
          </Text>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push('/(tabs)/workouts')}>
      <Card style={styles.startCard}>
        <View style={styles.startLeft}>
          <View style={styles.startIcon}>
            <Play size={Icon.sm} color={Colors.primary} strokeWidth={Icon.stroke} fill={Colors.primary} />
          </View>
          <View>
            <Text style={styles.startTitle}>Iniciar treino</Text>
            <Text style={styles.startSub}>Nenhum treino em andamento</Text>
          </View>
        </View>
        <ChevronRight size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeCard: { backgroundColor: Colors.primary, borderColor: Colors.primary, gap: Spacing.xs, ...Elevation.raised },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(8, 17, 15, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.textInverted, marginLeft: 'auto' },
  activeStatus: { fontSize: FontSize.xs, color: Colors.textInverted, fontFamily: Font.semibold, opacity: 0.8 },
  activeName: { fontSize: FontSize.xl, color: Colors.textInverted, fontFamily: Font.bold, marginTop: Spacing.xs },
  activeMeta: { fontSize: FontSize.sm, color: Colors.textInverted, fontFamily: Font.medium, opacity: 0.75 },

  startCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  startIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startTitle: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  startSub: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.regular, marginTop: 1 },
});
