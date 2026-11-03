import { MAX_AMOUNT, MAX_CALORIES, MAX_MACRO } from '@/features/diet/constants';

export type Validated<T> = { ok: true; value: T } | { ok: false; message: string };

const NUMBER_RE = /^\d+([.,]\d+)?$/;

/** Mantém só dígitos e separador decimal (sem sinal nem notação exponencial). */
export function sanitizeNumeric(text: string): string {
  return text.replace(/[^0-9.,]/g, '');
}

/** Rótulo de campo com artigo/gênero para montar mensagens corretas em PT-BR. */
export interface FieldLabel {
  /** Substantivo em minúsculas, ex.: "quantidade". */
  noun: string;
  article: 'a' | 'o' | 'as' | 'os';
  /** Complemento opcional da mensagem de vazio, ex.: " em gramas". */
  hint?: string;
}

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Converte texto em número >= 0 e <= `max`. Vazio vale 0 se `emptyAsZero`. */
export function parseBounded(
  text: string,
  max: number,
  label: FieldLabel,
  { emptyAsZero = false }: { emptyAsZero?: boolean } = {}
): Validated<number> {
  const trimmed = text.trim();
  const plural = label.article === 'as' || label.article === 'os';
  const fem = label.article === 'a' || label.article === 'as';
  if (trimmed === '') {
    return emptyAsZero
      ? { ok: true, value: 0 }
      : { ok: false, message: `Informe ${label.article} ${label.noun}${label.hint ?? ''}.` };
  }
  if (!NUMBER_RE.test(trimmed)) {
    const adj = `inválid${fem ? 'a' : 'o'}${plural ? 's' : ''}`;
    return { ok: false, message: `${cap(label.noun)} ${adj}.` };
  }
  const value = parseFloat(trimmed.replace(',', '.'));
  if (value > max) {
    return { ok: false, message: `${cap(label.article)} ${label.noun} ${plural ? 'devem' : 'deve'} ser no máximo ${max.toLocaleString('pt-BR')}.` };
  }
  return { ok: true, value };
}

/** Quantidade em gramas: > 0 e <= MAX_AMOUNT. */
export function parseAmount(text: string): Validated<number> {
  const r = parseBounded(text, MAX_AMOUNT, { noun: 'quantidade', article: 'a', hint: ' em gramas' });
  if (r.ok && r.value <= 0) return { ok: false, message: 'A quantidade deve ser maior que zero.' };
  return r;
}

/** Valores já proporcionais à quantidade precisam respeitar os limites do item de refeição. */
export function checkScaled(
  values: { calories: number; protein: number; carbs: number; fat: number },
): Validated<null> {
  if (values.calories > MAX_CALORIES) {
    return { ok: false, message: `Calorias do item passam de ${MAX_CALORIES.toLocaleString('pt-BR')}. Reduza a quantidade.` };
  }
  if (values.protein > MAX_MACRO || values.carbs > MAX_MACRO || values.fat > MAX_MACRO) {
    return { ok: false, message: `Macros do item passam de ${MAX_MACRO.toLocaleString('pt-BR')} g. Reduza a quantidade.` };
  }
  return { ok: true, value: null };
}
