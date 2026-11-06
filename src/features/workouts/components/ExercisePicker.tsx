import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Elevation } from '@/constants/theme';
import type { ExerciseLibraryItem } from '@/types';

interface ExercisePickerProps {
  library: ExerciseLibraryItem[];
  /** Grupos do treino ativo; definem quais exercícios da biblioteca aparecem. */
  groups: string[];
  onPick: (name: string) => void;
  onCancel: () => void;
}

export function ExercisePicker({ library, groups, onPick, onCancel }: ExercisePickerProps) {
  // Só exercícios dos grupos do treino. Sem grupo algum no treino, libera a biblioteca toda.
  const filtered = library.filter(
    (item) => groups.length === 0 || (!!item.muscle_group && groups.includes(item.muscle_group))
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Selecione um exercício</Text>
      {groups.length > 0 && <Text style={styles.subtitle}>Filtrado por: {groups.join(' · ')}</Text>}

      <ScrollView style={styles.list} nestedScrollEnabled>
        {filtered.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" style={styles.item} onPress={() => onPick(item.name)}>
            <Text style={styles.itemText}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.muscle_group || 'Sem grupo'}</Text>
          </Pressable>
        ))}
        {filtered.length === 0 && (
          <Text style={styles.muted}>
            Nenhum exercício para os grupos deste treino. Cadastre na aba Exercícios.
          </Text>
        )}
      </ScrollView>

      <Pressable accessibilityRole="button" style={styles.cancel} onPress={onCancel}>
        <Text style={styles.cancelText}>Cancelar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.card,
  },
  title: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium, marginTop: Spacing.xs },
  list: { maxHeight: 300, marginVertical: Spacing.sm },
  item: { padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, marginBottom: 8 },
  itemText: { color: Colors.text, fontSize: FontSize.md, fontFamily: Font.semibold },
  itemSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, fontFamily: Font.regular },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginVertical: Spacing.md, fontFamily: Font.regular },
  cancel: { alignItems: 'center', padding: Spacing.md, marginTop: Spacing.sm },
  cancelText: { color: Colors.textSecondary, fontFamily: Font.semibold },
});
