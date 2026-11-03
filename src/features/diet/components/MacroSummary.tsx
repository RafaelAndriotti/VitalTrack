import { View, Text, StyleSheet } from 'react-native';
import { Card, Ring } from '@/components/ui';
import { CALORIE_GOAL, PROTEIN_GOAL, CARBS_GOAL, FAT_GOAL } from '@/features/diet/constants';
import { Colors, Spacing, FontSize, Font } from '@/constants/theme';
import type { Meal } from '@/types';

const br = (n: number) => n.toLocaleString('pt-BR');

function MacroRing({ label, grams, goal, color }: { label: string; grams: number; goal: number; color: string }) {
  return (
    <View style={styles.macro}>
      <Ring arcs={[{ value: grams, max: goal, color, label }]} size={76} stroke={7}>
        <Text style={styles.macroGram}>{grams.toFixed(0)}</Text>
        <Text style={styles.macroUnit}>g</Text>
      </Ring>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroGoal}>de {goal} g</Text>
    </View>
  );
}

export function MacroSummary({ meals }: { meals: Meal[] }) {
  const items = meals.flatMap((m) => m.meal_items || []);
  const sum = (pick: (i: (typeof items)[number]) => number) =>
    items.reduce((total, item) => total + Number(pick(item)), 0);

  const calories = sum((i) => i.calories);
  const remaining = CALORIE_GOAL - calories;

  return (
    <Card style={styles.card}>
      <Ring
        arcs={[{ value: calories, max: CALORIE_GOAL, color: Colors.nutrition, label: 'Calorias' }]}
        size={184}
        stroke={14}
      >
        <Text style={styles.calories}>{br(calories)}</Text>
        <Text style={styles.caloriesUnit}>kcal de {br(CALORIE_GOAL)}</Text>
      </Ring>

      <Text style={styles.finding}>
        {remaining > 0
          ? `Faltam ${br(remaining)} kcal para a meta do dia`
          : remaining === 0
            ? 'Meta do dia atingida'
            : `${br(Math.abs(remaining))} kcal acima da meta do dia`}
      </Text>

      <View style={styles.macrosRow}>
        <MacroRing label="Proteína" grams={sum((i) => i.protein)} goal={PROTEIN_GOAL} color={Colors.protein} />
        <MacroRing label="Carboidrato" grams={sum((i) => i.carbs)} goal={CARBS_GOAL} color={Colors.carbs} />
        <MacroRing label="Gordura" grams={sum((i) => i.fat)} goal={FAT_GOAL} color={Colors.fat} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },

  calories: {
    fontSize: FontSize.xxl,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  caloriesUnit: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium, marginTop: 2 },

  finding: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium, textAlign: 'center' },

  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  macro: { flex: 1, alignItems: 'center', gap: 2 },
  macroGram: {
    fontSize: FontSize.md,
    fontFamily: Font.semibold,
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  macroUnit: { fontSize: 11, color: Colors.textMuted, fontFamily: Font.medium, marginTop: -2 },
  macroLabel: { fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.medium, marginTop: Spacing.xs },
  macroGoal: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.regular },
});
