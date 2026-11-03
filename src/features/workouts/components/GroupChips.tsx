import { View, StyleSheet } from 'react-native';
import { Chip } from '@/components/ui';
import { MUSCLE_GROUPS } from '@/features/workouts/constants';
import { Spacing } from '@/constants/theme';

interface GroupChipsProps {
  isSelected: (group: string) => boolean;
  onToggle: (group: string) => void;
}

/** Seletor de grupos musculares (multi ou única seleção, definida pelo chamador). */
export function GroupChips({ isSelected, onToggle }: GroupChipsProps) {
  return (
    <View style={styles.wrap}>
      {MUSCLE_GROUPS.map((g) => (
        <Chip key={g} label={g} selected={isSelected(g)} onPress={() => onToggle(g)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
