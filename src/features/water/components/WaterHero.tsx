import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, Ring } from '@/components/ui';
import { WATER_GOAL_MAX, WATER_GOAL_MIN } from '@/features/water/constants';
import type { GoalStatus } from '@/features/water/hooks/useWater';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

interface WaterHeroProps {
  amount: number;
  goal: number;
  goalStatus: GoalStatus;
  onGoalStep: (delta: number) => void;
}

const br = (n: number) => n.toLocaleString('pt-BR');

export function WaterHero({ amount, goal, goalStatus, onGoalStep }: WaterHeroProps) {
  const pct = goal > 0 ? Math.round((amount / goal) * 100) : 0;
  const remaining = goal - amount;
  const status = goalStatus === 'saving' ? 'Salvando…' : goalStatus === 'saved' ? 'Salvo' : '';

  return (
    <Card style={styles.hero}>
      <View style={styles.goalRow}>
        <Text style={styles.goalLabel}>Meta diária</Text>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Diminuir meta em 250 ml"
            accessibilityState={{ disabled: goal <= WATER_GOAL_MIN }}
            disabled={goal <= WATER_GOAL_MIN}
            style={({ pressed }) => [styles.step, pressed && styles.pressed, goal <= WATER_GOAL_MIN && styles.disabled]}
            onPress={() => onGoalStep(-1)}
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.goalValue}>{br(goal)} ml</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar meta em 250 ml"
            accessibilityState={{ disabled: goal >= WATER_GOAL_MAX }}
            disabled={goal >= WATER_GOAL_MAX}
            style={({ pressed }) => [styles.step, pressed && styles.pressed, goal >= WATER_GOAL_MAX && styles.disabled]}
            onPress={() => onGoalStep(1)}
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
        <Text style={styles.status} accessibilityLiveRegion="polite">{status}</Text>
      </View>

      <Ring
        arcs={[{ value: amount, max: goal, color: Colors.water, label: 'Hidratação' }]}
        size={204}
        stroke={16}
      >
        <Text style={styles.amount}>{br(amount)}</Text>
        <Text style={styles.unit}>ml de {br(goal)}</Text>
      </Ring>

      <Text style={styles.finding}>
        {remaining > 0
          ? `${pct}% da meta · faltam ${br(remaining)} ml`
          : `${pct}% da meta · meta atingida`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.md, alignItems: 'center', paddingVertical: Spacing.lg },
  goalRow: { alignSelf: 'stretch', gap: Spacing.xs, alignItems: 'center' },
  goalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  step: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: Colors.text, fontSize: 22, fontFamily: Font.medium, lineHeight: 26 },
  goalValue: {
    minWidth: 96,
    textAlign: 'center',
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.semibold,
    fontVariant: ['tabular-nums'],
  },
  status: { fontSize: FontSize.xs, color: Colors.water, fontFamily: Font.medium, minHeight: 16 },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },

  amount: {
    fontSize: FontSize.display,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  unit: { fontSize: FontSize.xs, fontFamily: Font.medium, color: Colors.textSecondary, marginTop: 2 },
  finding: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium, textAlign: 'center' },
});
