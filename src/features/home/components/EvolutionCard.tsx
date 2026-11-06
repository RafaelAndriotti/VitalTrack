import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import { useEvolution } from '@/features/home/hooks/useEvolution';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';
import type { EvolutionPeriod, EvolutionTotals } from '@/types';

const PERIODS: { days: EvolutionPeriod; label: string }[] = [
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '3 meses' },
];

const DAY_LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const br = (n: number) => Math.round(n).toLocaleString('pt-BR');

/** "2026-11-06" → "06/11" (sem depender do fuso do aparelho). */
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Variação percentual vs período anterior. Null quando não há base de comparação. */
function deltaOf(now: number, prev: number): { pct: number; up: boolean } | null {
  if (prev <= 0) return null;
  const pct = Math.round(((now - prev) / prev) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

function Kpi({ label, value, now, prev }: { label: string; value: string; now: number; prev: number }) {
  const d = deltaOf(now, prev);
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {d ? (
        <Text style={[styles.delta, !d.up && styles.deltaDown]}>
          {d.up ? '▲' : '▼'} {d.pct}%
        </Text>
      ) : null}
    </View>
  );
}

export function EvolutionCard() {
  const [period, setPeriod] = useState<EvolutionPeriod>(7);
  const { data, loading, error } = useEvolution(period);

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.title}>Sua evolução</Text>
        <View style={styles.seg} accessibilityRole="tablist">
          {PERIODS.map((p) => {
            const on = p.days === period;
            return (
              <Pressable
                key={p.days}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setPeriod(p.days)}
                style={[styles.segBtn, on && styles.segBtnOn]}
              >
                <Text style={[styles.segText, on && styles.segTextOn]}>{p.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <Text style={styles.muted}>{error}</Text>
      ) : !data ? (
        <Text style={styles.muted}>{loading ? 'Carregando…' : 'Sem dados ainda.'}</Text>
      ) : (
        <Body data={data} />
      )}
    </Card>
  );
}

function Body({ data }: { data: NonNullable<ReturnType<typeof useEvolution>['data']> }) {
  const cur: EvolutionTotals = data.current;
  const prev: EvolutionTotals = data.previous;
  const max = Math.max(1, ...data.buckets.map((b) => b.volume_kg));
  const lastIdx = data.buckets.length - 1;

  return (
    <View>
      <View style={styles.kpis}>
        <Kpi label="treinos" value={br(cur.treinos)} now={cur.treinos} prev={prev.treinos} />
        <Kpi label="volume" value={`${br(cur.volume_kg / 1000)} t`} now={cur.volume_kg} prev={prev.volume_kg} />
        <Kpi label="kcal estimado" value={br(cur.kcal)} now={cur.kcal} prev={prev.kcal} />
      </View>

      <View style={styles.bars}>
        {data.buckets.map((b, i) => {
          const h = b.volume_kg > 0 ? Math.max((b.volume_kg / max) * 100, 4) : 0;
          const isCur = i === lastIdx;
          const label =
            data.bucket_days === 1 ? DAY_LETTERS[new Date(b.start + 'T12:00:00Z').getUTCDay()] : shortDate(b.start);
          return (
            <View key={b.start} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    { height: `${h}%` },
                    isCur && styles.barCur,
                    b.volume_kg === 0 && styles.barEmpty,
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.chartFoot}>
        <Text style={styles.muted}>desde {shortDate(data.start)}</Text>
        <Text style={styles.muted}>volume (kg × reps)</Text>
      </View>

      {data.highlight ? (
        <View style={styles.highlight}>
          <Text style={styles.label}>Em destaque</Text>
          <Text style={styles.hlName}>{data.highlight.exercise}</Text>
          <Text style={styles.muted}>
            Carga máxima: {data.highlight.first_kg} → {data.highlight.last_kg} kg
            {data.highlight.points.length > 1 ? ` em ${data.highlight.points.length} treinos` : ''}
          </Text>
          <View style={styles.spark}>
            {data.highlight.points.map((p) => {
              const top = data.highlight!.max_kg > 0 ? (p.max_kg / data.highlight!.max_kg) * 100 : 0;
              return <View key={p.date} style={[styles.sparkBar, { height: `${Math.max(top, 6)}%` }]} />;
            })}
          </View>
        </View>
      ) : null}

      {data.kcal_estimated ? (
        <Text style={styles.note}>Calorias estimadas com peso padrão de 70 kg.</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, marginBottom: Spacing.md },
  title: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  seg: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full, padding: 3, gap: 2 },
  segBtn: { flex: 1, height: 30, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center' },
  segBtnOn: { backgroundColor: Colors.primarySoft },
  segText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.semibold },
  segTextOn: { color: Colors.primary },
  kpis: { flexDirection: 'row', gap: Spacing.sm },
  kpi: { flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, padding: Spacing.sm },
  kpiValue: { fontSize: FontSize.lg, fontFamily: Font.bold, color: Colors.text, fontVariant: ['tabular-nums'] },
  kpiLabel: { fontSize: 11, color: Colors.textSecondary, fontFamily: Font.medium },
  delta: { fontSize: 11, color: Colors.success, fontFamily: Font.semibold, marginTop: 2 },
  deltaDown: { color: Colors.danger },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120, marginTop: Spacing.md },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 8, backgroundColor: Colors.primary, opacity: 0.9 },
  barCur: { opacity: 1 },
  barEmpty: { backgroundColor: Colors.borderStrong, height: 4 },
  barLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: Font.regular },
  chartFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  highlight: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, gap: 2 },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium },
  hlName: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40, marginTop: Spacing.sm },
  sparkBar: { flex: 1, backgroundColor: Colors.primary, borderRadius: 4, opacity: 0.8 },
  muted: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.regular },
  note: { fontSize: 11, color: Colors.textMuted, fontFamily: Font.regular, marginTop: Spacing.sm },
});
