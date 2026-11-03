import { View, Text, StyleSheet } from 'react-native';
import { Flame, Droplets } from 'lucide-react-native';
import { Screen, Loading, ErrorBanner } from '@/components/ui';
import { useAuth } from '@/features/auth/AuthContext';
import { CALORIE_GOAL } from '@/features/diet/constants';
import { DEFAULT_WATER_GOAL } from '@/features/water/constants';
import { useHomeData } from '@/features/home/hooks/useHomeData';
import { WorkoutHeroCard } from './WorkoutHeroCard';
import { MetricCard } from './MetricCard';
import { Colors, Spacing, FontSize, Font, Icon } from '@/constants/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HomeScreen() {
  const { user } = useAuth();
  const { active, meals, daily, loading, refreshing, error, refresh } = useHomeData();

  if (loading) return <Loading />;

  const items = meals.flatMap((m) => m.meal_items || []);
  const totalCalories = items.reduce((sum, i) => sum + Number(i.calories), 0);
  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <ErrorBanner message={error} />

      <View style={styles.greetBlock}>
        <Text style={styles.greet}>{greeting()},</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      {/* Treino do dia — herói */}
      <WorkoutHeroCard active={active} />

      <Text style={styles.sectionLabel}>Hoje</Text>

      <MetricCard
        title="Calorias"
        icon={<Flame size={Icon.md} color={Colors.warning} strokeWidth={Icon.stroke} />}
        value={totalCalories}
        goal={CALORIE_GOAL}
        unit="kcal"
        color={Colors.warning}
        href="/(tabs)/diet"
      />
      <MetricCard
        title="Hidratação"
        icon={<Droplets size={Icon.md} color={Colors.water} strokeWidth={Icon.stroke} />}
        value={daily?.amount_ml ?? 0}
        goal={daily?.goal_ml ?? DEFAULT_WATER_GOAL}
        unit="ml"
        color={Colors.water}
        href="/(tabs)/water"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetBlock: { marginTop: Spacing.sm, marginBottom: Spacing.xs },
  greet: { fontSize: FontSize.md, color: Colors.textSecondary, fontFamily: Font.regular },
  name: { fontSize: FontSize.xxl, color: Colors.text, fontFamily: Font.bold, letterSpacing: -0.5 },
  sectionLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.semibold, marginTop: Spacing.md },
});
