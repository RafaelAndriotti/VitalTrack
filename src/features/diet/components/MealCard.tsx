import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus, X, Trash2 } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import type { Meal } from '@/types';

interface MealCardProps {
  meal: Meal;
  onAddFood: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
  onDeleteFood: (mealId: string, itemId: string) => void;
}

export function MealCard({ meal, onAddFood, onDelete, onDeleteFood }: MealCardProps) {
  const items = meal.meal_items ?? [];
  const calories = items.reduce((s, i) => s + Number(i.calories), 0);
  const protein = items.reduce((s, i) => s + Number(i.protein), 0);

  return (
    <Card>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            {meal.time ? `${meal.time} · ` : ''}{meal.name}
          </Text>
          <Text style={styles.subtitle}>
            <Text style={styles.kcal}>{calories.toLocaleString('pt-BR')} kcal</Text>
            {` · ${protein.toFixed(0)}g proteína`}
          </Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Excluir refeição"
            style={styles.deleteMealBtn}
            onPress={() => onDelete(meal)}
          >
            <X size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
          </Pressable>
        </View>
      </View>

      {items.length > 0 ? (
        <View style={styles.foodList}>
          {items.map((item) => (
            <View key={item.id} style={styles.foodRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodMacros}>
                  {item.amount}g · P {Number(item.protein).toFixed(0)} · C {Number(item.carbs).toFixed(0)} · G {Number(item.fat).toFixed(0)}
                </Text>
              </View>
              <View style={styles.foodRight}>
                <Text style={styles.foodKcal}>{Number(item.calories)} kcal</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Excluir alimento"
                  onPress={() => onDeleteFood(meal.id, item.id)}
                  hitSlop={8}
                >
                  <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Adicionar alimento em ${meal.name}`}
        style={({ pressed }) => [styles.addFoodBtn, pressed && styles.addFoodPressed]}
        onPress={() => onAddFood(meal)}
      >
        <Plus size={Icon.sm} color={Colors.primary} strokeWidth={2} />
        <Text style={styles.addFoodText}>Adicionar alimento</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  title: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: Font.regular },
  kcal: { color: Colors.nutrition, fontFamily: Font.semibold, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  addFoodPressed: { opacity: 0.8 },
  addFoodText: { fontSize: FontSize.sm, color: Colors.primary, fontFamily: Font.semibold },
  deleteMealBtn: { width: 36, height: 36, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },

  foodList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  foodName: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.medium },
  foodMacros: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontFamily: Font.regular },
  foodRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  foodKcal: { fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.semibold, fontVariant: ['tabular-nums'] },
});
