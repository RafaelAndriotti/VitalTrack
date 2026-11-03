import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Droplets } from 'lucide-react-native';
import { Card, ProgressBar } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

interface WaterHeroProps {
  amount: number;
  goal: number;
  goalInput: string;
  onGoalChange: (text: string) => void;
  onGoalCommit: () => void;
}

export function WaterHero({ amount, goal, goalInput, onGoalChange, onGoalCommit }: WaterHeroProps) {
  const pct = goal > 0 ? Math.round((amount / goal) * 100) : 0;
  const remaining = Math.max(0, goal - amount);

  return (
    <Card style={styles.hero}>
      <View style={styles.heroTop}>
        <View style={styles.badge}>
          <Droplets size={Icon.sm} color={Colors.water} strokeWidth={Icon.stroke} />
        </View>
        <View style={styles.goalRow}>
          <Text style={styles.goalLabel}>Meta</Text>
          <TextInput
            style={styles.goalInput}
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

      <View style={styles.readout}>
        <Text style={styles.amount}>{amount.toLocaleString('pt-BR')}</Text>
        <Text style={styles.unit}>ml</Text>
      </View>
      <Text style={styles.sub}>
        {pct}% da meta
        {remaining > 0 ? ` · faltam ${remaining.toLocaleString('pt-BR')} ml` : ' · meta atingida'}
      </Text>

      <View style={styles.barWrap}>
        <ProgressBar value={amount} max={goal} color={Colors.water} height={12} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.sm },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.waterSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  goalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  goalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 64,
    textAlign: 'center',
    color: Colors.text,
    fontSize: FontSize.sm,
    fontFamily: Font.semibold,
  },
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginTop: Spacing.sm },
  amount: { fontSize: FontSize.display, fontFamily: Font.bold, color: Colors.text, letterSpacing: -1 },
  unit: { fontSize: FontSize.lg, fontFamily: Font.medium, color: Colors.textSecondary },
  sub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  barWrap: { marginTop: Spacing.sm },
});
