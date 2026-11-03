import { View, ScrollView, StyleSheet } from 'react-native';
import { Button, FormField, Input, MaxLength } from '@/components/ui';
import { sanitizeNumeric } from '@/features/diet/validation';
import { AmountField } from './AmountField';
import type { FoodForm } from '@/features/diet/hooks/useFoodForm';
import { Spacing } from '@/constants/theme';

interface CustomFoodTabProps {
  form: FoodForm;
  saving: boolean;
  onSubmit: () => void;
}

export function CustomFoodTab({ form, saving, onSubmit }: CustomFoodTabProps) {
  return (
    <ScrollView style={styles.tab} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AmountField value={form.amount} onChangeText={form.setAmount} />
      <Input
        placeholder="Nome do alimento (ex: Omelete de 3 ovos)"
        value={form.name}
        onChangeText={form.setName}
        maxLength={MaxLength.name}
      />
      <View style={styles.grid}>
        <View style={styles.gridField}>
          <FormField label="Kcal" keyboardType="numeric" value={form.calories} onChangeText={(t) => form.setCalories(sanitizeNumeric(t))} maxLength={7} />
        </View>
        <View style={styles.gridField}>
          <FormField label="Proteína (g)" keyboardType="numeric" value={form.protein} onChangeText={(t) => form.setProtein(sanitizeNumeric(t))} maxLength={7} />
        </View>
        <View style={styles.gridField}>
          <FormField label="Carbo (g)" keyboardType="numeric" value={form.carbs} onChangeText={(t) => form.setCarbs(sanitizeNumeric(t))} maxLength={7} />
        </View>
        <View style={styles.gridField}>
          <FormField label="Gordura (g)" keyboardType="numeric" value={form.fat} onChangeText={(t) => form.setFat(sanitizeNumeric(t))} maxLength={7} />
        </View>
      </View>
      <Button label="Salvar e adicionar" loading={saving} onPress={onSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tab: { minHeight: 200 },
  content: { gap: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridField: { width: '47%' },
});
