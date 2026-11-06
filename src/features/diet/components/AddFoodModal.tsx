import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ModalSheet, ErrorBanner } from '@/components/ui';
import { useBusy } from '@/lib/useBusy';
import { useFoodForm } from '@/features/diet/hooks/useFoodForm';
import { LibraryFoodTab } from './LibraryFoodTab';
import { CustomFoodTab } from './CustomFoodTab';
import { Colors, Spacing, FontSize, Font } from '@/constants/theme';
import type { FoodLibraryItem, CreateLibraryFoodPayload, CreateMealItemPayload } from '@/types';

type Tab = 'library' | 'custom';

interface AddFoodModalProps {
  visible: boolean;
  mealName: string;
  foodLibrary: FoodLibraryItem[];
  error: string;
  onClose: () => void;
  onAddLibrary: (item: CreateMealItemPayload) => Promise<boolean>;
  onAddCustom: (food: CreateLibraryFoodPayload, quantity: number) => Promise<boolean>;
}

export function AddFoodModal({
  visible,
  mealName,
  foodLibrary,
  error,
  onClose,
  onAddLibrary,
  onAddCustom,
}: AddFoodModalProps) {
  const [tab, setTab] = useState<Tab>('library');
  const form = useFoodForm();
  const { reset } = form;
  const { busy, guard } = useBusy();
  const [formError, setFormError] = useState('');

  // Cada abertura começa limpa, na aba Biblioteca.
  useEffect(() => {
    if (visible) {
      setTab('library');
      setFormError('');
      reset();
    }
  }, [visible, reset]);

  async function submitLibrary() {
    if (busy) return;
    const result = form.libraryItemPayload();
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setFormError('');
    if (await guard(() => onAddLibrary(result.value))) {
      form.reset();
      onClose();
    }
  }

  async function submitCustom() {
    if (busy) return;
    // Valida tudo antes de criar o alimento na biblioteca (evita registro órfão).
    const result = form.customFoodPayload();
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setFormError('');
    if (await guard(() => onAddCustom(result.value.food, result.value.quantity))) {
      form.reset();
      onClose();
    }
  }

  function changeTab(next: Tab) {
    setFormError('');
    setTab(next);
  }

  return (
    <ModalSheet visible={visible} title={`Adicionar a ${mealName}`} onClose={onClose}>
      <ErrorBanner message={visible ? formError || error : ''} />

      <View style={styles.tabs}>
        <TabButton label="Biblioteca" active={tab === 'library'} onPress={() => changeTab('library')} />
        <TabButton label="Personalizado" active={tab === 'custom'} onPress={() => changeTab('custom')} />
      </View>

      {tab === 'library' ? (
        <LibraryFoodTab
          foods={foodLibrary}
          form={form}
          saving={busy}
          onSubmit={submitLibrary}
          onCreate={() => changeTab('custom')}
        />
      ) : (
        <CustomFoodTab form={form} saving={busy} onSubmit={submitCustom} />
      )}
    </ModalSheet>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.lg },
  tab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: FontSize.md, color: Colors.textMuted, fontFamily: Font.medium },
  tabTextActive: { color: Colors.text, fontFamily: Font.semibold },
});
