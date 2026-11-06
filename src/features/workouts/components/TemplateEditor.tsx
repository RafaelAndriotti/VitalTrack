import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus, Trash2, X } from 'lucide-react-native';
import { Card, Input, Button, MaxLength, useDialog } from '@/components/ui';
import { GroupChips } from './GroupChips';
import { ExercisePicker } from './ExercisePicker';
import { NumberInput } from './NumberInput';
import { SET_KINDS, kindLabel } from '@/features/workouts/setLabels';
import { MAX_WEIGHT, MAX_REPS } from '@/features/workouts/constants';
import { useBusy } from '@/lib/useBusy';
import type { WorkoutsApi } from '@/features/workouts/hooks/useWorkouts';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import type { SetKind, TemplatePayload, WorkoutTemplate } from '@/types';

interface DraftSet {
  kind: SetKind;
  reps: number;
  kg: number;
}

interface DraftExercise {
  key: string;
  name: string;
  sets: DraftSet[];
}

let keyCounter = 0;
const nextKey = () => `d${++keyCounter}`;

function draftFrom(t: WorkoutTemplate): DraftExercise[] {
  return t.exercises.map((e) => ({
    key: nextKey(),
    name: e.name,
    sets: e.sets.map((s) => ({
      kind: s.kind,
      reps: Number(s.planned_reps) || 0,
      kg: Number(s.planned_weight) || 0,
    })),
  }));
}

interface TemplateEditorProps {
  /** Modelo a editar; undefined = criar um novo. */
  template?: WorkoutTemplate;
  data: WorkoutsApi;
  onDone: () => void;
}

