import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      {/* Brilhos radiais de fundo, como no hero */}
      <View pointerEvents="none" style={styles.glowTop} />

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Membro desde</Text>
            <Text style={styles.infoValue}>
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('pt-BR')
                : '-'}
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}
          onPress={signOut}
        >
          <LogOut size={20} color={Colors.danger} style={{ marginRight: Spacing.sm }} />
          <Text style={styles.logoutText}>Sair da Conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

const Glass = {
  fill: 'rgba(255, 255, 255, 0.05)',
  fillStrong: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -90,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(210, 255, 58, 0.10)',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: BorderRadius.full,
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textInverted,
  },
  name: {
    fontSize: FontSize.xxl,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text,
    marginBottom: 2,
  },
  email: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
  },
  section: {
    backgroundColor: Glass.fillStrong,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Glass.border,
    marginBottom: Spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_500Medium',
  },
  infoValue: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontFamily: 'Poppins_600SemiBold',
  },
  logoutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutPressed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  logoutText: {
    color: Colors.danger,
    fontSize: FontSize.md,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
