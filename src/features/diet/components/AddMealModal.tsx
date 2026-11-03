import { useState } from 'react';
import { ModalSheet, FormField, Button, ErrorBanner, MaxLength } from '@/components/ui';
import { View, StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';
import { useBusy } from '@/lib/useBusy';

interface AddMealModalProps {
  visible: boolean;
  error: string;
  onClose: () => void;
  /** Retorna `true` se criou; o modal então limpa e fecha. */
  onSubmit: (name: string, time: string) => Promise<boolean>;
}

export function AddMealModal({ visible, error, onClose, onSubmit }: AddMealModalProps) {
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const { busy, guard } = useBusy();

  async function submit() {
    if (!name.trim()) return;
    const ok = await guard(() => onSubmit(name.trim(), time.trim()));
    if (ok) {
      setName('');
      setTime('');
      onClose();
    }
  }

  return (
    <ModalSheet visible={visible} title="Nova refeição" onClose={onClose} variant="center">
      <View style={styles.form}>
        <ErrorBanner message={visible ? error : ''} />
        <FormField
          label="Nome"
          placeholder="ex: Café da manhã"
          value={name}
          onChangeText={setName}
          maxLength={MaxLength.name}
          autoFocus
        />
        <FormField
          label="Horário"
          placeholder="ex: 08:00 (opcional)"
          value={time}
          onChangeText={setTime}
          maxLength={MaxLength.time}
        />
        <Button label="Salvar refeição" onPress={submit} loading={busy} />
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.md },
});
