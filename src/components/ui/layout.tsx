import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import type { ReactNode } from 'react';
import type { ViewStyle, StyleProp } from 'react-native';
import { Colors, Spacing, BorderRadius, Elevation } from '@/constants/theme';

/* Primitivos de layout do Clean Clínico — superfícies sólidas, raios calmos,
   sombras suaves e um único acento verde. Sem vidro, sem neon. */

interface ScreenProps {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  /** Quando informado, habilita pull-to-refresh. */
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Screen({ children, contentStyle, onRefresh, refreshing = false }: ScreenProps) {
  return (
    <ScrollView
      style={s.screen}
      contentContainerStyle={[s.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        ) : undefined
      }
    >
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
});
