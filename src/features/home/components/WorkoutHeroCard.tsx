import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, Play } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import type { Workout } from '@/types';

export function WorkoutHeroCard({ active }: { active: Workout | null }) {
  if (active) {
    const count = active.exercises?.length || 0;
    return (
      <Pressable onPress={() => router.push('/(tabs)/workouts')}>
        <Card style={styles.activeCard}>
          <View style={styles.activeTop}>
            <View style={styles.dot} />
            <Text style={styles.activeStatus}>Treino em andamento</Text>
          </View>
          <Text style={styles.activeName}>{active.name}</Text>
          <Text style={styles.activeMeta}>
            {count} exercício{count === 1 ? '' : 's'} · toque para continuar
          </Text>
        </Card>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={() => router.push('/(tabs)/workouts')}>
      <Card style={styles.startCard}>
        <Play size={Icon.md} color={Colors.primary} strokeWidth={Icon.stroke} fill={Colors.primary} />
        <View style={styles.startText}>
          <Text style={styles.startTitle}>Iniciar treino</Text>
          <Text style={styles.startSub}>Nenhum treino em andamento</Text>
        </View>
        <ChevronRight size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeCard: { backgroundColor: Colors.primary, borderColor: Colors.primary, gap: Spacing.xs },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dot: { width: 7, height: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.textInverted },
  activeStatus: { fontSize: FontSize.sm, color: Colors.textInverted, fontFamily: Font.semibold, opacity: 0.85 },
  activeName: { fontSize: FontSize.xl, color: Colors.textInverted, fontFamily: Font.bold, marginTop: Spacing.xs },
  activeMeta: { fontSize: FontSize.sm, color: Colors.textInverted, fontFamily: Font.medium, opacity: 0.75 },

  startCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  startText: { flex: 1 },
  startTitle: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  startSub: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.regular, marginTop: 1 },
});
