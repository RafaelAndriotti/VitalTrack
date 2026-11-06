// Resumo de evolução do usuário: volume, treinos e calorias estimadas por período,
// comparados com o período anterior de mesmo tamanho, mais o exercício em destaque.
//
// Função pura: recebe os treinos já carregados e não acessa o banco.

import { estimateStrengthCalories } from "./calories.js";

export const EVOLUTION_PERIODS = [7, 30, 90] as const;
export type EvolutionPeriod = (typeof EVOLUTION_PERIODS)[number];

export interface EvoSet {
  weight: number | null;
  reps: number | null;
  completed: boolean;
}

export interface EvoExercise {
  name: string;
  sets: EvoSet[];
}

export interface EvoWorkout {
  date: string; // YYYY-MM-DD
  completed: boolean;
  exercises: EvoExercise[];
}

export interface EvoTotals {
  treinos: number;
  volume_kg: number;
  kcal: number;
}

export interface EvoBucket {
  /** Primeiro dia do intervalo (YYYY-MM-DD). */
  start: string;
  treinos: number;
  volume_kg: number;
}

export interface EvoHighlight {
  exercise: string;
  first_kg: number;
  last_kg: number;
  max_kg: number;
  /** Carga máxima por sessão, em ordem cronológica. */
  points: { date: string; max_kg: number }[];
}

export interface EvolutionResponse {
  period_days: EvolutionPeriod;
  start: string;
  end: string;
  current: EvoTotals;
  previous: EvoTotals;
  /** 1 dia por barra nos períodos de 7 dias; 7 dias por barra nos demais. */
  bucket_days: number;
  buckets: EvoBucket[];
  highlight: EvoHighlight | null;
  /** true quando algum treino usou o peso padrão. */
  kcal_estimated: boolean;
}

const DAY_MS = 86_400_000;

function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00Z");
  return new Date(d.getTime() + n * DAY_MS).toISOString().slice(0, 10);
}

/** Dias entre duas datas YYYY-MM-DD (b - a). */
function diffDays(a: string, b: string): number {
  return Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY_MS);
}

function totalsFor(
  workouts: EvoWorkout[],
  from: string,
  to: string,
  weightKg: number | null
): { totals: EvoTotals; estimated: boolean } {
  let treinos = 0;
  let volume = 0;
  let kcal = 0;
  let estimated = false;

  for (const w of workouts) {
    if (!w.completed || w.date < from || w.date > to) continue;
    treinos += 1;
    let doneSets = 0;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.completed) continue;
        doneSets += 1;
        volume += Number(s.weight ?? 0) * Number(s.reps ?? 0);
      }
    }
    const est = estimateStrengthCalories(doneSets, weightKg);
    kcal += est.calories_burned;
    estimated ||= est.estimated;
  }

  return {
    totals: { treinos, volume_kg: Math.round(volume), kcal },
    estimated,
  };
}

export function buildEvolution(input: {
  workouts: EvoWorkout[];
  periodDays: EvolutionPeriod;
  today: string;
  weightKg: number | null;
}): EvolutionResponse {
  const { workouts, periodDays, today, weightKg } = input;

  const start = addDays(today, -(periodDays - 1));
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(periodDays - 1));

  const cur = totalsFor(workouts, start, today, weightKg);
  const prev = totalsFor(workouts, prevStart, prevEnd, weightKg);

  // Barras: diárias no período de 7 dias, semanais nos demais.
  const bucketDays = periodDays === 7 ? 1 : 7;
  const bucketCount = Math.ceil(periodDays / bucketDays);
  const buckets: EvoBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    start: addDays(start, i * bucketDays),
    treinos: 0,
    volume_kg: 0,
  }));
  for (const w of workouts) {
    if (!w.completed || w.date < start || w.date > today) continue;
    const idx = Math.min(Math.floor(diffDays(start, w.date) / bucketDays), bucketCount - 1);
    buckets[idx].treinos += 1;
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (s.completed) buckets[idx].volume_kg += Math.round(Number(s.weight ?? 0) * Number(s.reps ?? 0));
      }
    }
  }

  return {
    period_days: periodDays,
    start,
    end: today,
    current: cur.totals,
    previous: prev.totals,
    bucket_days: bucketDays,
    buckets,
    highlight: highlightFor(workouts, start, today),
    kcal_estimated: cur.estimated || prev.estimated,
  };
}

/**
 * Exercício em destaque: o que aparece em mais treinos concluídos do período.
 * Mostra a carga máxima de cada sessão, para ver a evolução.
 */
function highlightFor(workouts: EvoWorkout[], from: string, to: string): EvoHighlight | null {
  type Session = { date: string; max_kg: number };
  const byExercise = new Map<string, { label: string; sessions: Session[] }>();

  const sorted = workouts
    .filter((w) => w.completed && w.date >= from && w.date <= to)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  for (const w of sorted) {
    for (const ex of w.exercises) {
      const doneWeights = ex.sets.filter((s) => s.completed).map((s) => Number(s.weight ?? 0));
      if (doneWeights.length === 0) continue;
      const key = ex.name.trim().toLowerCase();
      const entry = byExercise.get(key) ?? { label: ex.name.trim(), sessions: [] };
      entry.sessions.push({ date: w.date, max_kg: Math.max(...doneWeights) });
      byExercise.set(key, entry);
    }
  }

  let best: { label: string; sessions: Session[] } | null = null;
  for (const entry of byExercise.values()) {
    if (!best || entry.sessions.length > best.sessions.length) best = entry;
  }
  if (!best) return null;

  const first = best.sessions[0].max_kg;
  const last = best.sessions[best.sessions.length - 1].max_kg;
  return {
    exercise: best.label,
    first_kg: first,
    last_kg: last,
    max_kg: Math.max(...best.sessions.map((s) => s.max_kg)),
    points: best.sessions,
  };
}
