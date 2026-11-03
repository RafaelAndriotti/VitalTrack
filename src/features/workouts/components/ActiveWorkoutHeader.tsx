import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Save, X, Pen, Trash2, Check } from 'lucide-react-native';
import { Input, MaxLength } from '@/components/ui';
import { useBusy } from '@/lib/useBusy';
import { GroupTags } from './GroupTags';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import type { Workout } from '@/types';

interface ActiveWorkoutHeaderProps {
  workout: Workout;
  onRename: (name: string) => Promise<boolean>;
  onDelete: () => void;
  onFinish: () => void;
}

export function ActiveWorkoutHeader({ workout, onRename, onDelete, onFinish }: ActiveWorkoutHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const renaming = useBusy();

  async function save() {
    if (!name.trim()) return;
    if (await renaming.guard(() => onRename(name.trim()))) setEditing(false);
  }

  return (
    <View style={styles.header}>
      {editing ? (
        <View style={styles.editContainer}>
          <Input style={styles.editInput} value={name} onChangeText={setName} maxLength={MaxLength.name} autoFocus />
          <Pressable accessibilityRole="button" accessibilityLabel="Salvar nome" style={styles.iconBtn} onPress={save} disabled={renaming.busy}>
            <Save size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancelar edição" style={styles.iconBtn} onPress={() => setEditing(false)}>
            <X size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.titleBlock}>
            <View style={styles.statusChip}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Treino em andamento</Text>
            </View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{workout.name}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Editar nome do treino"
                style={styles.editTitleBtn}
                onPress={() => {
                  setName(workout.name);
                  setEditing(true);
                }}
              >
                <Pen size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
              </Pressable>
            </View>
            <GroupTags groups={workout.muscle_groups} />
          </View>

          <View style={styles.actions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Excluir treino" style={[styles.iconBtn, styles.danger]} onPress={onDelete}>
              <Trash2 size={Icon.md} color={Colors.danger} strokeWidth={Icon.stroke} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Finalizar treino" style={[styles.iconBtn, styles.success]} onPress={onFinish}>
              <Check size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Elevation.card,
  },
  titleBlock: { flex: 1 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  statusText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: Font.semibold },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.xl, fontFamily: Font.bold, color: Colors.text, flexShrink: 1 },
  editTitleBtn: { padding: Spacing.xs },

  editContainer: { flexDirection: 'row', flex: 1, alignItems: 'center', gap: Spacing.sm },
  editInput: { flex: 1, borderColor: Colors.primary, paddingVertical: Spacing.sm },

  actions: { flexDirection: 'row', gap: Spacing.sm },
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
  danger: { backgroundColor: Colors.dangerSoft, borderColor: Colors.dangerBorder },
  success: { backgroundColor: Colors.primary, borderColor: Colors.primary },
});
