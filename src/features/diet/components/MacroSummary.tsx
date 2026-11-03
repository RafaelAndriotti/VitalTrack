import { View, Text, StyleSheet } from 'react-native';
import { Card, ProgressBar } from '@/components/ui';
import { CALORIE_GOAL, PROTEIN_GOAL, CARBS_GOAL, FAT_GOAL } from '@/features/diet/constants';
import { Colors, Spacing, FontSize, Font } from '@/constants/theme';
import type { Meal } from '@/types';

function MacroCol({ label, grams, goal, color }: { label: string; grams: number; goal: number; color: string }) {
  return (
    <View style={styles.macroCol}>
      <View style={styles.macroInfo}>
        <Text style={styles.macroGram}>{grams.toFixed(0)}g</Text>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <ProgressBar value={grams} max={goal} color={color} height={6} />
    </View>
  );
}

export function MacroSummary({ meals }: { meals: Meal[] }) {
  const items = meals.flatMap((m) => m.meal_items || []);
  const sum = (pick: (i: (typeof items)[number]) => number) =>
    items.reduce((total, item) => total + Number(pick(item)), 0);
  const totalCalories = sum((i) => i.calories);

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={styles.calorieRow}>
        <View style={styles.calorieValueRow}>
          <Text style={styles.calorieValue}>{totalCalories.toLocaleString('pt-BR')}</Text>
          <Text style={styles.calorieUnit}>/ {CALORIE_GOAL.toLocaleString('pt-BR')} kcal</Text>
        </View>
        <Text style={styles.calorieLabel}>Consumidas hoje</Text>
      </View>

      <ProgressBar value={totalCalories} max={CALORIE_GOAL} color={Colors.primary} height={12} />

      <View style={styles.macrosRow}>
        <MacroCol label="Proteína" grams={sum((i) => i.protein)} goal={PROTEIN_GOAL} color={Colors.protein} />
        <MacroCol label="Carbos" grams={sum((i) => i.carbs)} goal={CARBS_GOAL} color={Colors.carbs} />
        <MacroCol label="Gordura" grams={sum((i) => i.fat)} goal={FAT_GOAL} color={Colors.fat} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  calorieRow: { gap: 2 },
  calorieValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  calorieValue: { fontSize: FontSize.display, fontFamily: Font.bold, color: Colors.text, letterSpacing: -1 },
  calorieUnit: { fontSize: FontSize.md, color: Colors.textSecondary, fontFamily: Font.medium },
  calorieLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.medium },

  macrosRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  macroCol: { flex: 1, gap: Spacing.xs },
  macroInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  macroGram: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },
});
