import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Elevation } from '@/constants/theme';

/* Shared primitives for the Clean Clínico world — solid surfaces, calm radii,
   soft real shadows, a single vital-green accent. No glass, no neon. */

export function Screen({ children, contentStyle }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView style={s.screen} contentContainerStyle={[s.screenContent, contentStyle]}>
      {children}
    </ScrollView>
  );
}

export function Loading() {
  return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function ProgressBar({
  value,
  max,
  color = Colors.primary,
  track = Colors.surfaceAlt,
  height = 8,
}: {
  value: number;
  max: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <View style={[s.track, { height, backgroundColor: track }]}>
      <View style={[s.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

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
  screen: { flex: 1, backgroundColor: Colors.background },
  screenContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.card,
  },

  track: { borderRadius: BorderRadius.full, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: BorderRadius.full },

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
