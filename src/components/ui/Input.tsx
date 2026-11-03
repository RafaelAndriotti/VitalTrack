import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

/** Limites de tamanho alinhados à validação do backend. */
export const MaxLength = {
  name: 100,
  notes: 10000,
  time: 50,
  email: 254,
  password: 200,
} as const;

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={Colors.textMuted}
      {...props}
      style={[s.input, props.style]}
    />
  );
}

export function FormField({ label, ...inputProps }: TextInputProps & { label: string }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <Input {...inputProps} />
    </View>
  );
}

const s = StyleSheet.create({
  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
});
