export const DEFAULT_WATER_GOAL = 2000;
// Limite aceito pelo backend para amount_ml/goal_ml.
export const MAX_WATER_ML = 50000;

// Meta ajustada com +/− : faixa e passo da tela (o backend aceita mais).
export const WATER_GOAL_MIN = 500;
export const WATER_GOAL_MAX = 5000;
export const WATER_GOAL_STEP = 250;
// Pausa após o último toque no +/− antes de salvar a meta.
export const WATER_GOAL_DEBOUNCE_MS = 600;
// Tempo em que o toast "Desfazer" fica visível.
export const UNDO_WINDOW_MS = 4000;
