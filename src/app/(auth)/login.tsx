import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Dumbbell, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';

/* Exceção de material: só o login usa um card de vidro (translúcido), a pedido.
   O restante do app segue o mundo sólido Clean Clínico. */
const Glass = {
  card: 'rgba(255, 255, 255, 0.06)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
  field: 'rgba(255, 255, 255, 0.08)',
  fieldBorder: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.10)',
} as const;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setError('Digite um e-mail válido.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Atmosfera: brilhos radiais suaves atrás do card */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Marca */}
          <View style={styles.logo}>
            <Dumbbell size={Icon.lg} color={Colors.primary} strokeWidth={Icon.stroke} />
          </View>
          <Text style={styles.title}>VitalTrack</Text>
          <Text style={styles.subtitle}>Seu treino e dieta em um só lugar</Text>

          {/* Formulário */}
          <View style={styles.form}>
            <TextInput
              style={[styles.input, focusedField === 'email' && styles.inputFocused]}
              placeholder="E-mail"
              placeholderTextColor="rgba(255,255,255,0.45)"
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
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              secureTextEntry
            />
            {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}

            <View style={styles.divider} />

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textInverted} />
              ) : (
                <>
                  <Text style={styles.buttonText}>Entrar</Text>
                  <ArrowRight size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
                </>
              )}
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Não tem conta? </Text>
              <Link href="/(auth)/register" asChild>
                <Pressable accessibilityRole="button" hitSlop={6}>
                  <Text style={styles.signupLink}>Criar conta</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },

  glowTop: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 320,
    backgroundColor: 'rgba(62, 142, 126, 0.12)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -140,
    right: -100,
    width: 340,
    height: 340,
    borderRadius: 340,
    backgroundColor: 'rgba(92, 156, 196, 0.08)',
  },

  card: {
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    backgroundColor: Glass.card,
    borderWidth: 1,
    borderColor: Glass.cardBorder,
    borderRadius: 28,
    padding: Spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 10,
  },

  logo: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: Glass.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xl, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular, marginTop: 2, marginBottom: Spacing.lg, textAlign: 'center' },

  form: { width: '100%', gap: Spacing.md },
  input: {
    width: '100%',
    backgroundColor: Glass.field,
    borderWidth: 1,
    borderColor: Glass.fieldBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    fontFamily: Font.medium,
  },
  inputFocused: { borderColor: Colors.primary },
  error: { color: Colors.danger, fontSize: FontSize.sm, fontFamily: Font.medium },

  divider: { height: 1, backgroundColor: Glass.divider, marginVertical: Spacing.xs },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: Font.semibold },

  signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xs },
  signupText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontFamily: Font.regular },
  signupLink: { color: Colors.primary, fontSize: FontSize.sm, fontFamily: Font.semibold },
});
