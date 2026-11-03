import { View, Text, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import type { WaterDay } from '@/features/water/hooks/useWeekWater';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

interface WeekBarsProps {
  days: WaterDay[];
  /** Valores ao vivo de hoje (a tela já os tem; não esperam recarga). */
  todayAmount: number;
  todayGoal: number;
}

const BAR_HEIGHT = 132;

/** Litros com uma casa: 1250 → "1,3". Zero vira "0". */
const liters = (ml: number) => (ml === 0 ? '0' : (ml / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }));

/**
 * A semana em barras: cada barra mede o dia contra a sua própria meta, então o
 * topo da trilha é sempre "meta atingida". Dia na meta fica no azul cheio; dia
 * abaixo, no mesmo azul mais fraco; dia futuro mostra só a trilha.
 */
export function WeekBars({ days, todayAmount, todayGoal }: WeekBarsProps) {
  const rows = days.map((d) => {
    const amount = d.isToday ? todayAmount : (d.water?.amount_ml ?? 0);
    const goal = d.isToday ? todayGoal : (d.water?.goal_ml ?? todayGoal);
    return { ...d, amount, goal, met: !d.isFuture && goal > 0 && amount >= goal };
  });

  const elapsed = rows.filter((d) => !d.isFuture).length;
  const met = rows.filter((d) => d.met).length;
  const total = rows.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Esta semana</Text>
        <Text style={styles.summary}>
          <Text style={styles.summaryStrong}>{met}</Text> de {elapsed} dias na meta
        </Text>
      </View>

      <View
        style={styles.chart}
        accessible
        accessibilityLabel={`Esta semana: ${met} de ${elapsed} dias na meta, ${liters(total)} litros no total`}
      >
        {rows.map((d) => {
          const pct = d.goal > 0 ? Math.min(d.amount / d.goal, 1) : 0;
          return (
            <View key={d.iso} style={styles.col}>
              <Text style={[styles.value, d.isToday && styles.valueToday, d.isFuture && styles.valueFuture]}>
                {d.isFuture ? '' : liters(d.amount)}
              </Text>
              <View style={styles.track}>
                {pct > 0 ? (
                  <View
                    style={[
                      styles.fill,
                      { height: `${pct * 100}%` },
                      !d.met && styles.fillUnder,
                    ]}
                  />
                ) : null}
              </View>
              <Text style={[styles.weekday, d.isToday && styles.weekdayToday]}>{d.weekday}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.caption}>Litros por dia · topo da barra = meta do dia</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  summary: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  summaryStrong: { color: Colors.water, fontFamily: Font.bold, fontVariant: ['tabular-nums'] },

  chart: { flexDirection: 'row', gap: Spacing.sm },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  value: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: Font.medium,
    fontVariant: ['tabular-nums'],
    minHeight: 18,
  },
  valueToday: { color: Colors.water, fontFamily: Font.bold },
  valueFuture: { color: Colors.textMuted },
  track: {
    width: '100%',
    maxWidth: 28,
    height: BAR_HEIGHT,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.track,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  fill: { width: '100%', borderRadius: BorderRadius.sm, backgroundColor: Colors.water },
  fillUnder: { opacity: 0.5 },
  weekday: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },
  weekdayToday: { color: Colors.text, fontFamily: Font.semibold },

  caption: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.regular },
});
