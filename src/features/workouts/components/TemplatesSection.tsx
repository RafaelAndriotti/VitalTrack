import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, Button, EmptyState, useConfirm, useDialog } from '@/components/ui';
import { GroupTags } from './GroupTags';
import { useBusy } from '@/lib/useBusy';
import type { WorkoutsApi } from '@/features/workouts/hooks/useWorkouts';
import { Colors, Spacing, FontSize, Font, Icon } from '@/constants/theme';
import type { WorkoutTemplate } from '@/types';
import { Play, Pen, Trash2 } from 'lucide-react-native';

interface TemplatesSectionProps {
  data: WorkoutsApi;
  onNew: () => void;
  onEdit: (template: WorkoutTemplate) => void;
}

/** "Meus treinos": modelos fixos, iniciados com um toque. */
export function TemplatesSection({ data, onNew, onEdit }: TemplatesSectionProps) {
  const dialog = useDialog();
  const confirm = useConfirm();
  const starting = useBusy();
  const removing = useBusy();

  async function start(t: WorkoutTemplate) {
    const result = await starting.guard(() => data.startTemplate(t.id));
    if (result === 'conflict') {
      await dialog.alert({
        title: 'Treino em andamento',
        message: 'Você já tem um treino em andamento. Conclua ou exclua antes de iniciar outro.',
      });
    } else if (result === 'missing') {
      await dialog.alert({ title: 'Modelo não encontrado', message: 'Este modelo não existe mais.' });
    }
  }

  function remove(t: WorkoutTemplate) {
    void removing.guard(async () => {
      const ok = await confirm({
        title: 'Excluir modelo',
        message: `Excluir "${t.name}"? Os treinos já feitos a partir dele continuam no histórico.`,
        confirmText: 'Excluir',
        destructive: true,
      });
      if (ok) await data.removeTemplate(t.id);
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus treinos</Text>
        <Button label="Novo modelo" size="sm" onPress={onNew} />
      </View>

      {data.templates.length === 0 ? (
        <EmptyState text="Nenhum modelo ainda. Cadastre o treino do seu personal uma vez e inicie com um toque." />
      ) : (
        data.templates.map((t) => {
          const sets = t.exercises.reduce((n, e) => n + e.sets.length, 0);
          return (
            <Card key={t.id} style={styles.card}>
              <View style={styles.topRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{t.name}</Text>
                  <GroupTags groups={t.muscle_groups} />
                  <Text style={styles.meta}>
                    {t.exercises.length} exercício{t.exercises.length === 1 ? '' : 's'} · {sets} série{sets === 1 ? '' : 's'}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${t.name}`} hitSlop={8} onPress={() => onEdit(t)}>
                  <Pen size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`Excluir ${t.name}`} hitSlop={8} onPress={() => remove(t)}>
                  <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                </Pressable>
              </View>
              <Button
                label="Iniciar"
                glow
                loading={starting.busy}
                icon={<Play size={Icon.sm} color={Colors.textInverted} strokeWidth={Icon.stroke} />}
                onPress={() => void start(t)}
              />
            </Card>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },
  card: { gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  name: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  meta: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.regular, marginTop: 4 },
});
