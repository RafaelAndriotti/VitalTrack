// Metas diárias fixas (ainda não configuráveis pelo usuário).
export const CALORIE_GOAL = 2500;
export const PROTEIN_GOAL = 150;
export const CARBS_GOAL = 300;
export const FAT_GOAL = 80;

// Limites de validação do backend (alimentos e itens de refeição).
export const MAX_CALORIES = 100000;
export const MAX_MACRO = 10000;
export const MAX_AMOUNT = 100000;

// Faixas de horário das refeições. Quando o usuário registra um alimento sem
// refeição na faixa atual, o app cria a refeição com o nome e o horário da faixa.
export interface MealBand {
  name: string;
  /** Hora inicial (inclusive) e final (exclusiva), em horas de 0 a 24. */
  fromHour: number;
  toHour: number;
}

export const MEAL_BANDS: MealBand[] = [
  { name: 'Café da manhã', fromHour: 5, toHour: 11 },
  { name: 'Almoço', fromHour: 11, toHour: 15 },
  { name: 'Lanche', fromHour: 15, toHour: 19 },
  { name: 'Jantar', fromHour: 19, toHour: 23 },
];

/** Faixa do horário dado; fora das faixas (23h–5h) cai em "Ceia". */
export function mealBandFor(hour: number): MealBand {
  return MEAL_BANDS.find((b) => hour >= b.fromHour && hour < b.toHour) ?? { name: 'Ceia', fromHour: 23, toHour: 5 };
}
