import { View, Text, StyleSheet } from 'react-native';
import { Screen, Loading, ErrorBanner } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { CALORIE_GOAL } from '@/features/diet/constants';
import { DEFAULT_WATER_GOAL } from '@/features/water/constants';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { todayISO } from '@/lib/date';
import { WorkoutHeroCard } from './WorkoutHeroCard';
import { DayRings } from './DayRings';
import type { DayGoal } from './DayRings';
import { MealsToday } from './MealsToday';
import { Colors, Spacing, FontSize, Font } from '@/constants/theme';
import type { Workout } from '@/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Progresso do treino de hoje, honesto: séries marcadas sobre séries do treino.
 * Um treino concluído vale a meta inteira; sem treino hoje, o arco fica vazio.
 */
function trainingProgress(workouts: Workout[]): { value: number; goal: number; readout: string } {
  const today = todayISO();
  const ofToday = workouts.filter((w) => w.date === today);
  if (ofToday.length === 0) return { value: 0, goal: 1, readout: 'nenhum treino hoje' };
  if (ofToday.some((w) => w.completed)) return { value: 1, goal: 1, readout: 'treino concluído' };

  const sets = ofToday.flatMap((w) => (w.exercises ?? []).flatMap((e) => e.exercise_sets ?? []));
  const done = sets.filter((s) => s.completed).length;
  if (sets.length === 0) return { value: 0, goal: 1, readout: 'treino sem séries' };
  return { value: done, goal: sets.length, readout: `${done} / ${sets.length} séries` };
}

export function HomeScreen() {
  const { user } = useAuth();
  const { active, workouts, meals, daily, loading, refreshing, error, refresh } = useHomeData();

  if (loading) return <Loading />;

  const calories = meals
    .flatMap((m) => m.meal_items || [])
    .reduce((sum, item) => sum + Number(item.calories), 0);
  const training = trainingProgress(workouts);
  const firstName = user?.name?.split(' ')[0] ?? '';

  const goals: DayGoal[] = [
    {
      label: 'Treino',
      value: training.value,
      goal: training.goal,
      unit: '',
      readout: training.readout,
      color: Colors.primary,
      href: '/(tabs)/workouts',
    },
    {
      label: 'Nutrição',
      value: calories,
      goal: CALORIE_GOAL,
      unit: 'kcal',
      color: Colors.nutrition,
      href: '/(tabs)/diet',
    },
    {
      label: 'Hidratação',
      value: daily?.amount_ml ?? 0,
      goal: daily?.goal_ml ?? DEFAULT_WATER_GOAL,
      unit: 'ml',
      color: Colors.water,
      href: '/(tabs)/water',
    },
  ];

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ErrorBanner message={error} />

      <View style={styles.greetBlock}>
        <Text style={styles.greet}>{greeting()},</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      <DayRings goals={goals} />

      <WorkoutHeroCard active={active} />

      <MealsToday meals={meals} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetBlock: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  greet: { fontSize: FontSize.md, color: Colors.textSecondary, fontFamily: Font.regular },
  name: { fontSize: FontSize.xxl, color: Colors.text, fontFamily: Font.bold, letterSpacing: -0.5 },
});
