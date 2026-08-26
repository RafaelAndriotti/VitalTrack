import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { workouts as workoutsApi, meals as mealsApi, water as waterApi } from '@/services/api';
import type { Workout, Meal, DailyWater } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import { Screen, Card, ProgressBar, Loading, ErrorBanner } from '@/components/ui';
import { Dumbbell, Flame, Droplets, ChevronRight, Play } from 'lucide-react-native';

const CALORIE_GOAL = 2500;

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [active, setActive] = useState<Workout | null>(null);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [daily, setDaily] = useState<DailyWater | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const date = today();

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [workoutList, mealList, waterData] = await Promise.all([
        workoutsApi.list(),
        mealsApi.list(date),
        waterApi.get(date),
      ]);
      setActive(workoutList.find((w) => !w.completed) || null);
      setMeals(mealList);
      setDaily(waterData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) return <Loading />;

  const items = meals.flatMap((m) => m.meal_items || []);
  const totalCalories = items.reduce((sum, i) => sum + Number(i.calories), 0);
  const firstName = user?.name?.split(' ')[0] ?? '';
  const waterAmount = daily?.amount_ml ?? 0;
  const waterGoal = daily?.goal_ml ?? 2000;

  return (
    <Screen>
      <ErrorBanner message={error} />

      <View style={styles.greetBlock}>
        <Text style={styles.greet}>{greeting()},</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      {/* Treino do dia — herói */}
      {active ? (
        <Pressable onPress={() => router.push('/(tabs)/workouts')}>
          <Card style={styles.activeCard}>
            <View style={styles.activeTop}>
              <View style={styles.activeIcon}>
                <Dumbbell size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
              </View>
              <View style={styles.dot} />
              <Text style={styles.activeStatus}>Em andamento</Text>
            </View>
            <Text style={styles.activeName}>{active.name}</Text>
            <Text style={styles.activeMeta}>
              {active.exercises?.length || 0} exercício{(active.exercises?.length || 0) === 1 ? '' : 's'} · continuar
            </Text>
          </Card>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push('/(tabs)/workouts')}>
          <Card style={styles.startCard}>
            <View style={styles.startLeft}>
              <View style={styles.startIcon}>
                <Play size={Icon.sm} color={Colors.primary} strokeWidth={Icon.stroke} fill={Colors.primary} />
              </View>
              <View>
                <Text style={styles.startTitle}>Iniciar treino</Text>
                <Text style={styles.startSub}>Nenhum treino em andamento</Text>
              </View>
            </View>
            <ChevronRight size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
          </Card>
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Hoje</Text>

      {/* Calorias */}
      <Pressable onPress={() => router.push('/(tabs)/diet')}>
        <Card>
          <View style={styles.metricHeader}>
            <View style={styles.metricLeft}>
              <Flame size={Icon.md} color={Colors.warning} strokeWidth={Icon.stroke} />
              <Text style={styles.metricTitle}>Calorias</Text>
            </View>
            <ChevronRight size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
          </View>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{totalCalories.toLocaleString('pt-BR')}</Text>
            <Text style={styles.metricGoal}>/ {CALORIE_GOAL.toLocaleString('pt-BR')} kcal</Text>
          </View>
          <ProgressBar value={totalCalories} max={CALORIE_GOAL} color={Colors.warning} />
        </Card>
      </Pressable>

      {/* Água */}
      <Pressable onPress={() => router.push('/(tabs)/water')}>
        <Card>
          <View style={styles.metricHeader}>
            <View style={styles.metricLeft}>
              <Droplets size={Icon.md} color={Colors.water} strokeWidth={Icon.stroke} />
              <Text style={styles.metricTitle}>Hidratação</Text>
            </View>
            <ChevronRight size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
          </View>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{waterAmount.toLocaleString('pt-BR')}</Text>
            <Text style={styles.metricGoal}>/ {waterGoal.toLocaleString('pt-BR')} ml</Text>
          </View>
          <ProgressBar value={waterAmount} max={waterGoal} color={Colors.water} />
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetBlock: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  greet: { fontSize: FontSize.md, color: Colors.textSecondary, fontFamily: Font.regular },
  name: { fontSize: FontSize.xxl, color: Colors.text, fontFamily: Font.bold, letterSpacing: -0.5 },

  sectionLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.semibold, marginTop: Spacing.md },

  // Treino ativo
  activeCard: { backgroundColor: Colors.primary, borderColor: Colors.primary, gap: Spacing.xs, ...Elevation.raised },
  activeTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(8, 17, 15, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.textInverted, marginLeft: 'auto' },
  activeStatus: { fontSize: FontSize.xs, color: Colors.textInverted, fontFamily: Font.semibold, opacity: 0.8 },
  activeName: { fontSize: FontSize.xl, color: Colors.textInverted, fontFamily: Font.bold, marginTop: Spacing.xs },
  activeMeta: { fontSize: FontSize.sm, color: Colors.textInverted, fontFamily: Font.medium, opacity: 0.75 },

  // Iniciar treino
  startCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  startIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startTitle: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  startSub: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.regular, marginTop: 1 },

  // Métricas
  metricHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  metricLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  metricTitle: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  metricValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginBottom: Spacing.sm },
  metricValue: { fontSize: FontSize.xl, color: Colors.text, fontFamily: Font.bold, letterSpacing: -0.5 },
  metricGoal: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
});
