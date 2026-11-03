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
      <Text style={styles.sectionLabel}>Adicionar</Text>
      <View style={styles.grid}>
        {RECIPIENTES.map((r) => {
          const iconSize = r.ml >= 500 ? 28 : 22;
          // Recipiente que estouraria a meta fica desabilitado; para usá-lo,
          // o usuário aumenta a meta.
          const exceeds = amount + r.ml > goal;
          return (
            <Pressable
              key={r.ml}
              accessibilityRole="button"
              style={[styles.btn, exceeds && styles.btnDisabled]}
              disabled={exceeds}
              onPress={() => onAdd(r.ml)}
            >
              <r.icon size={iconSize} color={Colors.water} strokeWidth={Icon.stroke} />
              <Text style={styles.name} numberOfLines={1}>{r.label}</Text>
              <Text style={styles.ml}>{r.ml} ml</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.md },
  sectionLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  btn: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.waterSoft,
    borderWidth: 1,
    borderColor: 'rgba(92, 156, 196, 0.40)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  btnDisabled: { opacity: 0.4 },
  name: { color: Colors.water, fontFamily: Font.semibold, fontSize: FontSize.sm },
  ml: { color: Colors.textSecondary, fontFamily: Font.medium, fontSize: FontSize.xs },
});
