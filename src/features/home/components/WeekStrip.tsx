import { View, Text, StyleSheet } from 'react-native';
import type { WeekDay } from '@/lib/date';
import { Colors, Spacing, FontSize, BorderRadius, Font } from '@/constants/theme';

interface WeekStripProps {
  week: WeekDay[];
  /** Datas (YYYY-MM-DD) com treino concluído. */
  trained: Set<string>;
}

/**
 * A semana corrente, de segunda a domingo. Dia treinado ganha o círculo cheio
 * no verde do treino; hoje ganha o contorno. Nada aqui é decorativo: cada marca
 * é um treino concluído de verdade.
 */
export function WeekStrip({ week, trained }: WeekStripProps) {
  const count = week.filter((d) => trained.has(d.iso)).length;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Semana: ${count} de 7 dias com treino concluído`}
    >
      {week.map((d) => {
        const done = trained.has(d.iso);
        return (
          <View key={d.iso} style={[styles.day, d.isToday && styles.dayToday]}>
            <Text style={[styles.weekday, d.isToday && styles.weekdayToday]}>{d.weekday}</Text>
            <View style={[styles.dot, done && styles.dotDone, d.isToday && !done && styles.dotToday]}>
              <Text
                style={[
                  styles.num,
                  d.isFuture && styles.numFuture,
                  done && styles.numDone,
                ]}
              >
                {d.day}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DOT = 34;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayToday: { backgroundColor: Colors.surfaceAlt, borderColor: Colors.borderStrong },
  weekday: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },
  weekdayToday: { color: Colors.text, fontFamily: Font.semibold },

  dot: {
    width: DOT,
    height: DOT,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.track,
  },
  dotToday: { borderColor: Colors.primary },
  dotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  num: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontFamily: Font.semibold,
    fontVariant: ['tabular-nums'],
  },
  numFuture: { color: Colors.textMuted },
  numDone: { color: Colors.textInverted },
});
