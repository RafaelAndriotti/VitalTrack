/** Data local no formato YYYY-MM-DD (não UTC: à noite no Brasil o UTC já é "amanhã"). */
export function isoDate(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Data local de hoje no formato YYYY-MM-DD. */
export function todayISO(): string {
  return isoDate(new Date());
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export interface WeekDay {
  iso: string;
  /** "Seg", "Ter"... */
  weekday: string;
  /** Dia do mês. */
  day: number;
  isToday: boolean;
  isFuture: boolean;
}

/** Os sete dias da semana corrente, de segunda a domingo. */
export function currentWeek(): WeekDay[] {
  const now = new Date();
  const today = isoDate(now);
  // getDay(): 0 = domingo. A semana começa na segunda.
  const offset = (now.getDay() + 6) % 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const iso = isoDate(d);
    return { iso, weekday: WEEKDAYS[d.getDay()], day: d.getDate(), isToday: iso === today, isFuture: iso > today };
  });
}

/**
 * Dias seguidos com treino concluído, contando para trás a partir de hoje.
 * Hoje sem treino ainda não quebra a sequência: ela vale até ontem.
 */
export function streakDays(doneDates: Set<string>): number {
  const cursor = new Date();
  if (!doneDates.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (doneDates.has(isoDate(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
