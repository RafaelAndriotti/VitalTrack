import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[s.chip, selected && s.chipSelected]}
      onPress={onPress}
    >
      <Text style={[s.text, selected && s.textSelected]}>{label}</Text>
    </Pressable>
  );
}

/** Rótulo estático (não pressionável) em verde suave. */
export function Tag({ label }: { label: string }) {
  return (
    <View style={s.tag}>
      <Text style={s.tagText}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  chipSelected: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  text: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  textSelected: { color: Colors.primary, fontFamily: Font.semibold },

  tag: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: Font.semibold },
});
