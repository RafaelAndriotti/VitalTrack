import type { ExerciseSet, SetKind } from '@/types';

/** Tipos de série e o nome automático de cada um. */
export const SET_KINDS: { kind: SetKind; label: string }[] = [
  { kind: 'warmup', label: 'Aquecimento' },
  { kind: 'work', label: 'Série' },
  { kind: 'drop', label: 'Drop' },
  { kind: 'failure', label: 'Falha' },
];

export const kindLabel = (kind: SetKind) => SET_KINDS.find((k) => k.kind === kind)?.label ?? 'Série';

/**
 * Rótulo automático de cada série: tipo + número entre as do mesmo tipo.
 * Um aquecimento único vira "Aquecimento"; mais de um, "Aquecimento 1", "2"…
 * Séries de trabalho: "Série 1", "Série 2"… (aquecimento não entra na conta).
 */
export function autoLabels(sets: Pick<ExerciseSet, 'kind'>[]): string[] {
  const total: Record<string, number> = {};
  for (const s of sets) total[s.kind] = (total[s.kind] ?? 0) + 1;
  const seen: Record<string, number> = {};
  return sets.map((s) => {
    seen[s.kind] = (seen[s.kind] ?? 0) + 1;
    const base = kindLabel(s.kind);
    return total[s.kind] > 1 ? `${base} ${seen[s.kind]}` : base;
  });
}

/** Nome exibido: o texto do usuário quando existe; senão o automático. */
export function displayLabel(set: Pick<ExerciseSet, 'label'>, auto: string): string {
  return set.label && set.label.trim() ? set.label : auto;
}

/** Aquecimento: fica fora de volume, kcal e do total de séries. */
export const isWarmup = (set: Pick<ExerciseSet, 'kind'>) => set.kind === 'warmup';
