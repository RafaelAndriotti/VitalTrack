import { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Button } from '@/components/ui';
import { AmountField } from './AmountField';
import type { FoodForm } from '@/features/diet/hooks/useFoodForm';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';
import type { FoodLibraryItem } from '@/types';

interface LibraryFoodTabProps {
  foods: FoodLibraryItem[];
  form: FoodForm;
  saving: boolean;
  onSubmit: () => void;
  /** Abre a aba de criação quando a biblioteca não tem o alimento. */
  onCreate: () => void;
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const br = (n: number) => Math.round(n).toLocaleString('pt-BR');

export function LibraryFoodTab({ foods, form, saving, onSubmit, onCreate }: LibraryFoodTabProps) {
  const { selected, setSelected } = form;
  const [query, setQuery] = useState('');

  if (!selected) {
    const q = norm(query);
    const shown = q ? foods.filter((f) => norm(f.name).includes(q)) : foods;
    return (
      <View style={styles.tab}>
        <TextInput
          style={styles.search}
          placeholder="Buscar alimento"
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          accessibilityLabel="Buscar alimento na biblioteca"
        />
        <ScrollView style={{ maxHeight: 320 }} keyboardShouldPersistTaps="handled">
          {shown.map((item) => (
            <Pressable key={item.id} style={styles.item} onPress={() => setSelected(item)}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSub}>
                {item.calories} kcal por {item.serving_size} g · P {item.protein} · C {item.carbs} · G {item.fat}
              </Text>
            </Pressable>
          ))}
          {shown.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.muted}>
                {foods.length === 0 ? 'Nenhum alimento na biblioteca.' : 'Nenhum alimento com esse nome.'}
              </Text>
              <Button label="Criar alimento" variant="secondary" onPress={onCreate} />
            </View>
          )}
        </ScrollView>
      </View>
    );
  }

  const serving = selected.serving_size > 0 ? selected.serving_size : 100;
  const grams = Number(form.amount) || 0;
  const ratio = grams / serving;
  const portions: { label: string; grams: number }[] = [
    { label: '1 porção', grams: serving },
    { label: '½', grams: serving / 2 },
    { label: '1½', grams: serving * 1.5 },
    { label: '2', grams: serving * 2 },
  ];

  return (
    <View style={[styles.tab, styles.selectedForm]}>
      <View style={styles.row}>
        <Text style={styles.label}>Alimento</Text>
        <Text style={styles.value}>{selected.name}</Text>
      </View>

      <View style={styles.chips}>
        {portions.map((p) => {
          const on = Math.round(p.grams) === grams;
          return (
            <Pressable
              key={p.label}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => form.setAmount(String(Math.round(p.grams)))}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {p.label} ({br(p.grams)} g)
              </Text>
            </Pressable>
          );
        })}
      </View>

      <AmountField value={form.amount} onChangeText={form.setAmount} autoFocus />

      <Text style={styles.preview}>
        {br(selected.calories * ratio)} kcal · P {br(selected.protein * ratio)} · C {br(selected.carbs * ratio)} · G {br(selected.fat * ratio)}
      </Text>

      <View style={styles.buttons}>
        <Button label="Voltar" variant="secondary" style={{ flex: 1 }} disabled={saving} onPress={() => setSelected(null)} />
        <Button label="Adicionar" style={{ flex: 2 }} loading={saving} onPress={onSubmit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tab: { minHeight: 200 },
  selectedForm: { gap: Spacing.md },
  search: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    color: Colors.text,
    fontFamily: Font.medium,
    fontSize: FontSize.md,
    marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  value: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold, flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    height: 36,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    justifyContent: 'center',
  },
  chipOn: { borderColor: Colors.nutrition, backgroundColor: Colors.nutritionSoft },
  chipText: { color: Colors.textSecondary, fontFamily: Font.medium, fontSize: FontSize.sm },
  chipTextOn: { color: Colors.nutrition, fontFamily: Font.semibold },
  preview: { color: Colors.textSecondary, fontFamily: Font.medium, fontSize: FontSize.sm, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  item: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  itemText: { color: Colors.text, fontSize: FontSize.md, fontFamily: Font.semibold },
  itemSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4, fontFamily: Font.regular },
  empty: { alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.md },
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', fontFamily: Font.regular },
});
