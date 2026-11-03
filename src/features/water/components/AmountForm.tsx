import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

function parseMl(value: string): number | null {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

interface AmountFormProps {
  /** Recebe a quantidade com sinal: positiva adiciona, negativa remove. */
  onSubmit: (ml: number) => void;
}

/** Uma quantidade livre, adicionada ou removida pelo mesmo campo. */
export function AmountForm({ onSubmit }: AmountFormProps) {
  const [value, setValue] = useState('');
  const ml = parseMl(value);

  function submit(sign: 1 | -1) {
    if (ml !== null) onSubmit(ml * sign);
    setValue('');
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>Outra quantidade</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          accessibilityLabel="Quantidade em mililitros"
          placeholder="ml"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={value}
          onChangeText={setValue}
          returnKeyType="done"
          onSubmitEditing={() => submit(1)}
          maxLength={5}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: ml === null }}
          disabled={ml === null}
          style={({ pressed }) => [styles.btn, styles.removeBtn, pressed && styles.pressed, ml === null && styles.disabled]}
          onPress={() => submit(-1)}
        >
          <Text style={styles.removeText}>Remover</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: ml === null }}
          disabled={ml === null}
          style={({ pressed }) => [styles.btn, styles.addBtn, pressed && styles.pressed, ml === null && styles.disabled]}
          onPress={() => submit(1)}
        >
          <Text style={styles.addText}>Adicionar</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  label: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  row: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    minWidth: 72,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 48,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
    fontVariant: ['tabular-nums'],
  },
  btn: {
    height: 48,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    borderWidth: 1,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  addBtn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  addText: { color: Colors.textInverted, fontFamily: Font.semibold, fontSize: FontSize.sm },
  removeBtn: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.border },
  removeText: { color: Colors.textSecondary, fontFamily: Font.semibold, fontSize: FontSize.sm },
});
