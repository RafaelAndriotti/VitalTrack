import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
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
}

export function LibraryFoodTab({ foods, form, saving, onSubmit }: LibraryFoodTabProps) {
  const { selected, setSelected } = form;

  if (!selected) {
    return (
      <View style={styles.tab}>
        <ScrollView style={{ maxHeight: 320 }}>
          {foods.map((item) => (
            <Pressable key={item.id} style={styles.item} onPress={() => setSelected(item)}>
              <Text style={styles.itemText}>{item.name}</Text>
              <Text style={styles.itemSub}>
                {item.calories} kcal · P {item.protein} · C {item.carbs} · G {item.fat} (em {item.serving_size}g)
              </Text>
            </Pressable>
          ))}
          {foods.length === 0 && <Text style={styles.muted}>Nenhum alimento na biblioteca.</Text>}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.tab, styles.selectedForm]}>
      <View style={styles.row}>
        <Text style={styles.label}>Alimento</Text>
        <Text style={styles.value}>{selected.name}</Text>
      </View>
      <AmountField value={form.amount} onChangeText={form.setAmount} autoFocus />
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  value: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold, flexShrink: 1, textAlign: 'right' },
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
  muted: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginVertical: Spacing.md, fontFamily: Font.regular },
});
