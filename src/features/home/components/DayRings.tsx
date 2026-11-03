import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Card, Ring } from '@/components/ui';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

export interface DayGoal {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color: string;
  /** Texto da leitura quando o número bruto não diz nada (ex.: treino). */
  readout?: string;
  href: Href;
}

const br = (n: number) => n.toLocaleString('pt-BR');

function GoalRow({ goal: g }: { goal: DayGoal }) {
  const reached = g.goal > 0 && g.value >= g.goal;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${g.label}: ${g.readout ?? `${br(g.value)} de ${br(g.goal)} ${g.unit}`}`}
      onPress={() => router.push(g.href)}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.dot, { backgroundColor: g.color }]} />
      <Text style={styles.rowLabel}>{g.label}</Text>
      <Text style={[styles.rowValue, reached && { color: g.color }]}>
        {g.readout ?? `${br(g.value)} / ${br(g.goal)} ${g.unit}`}
      </Text>
      <ChevronRight size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
    </Pressable>
  );
}

/**
 * A assinatura do VitalTrack: o dia inteiro em três arcos concêntricos —
 * treino, nutrição e hidratação, uma cor por domínio. O centro conta quantas
 * metas já fecharam; cada linha abaixo leva à aba daquele domínio.
 */
export function DayRings({ goals }: { goals: DayGoal[] }) {
  const reached = goals.filter((g) => g.goal > 0 && g.value >= g.goal).length;

  return (
    <Card style={styles.card}>
      <Ring
        arcs={goals.map((g) => ({ value: g.value, max: g.goal, color: g.color, label: g.label }))}
        size={184}
        stroke={12}
        gap={5}
      >
        <Text style={styles.count}>{reached}</Text>
        <Text style={styles.countLabel}>de {goals.length} metas</Text>
      </Ring>

      <View style={styles.rows}>
        {goals.map((g) => (
          <GoalRow key={g.label} goal={g} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },

  count: {
    fontSize: FontSize.xxl,
    fontFamily: Font.bold,
    color: Colors.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  countLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium, marginTop: 2 },

  rows: { alignSelf: 'stretch', gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  rowPressed: { backgroundColor: Colors.surfaceAlt },
  dot: { width: 8, height: 8, borderRadius: BorderRadius.full },
  rowLabel: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.medium },
  rowValue: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: Font.semibold,
    fontVariant: ['tabular-nums'],
  },
});
