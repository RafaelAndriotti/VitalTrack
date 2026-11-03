import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { Card, Input, Button, EmptyState, MaxLength, useDialog, useConfirm } from '@/components/ui';
import { GroupChips } from './GroupChips';
import { useBusy } from '@/lib/useBusy';
import { MUSCLE_GROUPS } from '@/features/workouts/constants';
import type { WorkoutsApi } from '@/features/workouts/hooks/useWorkouts';
import { Colors, Spacing, FontSize, Font, Icon } from '@/constants/theme';
import type { ExerciseLibraryItem } from '@/types';

/** Aba "Exercícios": cadastro e listagem da biblioteca, agrupada por músculo. */
export function ExerciseLibraryPanel({ data }: { data: WorkoutsApi }) {
  const dialog = useDialog();
  const confirm = useConfirm();
  const [name, setName] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const { busy, guard } = useBusy();
  const removing = useBusy();

  const { library } = data;
  const sections = MUSCLE_GROUPS.map((g) => ({
    group: g,
    items: library.filter((e) => e.muscle_group === g),
  })).filter((s) => s.items.length > 0);
  const ungrouped = library.filter((e) => !e.muscle_group);

  async function create() {
    if (busy) return;
    if (!name.trim()) {
      await dialog.alert({ title: 'Nome obrigatório', message: 'Informe o nome do exercício.' });
      return;
    }
    if (!group) {
      await dialog.alert({ title: 'Grupo obrigatório', message: 'Selecione o grupo muscular do exercício.' });
      return;
    }
    const ok = await guard(() => data.addLibraryExercise(name.trim(), group));
    if (ok) {
      setName('');
      setGroup(null);
    }
  }

  function remove(item: ExerciseLibraryItem) {
    void removing.guard(async () => {
      const ok = await confirm({
        title: 'Excluir exercício',
        message: `Remover "${item.name}" da biblioteca?`,
        confirmText: 'Excluir',
        destructive: true,
      });
      if (ok) await data.removeLibraryExercise(item.id);
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Exercícios</Text>

      <Card style={styles.form}>
        <Text style={styles.sectionTitle}>Cadastrar exercício</Text>
        <Input
          placeholder="Nome (ex: Supino inclinado)"
          value={name}
          onChangeText={setName}
          maxLength={MaxLength.name}
        />
        <Text style={styles.fieldLabel}>Grupo muscular</Text>
        <GroupChips isSelected={(g) => group === g} onToggle={(g) => setGroup(group === g ? null : g)} />
        <Button
          label="Cadastrar exercício"
          icon={<Plus size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />}
          onPress={create}
          loading={busy}
        />
      </Card>

      <Text style={styles.listTitle}>Cadastrados</Text>
      {!data.loaded ? (
        <View style={styles.container}>
          <EmptyState text="Não foi possível carregar os exercícios." />
          <Button label="Tentar novamente" variant="secondary" size="sm" onPress={data.refresh} loading={data.refreshing} />
        </View>
      ) : library.length === 0 ? (
        <EmptyState text="Nenhum exercício cadastrado ainda." />
      ) : (
        <>
          {sections.map((section) => (
            <LibraryGroup key={section.group} title={section.group} items={section.items} onRemove={remove} />
          ))}
          {ungrouped.length > 0 && <LibraryGroup title="Sem grupo" items={ungrouped} onRemove={remove} />}
        </>
      )}
    </View>
  );
}

function LibraryGroup({
  title,
  items,
  onRemove,
}: {
  title: string;
  items: ExerciseLibraryItem[];
  onRemove: (item: ExerciseLibraryItem) => void;
}) {
  return (
    <Card style={styles.groupCard}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.rowText}>{item.name}</Text>
          {item.user_id ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${item.name}`} hitSlop={8} onPress={() => onRemove(item)}>
              <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
            </Pressable>
          ) : (
            <Text style={styles.globalTag}>padrão</Text>
          )}
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5 },
  form: { gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },
  listTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text, marginTop: Spacing.sm },

  groupCard: { padding: Spacing.md, gap: Spacing.xs },
  groupTitle: { fontSize: FontSize.sm, fontFamily: Font.bold, color: Colors.primary, marginBottom: Spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rowText: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.medium },
  globalTag: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },
});
