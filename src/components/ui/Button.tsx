import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Elevation } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'soft' | 'danger';
type Size = 'md' | 'sm';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  /** Ícone à esquerda do texto. */
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  /** Brilho no tom do acento — só na ação principal da tela. */
  glow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  glow = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        size === 'sm' ? s.sm : s.md,
        variantStyle[variant],
        glow && !isDisabled && Elevation.glow,
        pressed && s.pressed,
        isDisabled && s.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.textInverted : Colors.text} />
      ) : (
        <>
          {icon}
          <Text style={[s.text, size === 'sm' && s.textSm, textStyle[variant]]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
  text: { fontSize: FontSize.md, fontFamily: Font.semibold },
  textSm: { fontSize: FontSize.sm },
});

const variantStyle = StyleSheet.create({
  primary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  secondary: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.border },
  soft: { backgroundColor: Colors.primarySoft, borderColor: Colors.primaryBorder },
  danger: { backgroundColor: Colors.dangerSoft, borderColor: Colors.dangerBorder },
});

const textStyle = StyleSheet.create({
  primary: { color: Colors.textInverted },
  secondary: { color: Colors.text },
  soft: { color: Colors.primary },
  danger: { color: Colors.danger },
});
