import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Dumbbell, Star, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

/* Cores de vidro (glassmorphism), iguais às do welcome.tsx. */
const Glass = {
  fill: 'rgba(255, 255, 255, 0.05)',
  fillStrong: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
} as const;

type Field = 'name' | 'email' | 'password' | 'confirm';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<Field | null>(null);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signUp(email.trim(), password, name.trim());
      router.replace('/(tabs)/workouts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Brilhos radiais de fundo, como no hero */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Dumbbell size={40} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <View style={styles.badge}>
              <Star size={13} color={Colors.primary} fill={Colors.primary} />
              <Text style={styles.badgeText}>Comece a registrar seus treinos</Text>
            </View>
          </View>

          <View style={styles.form}>
            {error ? (
              <Text style={styles.error} accessibilityRole="alert">{error}</Text>
            ) : null}

            <TextInput
              style={[styles.input, focusedField === 'name' && styles.inputFocused]}
              placeholder="Nome"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              autoCapitalize="words"
            />

            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              placeholder="E-mail"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={[styles.input, focusedField === 'password' && styles.inputFocused]}
              placeholder="Senha"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />

            <TextInput
              style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
              placeholder="Confirmar Senha"
              placeholderTextColor={Colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setFocusedField('confirm')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverted} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Criar Conta</Text>
                  <ArrowRight size={18} color={Colors.textInverted} />
                </>
              )}
            </Pressable>

            <Link href="/(auth)/login" asChild>
              <Pressable accessibilityRole="button" style={styles.link}>
                <Text style={styles.linkText}>
                  Já tem conta? <Text style={styles.linkHighlight}>Fazer login</Text>
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(210, 255, 58, 0.10)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  content: {
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(210, 255, 58, 0.10)',
    borderWidth: 1,
    borderColor: Glass.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_900Black',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 0.3,
  },
  form: {
    gap: Spacing.md,
  },
  error: {
    color: Colors.danger,
    fontSize: FontSize.sm,
    textAlign: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontFamily: 'Poppins_500Medium',
  },
  input: {
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    fontSize: FontSize.md,
    color: Colors.text,
    fontFamily: 'Poppins_500Medium',
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Glass.fillStrong,
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    marginTop: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: Colors.textInverted,
    fontSize: FontSize.md,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  link: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'Poppins_500Medium',
  },
  linkHighlight: {
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
});
