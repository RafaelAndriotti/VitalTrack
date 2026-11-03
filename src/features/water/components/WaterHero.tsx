import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Card, Ring } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

interface WaterHeroProps {
  amount: number;
  goal: number;
  goalInput: string;
  onGoalChange: (text: string) => void;
  onGoalCommit: () => void;
}

const br = (n: number) => n.toLocaleString('pt-BR');

export function WaterHero({ amount, goal, goalInput, onGoalChange, onGoalCommit }: WaterHeroProps) {
  const pct = goal > 0 ? Math.round((amount / goal) * 100) : 0;
  const remaining = goal - amount;

  return (
    <Card style={styles.hero}>
      <View style={styles.heroTop}>
        <Text style={styles.heroTitle}>Hoje</Text>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Meta</Text>
          <TextInput
            style={styles.goalInput}
            accessibilityLabel="Meta diária em mililitros"
            keyboardType="numeric"
            value={goalInput}
            onChangeText={onGoalChange}
            onBlur={onGoalCommit}
            onSubmitEditing={onGoalCommit}
            returnKeyType="done"
            maxLength={5}
          />
          <Text style={styles.goalLabel}>ml</Text>
        </View>
      </View>

      <Ring
        arcs={[{ value: amount, max: goal, color: Colors.water, label: 'Hidratação' }]}
        size={184}
        stroke={14}
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
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', gap: Spacing.md },
  heroTitle: { flex: 1, fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexShrink: 0 },
  goalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  goalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    width: 72,
    textAlign: 'center',
    color: Colors.text,
    fontSize: FontSize.sm,
    fontFamily: Font.semibold,
    fontVariant: ['tabular-nums'],
  },

  amount: {
    fontSize: FontSize.xxl,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  unit: { fontSize: FontSize.xs, fontFamily: Font.medium, color: Colors.textSecondary, marginTop: 2 },
  finding: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium, textAlign: 'center' },
});
