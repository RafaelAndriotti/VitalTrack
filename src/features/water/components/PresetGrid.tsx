import { Text, Pressable, View, StyleSheet } from 'react-native';
import { Card } from '@/components/ui';
import { RECIPIENTES } from '@/features/water/constants';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

interface PresetGridProps {
  amount: number;
  goal: number;
  onAdd: (ml: number) => void;
}

/** Recipientes — cada um armazena uma quantidade. */
export function PresetGrid({ amount, goal, onAdd }: PresetGridProps) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionLabel}>Registrar um recipiente</Text>
      <View style={styles.grid}>
        {RECIPIENTES.map((r) => {
          // Recipiente que estouraria a meta fica desabilitado; para usá-lo,
          // o usuário aumenta a meta.
          const exceeds = amount + r.ml > goal;
          return (
            <Pressable
              key={r.ml}
              accessibilityRole="button"
              accessibilityLabel={`${r.label}, ${r.ml} mililitros`}
              accessibilityState={{ disabled: exceeds }}
              style={({ pressed }) => [styles.btn, pressed && styles.pressed, exceeds && styles.btnDisabled]}
              disabled={exceeds}
              onPress={() => onAdd(r.ml)}
            >
              <r.icon size={Icon.md} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
              <Text style={styles.ml}>{r.ml} ml</Text>
              <Text style={styles.name} numberOfLines={1}>{r.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  btn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  pressed: { opacity: 0.8 },
  btnDisabled: { opacity: 0.4 },
  ml: {
    color: Colors.text,
    fontFamily: Font.semibold,
    fontSize: FontSize.md,
    fontVariant: ['tabular-nums'],
    marginTop: Spacing.xs,
  },
  name: { color: Colors.textMuted, fontFamily: Font.regular, fontSize: FontSize.xs },
});
