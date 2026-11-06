import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Save, X, Pen, Plus } from 'lucide-react-native';
import { Input, Button, MaxLength, useDialog } from '@/components/ui';
import { useBusy } from '@/lib/useBusy';
import { SetRow, SetsTableHeader } from './SetRow';
import { autoLabels } from '@/features/workouts/setLabels';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import type { Exercise, UpdateSetPayload } from '@/types';

interface ExerciseCardProps {
  exercise: Exercise;
  onRename: (name: string) => Promise<boolean>;
  onRemove: () => Promise<unknown>;
  onAddSet: () => Promise<unknown>;
  onUpdateSet: (setId: string, fields: UpdateSetPayload) => void;
  onRemoveSet: (setId: string) => Promise<unknown>;
}

export function ExerciseCard({
  exercise,
  onRename,
  onRemove,
  onAddSet,
  onUpdateSet,
  onRemoveSet,
}: ExerciseCardProps) {
  const dialog = useDialog();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const addingSet = useBusy();
  const renaming = useBusy();
  // Exclusões (exercício e séries) compartilham a guarda: uma por vez.
  const removing = useBusy();

  async function saveName() {
    if (!name.trim()) return;
    const ok = await renaming.guard(() => onRename(name.trim()));
    if (ok === undefined) return; // já havia um renome em andamento
    if (ok) {
      setEditing(false);
    } else {
      await dialog.alert({ title: 'Erro', message: 'Falha ao atualizar nome do exercício' });
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {editing ? (
          <View style={styles.editRow}>
            <Input style={{ flex: 1 }} value={name} onChangeText={setName} maxLength={MaxLength.name} autoFocus />
            <Pressable accessibilityRole="button" accessibilityLabel="Salvar nome" style={styles.iconBtn} onPress={saveName} disabled={renaming.busy}>
              <Save size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Cancelar edição" style={styles.iconBtn} onPress={() => setEditing(false)}>
              <X size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.nameRow}>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.name}>{exercise.name}</Text>
                {exercise.notes ? <Text style={styles.notes}>Obs: {exercise.notes}</Text> : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar nome"
                hitSlop={8}
                onPress={() => {
                  setName(exercise.name);
                  setEditing(true);
                }}
              >
                <Pen size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
              </Pressable>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Remover exercício" hitSlop={8} disabled={removing.busy} onPress={() => void removing.guard(onRemove)}>
              <X size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
            </Pressable>
          </>
        )}
      </View>

      <SetsTableHeader />

      {(() => {
        const sets = exercise.exercise_sets ?? [];
        const autos = autoLabels(sets);
        return sets.map((set, index) => (
        <SetRow
          key={set.id}
          auto={autos[index]}
          set={set}
          onUpdate={(fields) => onUpdateSet(set.id, fields)}
          onDelete={() => void removing.guard(() => onRemoveSet(set.id))}
        />
        ));
      })()}

      <Button
        label="Adicionar série"
        variant="secondary"
        size="sm"
        style={styles.addSet}
        icon={<Plus size={Icon.sm} color={Colors.textSecondary} strokeWidth={Icon.stroke} />}
        loading={addingSet.busy}
        onPress={() => void addingSet.guard(onAddSet)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Elevation.card,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  nameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  notes: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, fontFamily: Font.regular },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addSet: { marginTop: Spacing.xs },
});
