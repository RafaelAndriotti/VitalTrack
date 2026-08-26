import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
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

type ButtonVariant = 'primary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        variant === 'primary' && s.btnPrimary,
        variant === 'ghost' && s.btnGhost,
        variant === 'danger' && s.btnDanger,
        pressed && s.btnPressed,
        disabled && s.btnDisabled,
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          s.btnLabel,
          variant === 'primary' && s.btnLabelPrimary,
          variant === 'ghost' && s.btnLabelGhost,
          variant === 'danger' && s.btnLabelDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },

  track: { borderRadius: BorderRadius.full, overflow: 'hidden', width: '100%' },
  fill: { height: '100%', borderRadius: BorderRadius.full },

  btn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnGhost: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border },
  btnDanger: { backgroundColor: Colors.dangerSoft, borderWidth: 1, borderColor: Colors.dangerBorder },
  btnPressed: { opacity: 0.75 },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { fontSize: FontSize.md, fontFamily: Font.semibold },
  btnLabelPrimary: { color: Colors.textInverted },
  btnLabelGhost: { color: Colors.text },
  btnLabelDanger: { color: Colors.danger },

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
