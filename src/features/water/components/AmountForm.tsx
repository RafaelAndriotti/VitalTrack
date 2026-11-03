import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Minus } from 'lucide-react-native';
import { Card } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

function parseMl(value: string): number | null {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

interface AmountFormProps {
  title: string;
  buttonLabel: string;
  /** Mostra o ícone de "menos" no botão (modo remover). */
  subtract?: boolean;
  onSubmit: (ml: number) => void;
}

/** Campo + botão para adicionar ou remover uma quantidade livre de água. */
export function AmountForm({ title, buttonLabel, subtract = false, onSubmit }: AmountFormProps) {
  const [value, setValue] = useState('');

  function submit() {
    const ml = parseMl(value);
    if (ml !== null) onSubmit(ml);
    setValue('');
  }

  return (
    <Card style={styles.card}>
      <Text style={styles.label}>{title}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="ml"
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
          value={value}
          onChangeText={setValue}
          returnKeyType="done"
          onSubmitEditing={submit}
          maxLength={5}
        />
        <Pressable accessibilityRole="button" style={subtract ? styles.removeBtn : styles.addBtn} onPress={submit}>
          {subtract ? <Minus size={Icon.sm} color={Colors.textSecondary} strokeWidth={Icon.stroke} /> : null}
          <Text style={subtract ? styles.removeText : styles.addText}>{buttonLabel}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  row: { flexDirection: 'row', gap: Spacing.sm },
  input: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    height: 48,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  addText: { color: Colors.textInverted, fontFamily: Font.semibold, fontSize: FontSize.sm },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  removeText: { color: Colors.textSecondary, fontFamily: Font.semibold, fontSize: FontSize.sm },
});
