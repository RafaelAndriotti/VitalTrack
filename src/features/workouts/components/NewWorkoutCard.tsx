import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Dumbbell } from 'lucide-react-native';
import { Card, Input, Button, MaxLength, useDialog } from '@/components/ui';
import { GroupChips } from './GroupChips';
import { useBusy } from '@/lib/useBusy';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';

interface NewWorkoutCardProps {
  onStart: (name: string, groups: string[]) => Promise<boolean>;
}

/** Botão "Iniciar novo treino" que expande para o formulário de criação. */
export function NewWorkoutCard({ onStart }: NewWorkoutCardProps) {
  const dialog = useDialog();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const { busy, guard } = useBusy();

  function toggle(group: string) {
    setGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
  }

  function cancel() {
    setOpen(false);
    setName('');
    setGroups([]);
  }

  async function submit() {
    if (busy || !name.trim()) return;
    if (groups.length === 0) {
      await dialog.alert({
        title: 'Selecione o tipo',
        message: 'Escolha ao menos um grupo muscular para o treino.',
      });
      return;
    }
    const started = await guard(() => onStart(name.trim(), groups));
    if (started) {
      setName('');
      setGroups([]);
      setOpen(false);
    }
  }

  if (!open) {
    return (
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.startCard, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
      >
        <View style={styles.startIcon}>
          <Dumbbell size={28} color={Colors.textInverted} strokeWidth={Icon.stroke} />
        </View>
        <Text style={styles.startTitle}>Iniciar novo treino</Text>
        <Text style={styles.startSubtitle}>Escolha o tipo e registre seus exercícios</Text>
      </Pressable>
    );
  }

  return (
    <Card style={styles.form}>
      <Text style={styles.sectionTitle}>Iniciar novo treino</Text>
      <Input
        placeholder="Nome do treino (ex: Treino A · Peito)"
        value={name}
        onChangeText={setName}
        maxLength={MaxLength.name}
        autoFocus
      />

      <Text style={styles.fieldLabel}>Tipo do treino (grupos musculares)</Text>
      <GroupChips isSelected={(g) => groups.includes(g)} onToggle={toggle} />
      <Text style={styles.hint}>Selecione um ou mais grupos. Os exercícios serão filtrados por eles.</Text>

      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" size="sm" onPress={cancel} disabled={busy} />
        <Button label="Começar" size="sm" onPress={submit} loading={busy} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  startCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Elevation.raised,
  },
  pressed: { opacity: 0.8 },
  startIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(8, 17, 15, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  startTitle: { fontSize: FontSize.lg, fontFamily: Font.bold, color: Colors.textInverted },
  startSubtitle: { fontSize: FontSize.sm, color: Colors.textInverted, textAlign: 'center', fontFamily: Font.medium, opacity: 0.8 },

  form: { gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.regular, marginTop: -Spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
});
