// Estimativa de calorias queimadas em treino de força.
//
// Fórmula: kcal = MET × peso (kg) × horas
//
// O app não registra o horário real do treino, então o tempo ativo é estimado
// por série concluída (execução + descanso). Todas as constantes ficam aqui
// para ajuste em um único lugar.

/** MET de treino de força moderado a intenso (referência: Compendium of Physical Activities). */
export const STRENGTH_MET = 5.0;

/** Tempo médio por série concluída, em minutos, contando execução e descanso. */
export const MINUTES_PER_SET = 3;

/** Peso usado quando o usuário ainda não informou o próprio peso. */
export const DEFAULT_WEIGHT_KG = 70;

export interface CaloriesEstimate {
  /** Calorias estimadas, arredondadas para inteiro. */
  calories_burned: number;
  /** Peso usado no cálculo (kg). */
  weight_kg_used: number;
  /** true quando o peso é o padrão, não o informado pelo usuário. */
  estimated: boolean;
}

export function estimateStrengthCalories(
  completedSets: number,
  weightKg: number | null | undefined
): CaloriesEstimate {
  const hasWeight = typeof weightKg === "number" && weightKg > 0;
  const weight = hasWeight ? weightKg : DEFAULT_WEIGHT_KG;
  const hours = (Math.max(0, completedSets) * MINUTES_PER_SET) / 60;

  return {
    calories_burned: Math.round(STRENGTH_MET * weight * hours),
    weight_kg_used: weight,
    estimated: !hasWeight,
  };
}
