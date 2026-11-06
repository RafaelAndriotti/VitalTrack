import { useEffect, useRef, useState } from 'react';
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
import { UNDO_WINDOW_MS } from '@/features/water/constants';
import type { Meal, CreateMealItemPayload } from '@/types';

interface UndoFood {
  mealId: string;
  item: CreateMealItemPayload;
  label: string;
}

export function DietScreen() {
  const diet = useMeals();
  const confirm = useConfirm();
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [foodTarget, setFoodTarget] = useState<Meal | null>(null);
  // Mantém o nome durante a animação de fechamento do modal.
  const removing = useBusy();
  const opening = useBusy();
  const [foodTargetName, setFoodTargetName] = useState('');
  const [undo, setUndo] = useState<UndoFood | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

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

  /** Exclui o alimento e mostra "Desfazer" por alguns segundos. */
  function handleDeleteFood(mealId: string, itemId: string) {
    void removing.guard(async () => {
      const meal = diet.meals.find((m) => m.id === mealId);
      const item = meal?.meal_items?.find((i) => i.id === itemId);
      const ok = await diet.removeFood(mealId, itemId);
      if (!ok || !item) return;
      if (timer.current) clearTimeout(timer.current);
      setUndo({
        mealId,
        label: item.name,
        item: {
          name: item.name,
          amount: Number(item.amount),
          calories: Number(item.calories),
          protein: Number(item.protein),
          carbs: Number(item.carbs),
          fat: Number(item.fat),
        },
      });
      timer.current = setTimeout(() => setUndo(null), UNDO_WINDOW_MS);
    });
  }

  async function handleUndo() {
    if (!undo) return;
    const { mealId, item } = undo;
    if (timer.current) clearTimeout(timer.current);
    setUndo(null);
    await diet.restoreFood(mealId, item);
  }

  function openAddFood(meal: Meal) {
    diet.clearError();
    setFoodTargetName(meal.name);
    setFoodTarget(meal);
  }

  /** "Alimento": usa a refeição do horário atual ou cria a da faixa, e abre o formulário. */
  function handleAddFoodNow() {
    void opening.guard(async () => {
      const meal = await diet.ensureMealForNow();
      if (meal) openAddFood(meal);
    });
  }

  return (
    <View style={styles.root}>
      <Screen onRefresh={diet.refresh} refreshing={diet.refreshing}>
        <ErrorBanner message={diet.error} />

        <MacroSummary meals={diet.meals} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refeições do dia</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: opening.busy }}
              disabled={opening.busy}
              style={styles.newMealBtn}
              onPress={() => {
                diet.clearError();
                setShowAddMeal(true);
              }}
            >
              <Text style={styles.newMealText}>Nova refeição</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: opening.busy }}
              disabled={opening.busy}
              style={styles.addFoodBtn}
              onPress={handleAddFoodNow}
            >
              <Plus size={Icon.sm} color={Colors.textInverted} strokeWidth={2} />
              <Text style={styles.addFoodBtnText}>Alimento</Text>
            </Pressable>
          </View>
        </View>

        {diet.meals.length === 0 ? (
          <EmptyState text="Nenhuma refeição cadastrada hoje. Toque em Alimento para começar." />
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

      {undo ? (
        <View style={styles.toast} accessibilityRole="alert">
          <Text style={styles.toastText} numberOfLines={1}>{undo.label} removido</Text>
          <Pressable accessibilityRole="button" onPress={() => void handleUndo()} style={styles.undoBtn}>
            <Text style={styles.undoText}>Desfazer</Text>
          </Pressable>
        </View>
      ) : null}

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  newMealBtn: {
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
  },
  newMealText: { color: Colors.text, fontSize: FontSize.sm, fontFamily: Font.semibold },
  addFoodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.full,
    ...Elevation.glow,
  },
  addFoodBtnText: { color: Colors.textInverted, fontSize: FontSize.sm, fontFamily: Font.semibold },
  toast: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  toastText: { flex: 1, color: Colors.text, fontFamily: Font.medium, fontSize: FontSize.sm },
  undoBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  undoText: { color: Colors.primary, fontFamily: Font.semibold, fontSize: FontSize.sm },
});
