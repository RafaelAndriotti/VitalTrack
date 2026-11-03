import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

interface HomeHeaderProps {
  name: string;
  /** Dias seguidos com treino concluído. */
  streak: number;
}

export function HomeHeader({ name, streak }: HomeHeaderProps) {
  const firstName = name.split(' ')[0] ?? '';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <View style={styles.row}>
      <View style={styles.avatar} accessibilityElementsHidden importantForAccessibility="no">
        <Text style={styles.initial}>{initial}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.greet}>{greeting()},</Text>
        <Text style={styles.name} numberOfLines={1} accessibilityRole="header">
          {firstName}
        </Text>
      </View>

      <View
        style={[styles.streak, streak === 0 && styles.streakIdle]}
        accessible
        accessibilityLabel={
          streak === 0 ? 'Nenhuma sequência de treinos' : `${streak} dias seguidos de treino`
        }
      >
        <Flame
          size={Icon.sm}
          color={streak === 0 ? Colors.textMuted : Colors.nutrition}
          fill={streak === 0 ? 'transparent' : Colors.nutrition}
          strokeWidth={Icon.stroke}
        />
        <Text style={[styles.streakText, streak === 0 && styles.streakTextIdle]}>
          {streak === 1 ? '1 dia' : `${streak} dias`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: FontSize.lg, color: Colors.textInverted, fontFamily: Font.bold },
  text: { flex: 1 },
  greet: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular },
  name: { fontSize: FontSize.xl, color: Colors.text, fontFamily: Font.bold, letterSpacing: -0.5 },

  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.nutritionSoft,
  },
  streakIdle: { backgroundColor: Colors.surfaceAlt },
  streakText: {
    fontSize: FontSize.sm,
    color: Colors.nutrition,
    fontFamily: Font.semibold,
    fontVariant: ['tabular-nums'],
  },
  streakTextIdle: { color: Colors.textMuted },
});
