import { View, Text, TextInput, StyleSheet } from 'react-native';
import { sanitizeNumeric } from '@/features/diet/validation';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

interface AmountFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  autoFocus?: boolean;
}

/** Linha "Quantidade [ 100 ] g". */
export function AmountField({ value, onChangeText, autoFocus }: AmountFieldProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Quantidade</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={value}
          onChangeText={(t) => onChangeText(sanitizeNumeric(t))}
          autoFocus={autoFocus}
          maxLength={6}
        />
        <Text style={styles.unit}>g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    width: 90,
    height: 48,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: Font.semibold,
    fontSize: FontSize.md,
  },
  unit: { color: Colors.textSecondary, fontSize: FontSize.sm, fontFamily: Font.medium },
});
