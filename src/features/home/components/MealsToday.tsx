import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';
import type { Meal } from '@/types';

const MAX_ROWS = 4;
const br = (n: number) => n.toLocaleString('pt-BR');

export function MealsToday({ meals }: { meals: Meal[] }) {
  const rows = meals.slice(0, MAX_ROWS);
  const hidden = meals.length - rows.length;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Refeições de hoje</Text>
        <Text style={styles.count}>{meals.length}</Text>
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>Nenhuma refeição registrada hoje.</Text>
      ) : (
        <View style={styles.rows}>
          {rows.map((meal) => {
            const kcal = (meal.meal_items ?? []).reduce((sum, item) => sum + Number(item.calories), 0);
            return (
              <View key={meal.id} style={styles.row}>
                <Text style={styles.time}>{meal.time || '—'}</Text>
                <Text style={styles.name} numberOfLines={1}>{meal.name}</Text>
                <Text style={styles.kcal}>{br(kcal)} kcal</Text>
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/diet')}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Text style={styles.actionText}>
          {hidden > 0 ? `Ver todas as ${meals.length} refeições` : 'Adicionar refeição'}
        </Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  count: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.medium, fontVariant: ['tabular-nums'] },

  rows: { gap: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  time: {
    width: 48,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontFamily: Font.medium,
    fontVariant: ['tabular-nums'],
  },
  name: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.medium },
  kcal: {
    fontSize: FontSize.sm,
    color: Colors.nutrition,
    fontFamily: Font.semibold,
    fontVariant: ['tabular-nums'],
  },

  empty: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.regular },

  action: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  actionPressed: { opacity: 0.8 },
  actionText: { fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.semibold },
});
