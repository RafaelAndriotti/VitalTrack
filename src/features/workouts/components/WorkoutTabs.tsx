import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Dumbbell, ListPlus } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

export type WorkoutsView = 'treino' | 'exercicios';

interface WorkoutTabsProps {
  view: WorkoutsView;
  onChange: (view: WorkoutsView) => void;
}

const TABS = [
  { key: 'treino', label: 'Treino', icon: Dumbbell },
  { key: 'exercicios', label: 'Exercícios', icon: ListPlus },
] as const;

/** Abas internas: Treino / Exercícios. */
export function WorkoutTabs({ view, onChange }: WorkoutTabsProps) {
  return (
    <View style={styles.row}>
      {TABS.map(({ key, label, icon: TabIcon }) => {
        const active = view === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(key)}
          >
            <TabIcon
              size={Icon.sm}
              color={active ? Colors.textInverted : Colors.textSecondary}
              strokeWidth={Icon.stroke}
            />
            <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabActive: { backgroundColor: Colors.primary },
  text: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },
  textActive: { color: Colors.textInverted },
});
