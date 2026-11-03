import { useCallback, useState } from 'react';
import { MAX_CALORIES, MAX_MACRO } from '@/features/diet/constants';
import { parseAmount, parseBounded, checkScaled, type Validated } from '@/features/diet/validation';
import type { FoodLibraryItem, CreateLibraryFoodPayload, CreateMealItemPayload } from '@/types';

const DEFAULT_AMOUNT = '100';

/** Estado do formulário de alimento (aba Biblioteca e aba Personalizado). */
export function useFoodForm() {
  const [selected, setSelected] = useState<FoodLibraryItem | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');

  const reset = useCallback(() => {
    setSelected(null);
    setName('');
    setAmount(DEFAULT_AMOUNT);
    setCalories('0');
    setProtein('0');
    setCarbs('0');
    setFat('0');
  }, []);

  /** Item de refeição derivado de um alimento da biblioteca, proporcional à quantidade. */
  function libraryItemPayload(): Validated<CreateMealItemPayload> {
    if (!selected) return { ok: false, message: 'Selecione um alimento.' };
    const qty = parseAmount(amount);
    if (!qty.ok) return qty;
    const ratio = qty.value / (selected.serving_size > 0 ? selected.serving_size : 100);
    const payload: CreateMealItemPayload = {
      name: selected.name,
      amount: qty.value,
      calories: Math.round(selected.calories * ratio),
      protein: Math.round(selected.protein * ratio),
      carbs: Math.round(selected.carbs * ratio),
      fat: Math.round(selected.fat * ratio),
    };
    const scaled = checkScaled(payload);
    return scaled.ok ? { ok: true, value: payload } : scaled;
  }

  /** Alimento novo para a biblioteca (valores por 100 g). Valida tudo antes de qualquer chamada. */
  function customFoodPayload(): Validated<{ food: CreateLibraryFoodPayload; quantity: number }> {
    if (!name.trim()) return { ok: false, message: 'Informe o nome do alimento.' };
    const qty = parseAmount(amount);
    if (!qty.ok) return qty;
    const kcal = parseBounded(calories, MAX_CALORIES, { noun: 'calorias', article: 'as' }, { emptyAsZero: true });
    if (!kcal.ok) return kcal;
    const p = parseBounded(protein, MAX_MACRO, { noun: 'proteína', article: 'a' }, { emptyAsZero: true });
    if (!p.ok) return p;
    const c = parseBounded(carbs, MAX_MACRO, { noun: 'carboidrato', article: 'o' }, { emptyAsZero: true });
    if (!c.ok) return c;
    const f = parseBounded(fat, MAX_MACRO, { noun: 'gordura', article: 'a' }, { emptyAsZero: true });
    if (!f.ok) return f;

    const ratio = qty.value / 100;
    const scaled = checkScaled({
      calories: Math.round(kcal.value * ratio),
      protein: Math.round(p.value * ratio),
      carbs: Math.round(c.value * ratio),
      fat: Math.round(f.value * ratio),
    });
    if (!scaled.ok) return scaled;

    return {
      ok: true,
      value: {
        food: {
          name: name.trim(),
          calories: Math.round(kcal.value),
          protein: p.value,
          carbs: c.value,
          fat: f.value,
          serving_size: 100,
        },
        quantity: qty.value,
      },
    };
  }

  return {
    selected, setSelected,
    name, setName,
    amount, setAmount,
    calories, setCalories,
    protein, setProtein,
    carbs, setCarbs,
    fat, setFat,
    reset,
    libraryItemPayload,
    customFoodPayload,
  };
}

export type FoodForm = ReturnType<typeof useFoodForm>;
