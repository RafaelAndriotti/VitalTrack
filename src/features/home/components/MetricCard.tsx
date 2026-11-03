import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Card, ProgressBar } from '@/components/ui';
import { Colors, Spacing, FontSize, Font, Icon } from '@/constants/theme';

interface MetricCardProps {
  title: string;
  icon: ReactNode;
  value: number;
  goal: number;
  unit: string;
  color: string;
  href: Href;
}

export function MetricCard({ title, icon, value, goal, unit, color, href }: MetricCardProps) {
  return (
    <Pressable onPress={() => router.push(href)}>
      <Card>
        <View style={styles.header}>
          <View style={styles.left}>
            {icon}
            <Text style={styles.title}>{title}</Text>
          </View>
          <ChevronRight size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value.toLocaleString('pt-BR')}</Text>
          <Text style={styles.goal}>/ {goal.toLocaleString('pt-BR')} {unit}</Text>
        </View>
        <ProgressBar value={value} max={goal} color={color} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  left: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginBottom: Spacing.sm },
  value: { fontSize: FontSize.xl, color: Colors.text, fontFamily: Font.bold, letterSpacing: -0.5 },
  goal: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
});
