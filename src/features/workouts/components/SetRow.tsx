import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { NumberInput } from './NumberInput';
import { MAX_WEIGHT, MAX_REPS } from '@/features/workouts/constants';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import type { ExerciseSet, UpdateSetPayload } from '@/types';

export function SetsTableHeader() {
  return (
    <View style={styles.header}>
      <Text style={[styles.columnHeader, { width: '15%' }]}>Série</Text>
      <Text style={[styles.columnHeader, { width: '35%', textAlign: 'center' }]}>Peso (kg)</Text>
      <Text style={[styles.columnHeader, { width: '35%', textAlign: 'center' }]}>Reps</Text>
      <Text style={[styles.columnHeader, { width: '15%' }]}></Text>
    </View>
  );
}

interface SetRowProps {
  index: number;
  set: ExerciseSet;
  onUpdate: (fields: UpdateSetPayload) => void;
  onDelete: () => void;
}

export function SetRow({ index, set, onUpdate, onDelete }: SetRowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.index, { width: '15%' }]}>{index + 1}</Text>
      <View style={{ width: '35%', alignItems: 'center' }}>
        <NumberInput value={set.weight} max={MAX_WEIGHT} onCommit={(weight) => onUpdate({ weight })} />
      </View>
      <View style={{ width: '35%', alignItems: 'center' }}>
        <NumberInput value={set.reps} max={MAX_REPS} onCommit={(reps) => onUpdate({ reps })} />
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.completed }}
          style={[styles.check, set.completed && styles.checkActive]}
          onPress={() => onUpdate({ completed: !set.completed })}
        >
          {set.completed ? <Check size={14} color={Colors.textInverted} strokeWidth={2.5} /> : null}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Excluir série" onPress={onDelete} hitSlop={6}>
          <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  columnHeader: { fontSize: FontSize.xs, fontFamily: Font.medium, color: Colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  index: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  actions: { width: '15%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  check: { width: 28, height: 28, borderRadius: BorderRadius.sm, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});
