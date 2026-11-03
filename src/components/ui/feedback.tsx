import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={s.errorBanner}>
      <Text style={s.errorText} accessibilityRole="alert">{message}</Text>
    </View>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  errorBanner: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorText: { color: Colors.danger, textAlign: 'center', fontFamily: Font.medium, fontSize: FontSize.sm },

  empty: { padding: Spacing.xl, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, fontFamily: Font.regular, textAlign: 'center' },
});
