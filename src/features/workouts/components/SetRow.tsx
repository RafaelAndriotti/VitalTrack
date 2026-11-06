import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check, Trash2 } from 'lucide-react-native';
import { ModalSheet, Button, Input, MaxLength } from '@/components/ui';
import { NumberInput } from './NumberInput';
import { MAX_WEIGHT, MAX_REPS } from '@/features/workouts/constants';
import { SET_KINDS, displayLabel, isWarmup } from '@/features/workouts/setLabels';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import type { ExerciseSet, SetKind, UpdateSetPayload } from '@/types';

export function SetsTableHeader() {
  return (
    <View style={styles.header}>
      <Text style={[styles.columnHeader, { width: '30%' }]}>Série</Text>
      <Text style={[styles.columnHeader, { width: '22%', textAlign: 'center' }]}>Kg</Text>
      <Text style={[styles.columnHeader, { width: '22%', textAlign: 'center' }]}>Reps</Text>
      <Text style={[styles.columnHeader, { width: '26%' }]}></Text>
    </View>
  );
}

interface SetRowProps {
  /** Rótulo automático (tipo + número), calculado pelo exercício. */
  auto: string;
  set: ExerciseSet;
  onUpdate: (fields: UpdateSetPayload) => void;
  onDelete: () => void;
}

export function SetRow({ auto, set, onUpdate, onDelete }: SetRowProps) {
  const [editingLabel, setEditingLabel] = useState(false);
  const name = displayLabel(set, auto);
  const muted = isWarmup(set);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Renomear ${name}`}
        style={styles.labelBtn}
        hitSlop={6}
        onPress={() => setEditingLabel(true)}
      >
        <Text style={[styles.label, muted && styles.labelMuted]} numberOfLines={1}>
          {name}
        </Text>
      </Pressable>
      <View style={{ width: '22%', alignItems: 'center' }}>
        <NumberInput value={set.weight} max={MAX_WEIGHT} onCommit={(weight) => onUpdate({ weight })} />
      </View>
      <View style={{ width: '22%', alignItems: 'center' }}>
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

      <SetLabelEditor
        visible={editingLabel}
        auto={auto}
        set={set}
        onClose={() => setEditingLabel(false)}
        onSave={(fields) => {
          onUpdate(fields);
          setEditingLabel(false);
        }}
      />
    </View>
  );
}

interface SetLabelEditorProps {
  visible: boolean;
  auto: string;
  set: ExerciseSet;
  onClose: () => void;
  onSave: (fields: UpdateSetPayload) => void;
}

/** Editor do nome da série: texto livre, tipo rápido e volta ao automático. */
function SetLabelEditor({ visible, auto, set, onClose, onSave }: SetLabelEditorProps) {
  const [text, setText] = useState(set.label ?? '');

  function save() {
    const trimmed = text.trim();
    // Texto que começa com "aquec" continua sendo aquecimento; outro texto conta como série.
    const kind: SetKind = /^aquec/i.test(trimmed) ? 'warmup' : set.kind === 'warmup' ? 'work' : set.kind;
    onSave({ label: trimmed || null, kind });
  }

  function pickKind(kind: SetKind) {
    // Trocar o tipo reinicia a numeração automática: o texto personalizado é descartado.
    onSave({ kind, label: null });
  }

  return (
    <ModalSheet visible={visible} title="Nome da série" onClose={onClose}>
      <Input
        placeholder={auto}
        value={text}
        onChangeText={setText}
        maxLength={MaxLength.name}
        accessibilityLabel="Nome da série"
      />

      <View style={styles.chips}>
        {SET_KINDS.map((k) => {
          const on = set.kind === k.kind;
          return (
            <Pressable
              key={k.kind}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => pickKind(k.kind)}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{k.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button label="Salvar nome" onPress={save} />
      <Pressable
        accessibilityRole="button"
        style={styles.auto}
        onPress={() => onSave({ label: null })}
      >
        <Text style={styles.autoText}>Voltar ao automático</Text>
      </Pressable>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  columnHeader: { fontSize: FontSize.xs, fontFamily: Font.medium, color: Colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  labelBtn: { width: '30%', minHeight: 44, justifyContent: 'center', paddingRight: Spacing.xs },
  label: { fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.semibold },
  labelMuted: { color: Colors.textMuted, fontFamily: Font.medium },
  actions: { width: '26%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  check: { width: 28, height: 28, borderRadius: BorderRadius.sm, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginVertical: Spacing.md },
  chip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
  },
  chipOn: { borderColor: Colors.borderStrong, backgroundColor: Colors.text },
  chipText: { color: Colors.textSecondary, fontFamily: Font.medium, fontSize: FontSize.sm },
  chipTextOn: { color: Colors.textInverted, fontFamily: Font.semibold },
  auto: { alignItems: 'center', paddingVertical: Spacing.md },
  autoText: { color: Colors.textSecondary, fontFamily: Font.semibold, fontSize: FontSize.sm },
});
