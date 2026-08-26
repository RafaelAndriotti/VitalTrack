import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, CalendarDays, Mail } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Elevation, Icon } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR')
    : '-';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Identidade */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.name} numberOfLines={1}>{user?.name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        {/* Dados da conta */}
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <CalendarDays size={Icon.md} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
              <Text style={styles.infoLabel}>Membro desde</Text>
            </View>
            <Text style={styles.infoValue}>{memberSince}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.infoLeft}>
              <Mail size={Icon.md} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
              <Text style={styles.infoLabel}>E-mail</Text>
            </View>
            <Text style={styles.infoValue} numberOfLines={1}>{user?.email}</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
          onPress={signOut}
        >
          <LogOut size={Icon.md} color={Colors.danger} strokeWidth={Icon.stroke} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.card,
  },
  avatarText: {
    fontSize: 28,
    fontFamily: Font.semibold,
    color: Colors.textInverted,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.xl,
    fontFamily: Font.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontFamily: Font.regular,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
    ...Elevation.card,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: Font.medium,
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontFamily: Font.semibold,
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  logoutButton: {
    backgroundColor: Colors.dangerSoft,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutPressed: {
    opacity: 0.75,
  },
  logoutText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontFamily: Font.semibold,
  },
});
