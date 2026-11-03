import { View, StyleSheet } from 'react-native';
import { Tag } from '@/components/ui';
import { Spacing } from '@/constants/theme';

export function GroupTags({ groups }: { groups: string[] | undefined }) {
  if (!groups || groups.length === 0) return null;
  return (
    <View style={styles.row}>
      {groups.map((g) => (
        <Tag key={g} label={g} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
});