/** Cadastro do treino fixo: nome, grupos, exercícios e séries com tipo e valores planejados. */
export function TemplateEditor({ template, data, onDone }: TemplateEditorProps) {
  const dialog = useDialog();
  const saving = useBusy();
  const [name, setName] = useState(template?.name ?? '');
  const [groups, setGroups] = useState<string[]>(template?.muscle_groups ?? []);
  const [exercises, setExercises] = useState<DraftExercise[]>(() => (template ? draftFrom(template) : []));
  const [picking, setPicking] = useState(false);

  function toggleGroup(g: string) {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  function addExercise(exName: string) {
    setExercises((prev) => [...prev, { key: nextKey(), name: exName, sets: [{ kind: 'work', reps: 0, kg: 0 }] }]);
    setPicking(false);
  }

  function patchSet(exKey: string, index: number, patch: Partial<DraftSet>) {
    setExercises((prev) =>
      prev.map((e) =>
        e.key !== exKey ? e : { ...e, sets: e.sets.map((s, i) => (i === index ? { ...s, ...patch } : s)) }
      )
    );
  }

  function addSet(exKey: string) {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.key !== exKey) return e;
        const last = e.sets[e.sets.length - 1];
        return { ...e, sets: [...e.sets, { kind: 'work', reps: last?.reps ?? 0, kg: last?.kg ?? 0 }] };
      })
    );
  }

  function removeSet(exKey: string, index: number) {
    setExercises((prev) =>
      prev.map((e) => (e.key !== exKey ? e : { ...e, sets: e.sets.filter((_, i) => i !== index) }))
    );
  }

  function removeExercise(exKey: string) {
    setExercises((prev) => prev.filter((e) => e.key !== exKey));
  }

  /** Próximo tipo na sequência: aquecimento → série → drop → falha → aquecimento. */
  function cycleKind(current: SetKind): SetKind {
    const i = SET_KINDS.findIndex((k) => k.kind === current);
    return SET_KINDS[(i + 1) % SET_KINDS.length].kind;
  }

  async function save() {
    if (saving.busy) return;
    if (!name.trim()) {
      await dialog.alert({ title: 'Nome obrigatório', message: 'Dê um nome ao modelo, como "Treino A · Peito".' });
      return;
    }
    if (exercises.length === 0) {
      await dialog.alert({ title: 'Sem exercícios', message: 'Adicione ao menos um exercício ao modelo.' });
      return;
    }
    if (exercises.some((e) => e.sets.length === 0)) {
      await dialog.alert({ title: 'Sem séries', message: 'Cada exercício precisa de ao menos uma série.' });
      return;
    }
    const payload: TemplatePayload = {
      name: name.trim(),
      muscle_groups: groups,
      exercises: exercises.map((e) => ({
        name: e.name,
        sets: e.sets.map((s) => ({
          kind: s.kind,
          planned_reps: s.reps > 0 ? s.reps : null,
          planned_weight: s.kg > 0 ? s.kg : null,
        })),
      })),
    };
    const ok = await saving.guard(() => data.saveTemplate(template?.id ?? null, payload));
    if (ok) onDone();
  }

  if (picking) {
    return (
      <ExercisePicker
        library={data.library}
        groups={groups}
        onPick={addExercise}
        onCancel={() => setPicking(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{template ? 'Editar modelo' : 'Novo modelo'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar" onPress={onDone} hitSlop={8}>
          <X size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
        </Pressable>
      </View>

      <Card style={styles.block}>
        <Input
          placeholder="Nome do modelo (ex: Treino A · Peito)"
          value={name}
          onChangeText={setName}
          maxLength={MaxLength.name}
        />
        <Text style={styles.label}>Grupos musculares</Text>
        <GroupChips isSelected={(g) => groups.includes(g)} onToggle={toggleGroup} />
      </Card>

      {exercises.map((ex) => (
        <Card key={ex.key} style={styles.block}>
          <View style={styles.exHeader}>
            <Text style={styles.exName}>{ex.name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${ex.name}`} hitSlop={8} onPress={() => removeExercise(ex.key)}>
              <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
            </Pressable>
          </View>

          <View style={styles.colsHeader}>
            <Text style={[styles.colText, { width: '30%' }]}>Tipo</Text>
            <Text style={[styles.colText, { width: '28%', textAlign: 'center' }]}>Reps</Text>
            <Text style={[styles.colText, { width: '28%', textAlign: 'center' }]}>Kg</Text>
            <Text style={[styles.colText, { width: '14%' }]} />
          </View>

          {ex.sets.map((s, i) => (
            <View key={i} style={styles.setRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Tipo da série ${i + 1}: ${kindLabel(s.kind)}. Toque para trocar`}
                style={[styles.kindBtn, { width: '30%' }]}
                onPress={() => patchSet(ex.key, i, { kind: cycleKind(s.kind) })}
              >
                <Text style={styles.kindText}>{kindLabel(s.kind)}</Text>
              </Pressable>
              <View style={{ width: '28%', alignItems: 'center' }}>
                <NumberInput value={s.reps} max={MAX_REPS} onCommit={(reps) => patchSet(ex.key, i, { reps })} />
              </View>
              <View style={{ width: '28%', alignItems: 'center' }}>
                <NumberInput value={s.kg} max={MAX_WEIGHT} onCommit={(kg) => patchSet(ex.key, i, { kg })} />
              </View>
              <View style={{ width: '14%', alignItems: 'flex-end' }}>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remover série ${i + 1}`} hitSlop={8} onPress={() => removeSet(ex.key, i)}>
                  <X size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                </Pressable>
              </View>
            </View>
          ))}

          <Button
            label="Adicionar série"
            variant="secondary"
            size="sm"
            icon={<Plus size={Icon.sm} color={Colors.textSecondary} strokeWidth={Icon.stroke} />}
            onPress={() => addSet(ex.key)}
          />
        </Card>
      ))}

      <Button
        label="Adicionar exercício"
        variant="secondary"
        icon={<Plus size={Icon.sm} color={Colors.textSecondary} strokeWidth={Icon.stroke} />}
        onPress={() => setPicking(true)}
      />

      <Button label="Salvar modelo" glow loading={saving.busy} onPress={() => void save()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },
  block: { gap: Spacing.sm },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium, marginTop: Spacing.xs },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exName: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  colsHeader: { flexDirection: 'row', alignItems: 'center' },
  colText: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 2 },
  kindBtn: {
    height: 40,
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.sm,
  },
  kindText: { fontSize: FontSize.xs, color: Colors.text, fontFamily: Font.semibold },
});
