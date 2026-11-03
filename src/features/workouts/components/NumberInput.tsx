import { useEffect, useRef, useState } from 'react';
import { TextInput, StyleSheet } from 'react-native';
import { Colors, BorderRadius, FontSize, Font } from '@/constants/theme';

interface NumberInputProps {
  value: number;
  max: number;
  onCommit: (value: number) => void;
}

/** Campo numérico que só persiste ao sair do campo (um PUT por edição, não por tecla). */
export function NumberInput({ value, max, onCommit }: NumberInputProps) {
  const current = Number(value) || 0;
  const [localValue, setLocalValue] = useState(current === 0 ? '' : String(current));
  const focused = useRef(false);

  // Sincroniza com o valor externo só quando o campo não está sendo editado,
  // evitando sobrescrever/reverter o que o usuário digita.
  useEffect(() => {
    if (focused.current) return;
    setLocalValue(current === 0 ? '' : String(current));
  }, [current]);

  function commit() {
    focused.current = false;
    const raw = parseFloat(localValue.replace(',', '.')) || 0;
    const parsed = Math.min(Math.max(raw, 0), max);
    setLocalValue(parsed === 0 ? '' : String(parsed));
    if (parsed !== current) onCommit(parsed);
  }

  return (
    <TextInput
      style={styles.input}
      keyboardType="numeric"
      value={localValue}
      placeholder="0"
      placeholderTextColor={Colors.textMuted}
      maxLength={8}
      onFocus={() => {
        focused.current = true;
      }}
      // Só dígitos e separador: rejeita notação exponencial ("1e3") e sinais.
      onChangeText={(text) => setLocalValue(text.replace(/[^0-9.,]/g, ''))}
      onBlur={commit}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    textAlign: 'center',
    width: 72,
    height: 40,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
});
