import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Screen, Loading, ErrorBanner, EmptyState, useConfirm } from '@/components/ui';
import { useMeals } from '@/features/diet/hooks/useMeals';
import { MacroSummary } from './MacroSummary';
import { MealCard } from './MealCard';
import { AddMealModal } from './AddMealModal';
import { AddFoodModal } from './AddFoodModal';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import { useBusy } from '@/lib/useBusy';
import type { Meal } from '@/types';

export function DietScreen() {
  const diet = useMeals();
  const confirm = useConfirm();
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [foodTarget, setFoodTarget] = useState<Meal | null>(null);
  // Mantém o nome durante a animação de fechamento do modal.
  const removing = useBusy();
  const [foodTargetName, setFoodTargetName] = useState('');

  if (diet.loading && !diet.refreshing) return <Loading />;

  // Exclusões de refeição e de alimento compartilham a guarda (uma por vez, inclusive o diálogo).
  function handleDeleteMeal(meal: Meal) {
    void removing.guard(async () => {
      const ok = await confirm({
        title: 'Excluir refeição',
        message: `Remover "${meal.name}" e todos os seus alimentos?`,
        confirmText: 'Excluir',
        destructive: true,
      });
      if (ok) await diet.removeMeal(meal.id);
    });
  }

  function handleDeleteFood(mealId: string, itemId: string) {
    void removing.guard(() => diet.removeFood(mealId, itemId));
  }

  function openAddFood(meal: Meal) {
    diet.clearError();
    setFoodTargetName(meal.name);
    setFoodTarget(meal);
  }

  return (
    <>
      <Screen onRefresh={diet.refresh} refreshing={diet.refreshing}>
        <ErrorBanner message={diet.error} />

        <MacroSummary meals={diet.meals} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refeições do dia</Text>
          <Pressable
            accessibilityRole="button"
            style={styles.addMealBtn}
            onPress={() => {
              diet.clearError();
              setShowAddMeal(true);
            }}
          >
            <Plus size={Icon.sm} color={Colors.textInverted} strokeWidth={2} />
            <Text style={styles.addMealBtnText}>Refeição</Text>
          </Pressable>
        </View>

        {diet.meals.length === 0 ? (
          <EmptyState text="Nenhuma refeição cadastrada hoje." />
        ) : (
          diet.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onAddFood={openAddFood}
              onDelete={handleDeleteMeal}
              onDeleteFood={handleDeleteFood}
            />
          ))
        )}
      </Screen>

      <AddMealModal
        visible={showAddMeal}
        error={diet.error}
        onClose={() => setShowAddMeal(false)}
        onSubmit={diet.addMeal}
      />

      <AddFoodModal
        visible={foodTarget !== null}
        mealName={foodTargetName}
        foodLibrary={diet.foodLibrary}
        error={diet.error}
        onClose={() => setFoodTarget(null)}
        onAddLibrary={(item) => diet.addLibraryFoodToMeal(foodTarget!.id, item)}
        onAddCustom={(food, qty) => diet.addCustomFoodToMeal(foodTarget!.id, food, qty)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.full,
    ...Elevation.glow,
  },
  addMealBtnText: { color: Colors.textInverted, fontSize: FontSize.sm, fontFamily: Font.semibold },
});
