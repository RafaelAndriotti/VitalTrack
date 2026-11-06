import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Screen, Loading, ErrorBanner } from '@/components/ui';
import { useWater } from '@/features/water/hooks/useWater';
import { useWeekWater } from '@/features/water/hooks/useWeekWater';
import { UNDO_WINDOW_MS } from '@/features/water/constants';
import { WaterHero } from './WaterHero';
import { AmountForm } from './AmountForm';
import { WeekBars } from './WeekBars';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

interface UndoToast {
  ml: number;
}

export function WaterScreen() {
  const { loading, error, amount, goal, goalStatus, addWater, stepGoal } = useWater();
  const { days, reloadDay } = useWeekWater();
  const [toast, setToast] = useState<UndoToast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (loading) return <Loading />;

  /** Registra (ou tira) e mostra o toast "Desfazer" quando a operação é aceita. */
  async function register(ml: number) {
    const ok = await addWater(ml);
    if (!ok) return false;
    if (timer.current) clearTimeout(timer.current);
    setToast({ ml });
    timer.current = setTimeout(() => setToast(null), UNDO_WINDOW_MS);
    return true;
  }

  function undo() {
    if (!toast) return;
    const ml = toast.ml;
    if (timer.current) clearTimeout(timer.current);
    setToast(null);
    void addWater(-ml);
  }

  const sign = toast && toast.ml > 0 ? '+' : '';

  return (
    <View style={styles.root}>
      <Screen>
        <ErrorBanner message={error} />
        <WaterHero amount={amount} goal={goal} goalStatus={goalStatus} onGoalStep={stepGoal} />
        <AmountForm onSubmit={register} />
        <WeekBars
          days={days}
          todayAmount={amount}
          todayGoal={goal}
          onReloadDay={(iso) => void reloadDay(iso)}
        />
      </Screen>

      {toast ? (
        <View style={styles.toast} accessibilityRole="alert">
          <Text style={styles.toastText}>
            {sign}
            {toast.ml} ml registrados
          </Text>
          <Pressable accessibilityRole="button" onPress={undo} style={styles.undo}>
            <Text style={styles.undoText}>Desfazer</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  toastText: { color: Colors.text, fontFamily: Font.medium, fontSize: FontSize.sm },
  undo: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  undoText: { color: Colors.water, fontFamily: Font.semibold, fontSize: FontSize.sm },
});
