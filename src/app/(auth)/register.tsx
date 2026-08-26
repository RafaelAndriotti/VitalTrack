import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link, router } from 'expo-router';
import { Dumbbell, ArrowRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';

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
      router.replace('/(tabs)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Dumbbell size={30} color={Colors.textInverted} strokeWidth={Icon.stroke} />
            </View>
            <Text style={styles.title}>Criar conta</Text>
            <Text style={styles.subtitle}>Comece a acompanhar sua rotina</Text>
          </View>

          <View style={styles.form}>
            {error ? <View style={styles.errorBanner}><Text style={styles.errorText} accessibilityRole="alert">{error}</Text></View> : null}

            <View style={styles.field}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                placeholder="Seu nome"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput
                style={[styles.input, focusedField === 'email' && styles.inputFocused]}
                placeholder="voce@email.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Senha</Text>
              <TextInput
                style={[styles.input, focusedField === 'password' && styles.inputFocused]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar senha</Text>
              <TextInput
                style={[styles.input, focusedField === 'confirm' && styles.inputFocused]}
                placeholder="Repita a senha"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                secureTextEntry
              />
            </View>

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
                  <Text style={styles.buttonText}>Criar conta</Text>
                  <ArrowRight size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
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
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl, maxWidth: 420, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.xs },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Elevation.card,
  },
  title: { fontSize: FontSize.xl, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular, textAlign: 'center' },
  form: { gap: Spacing.md },
  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  errorBanner: { backgroundColor: Colors.dangerSoft, borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: BorderRadius.md, padding: Spacing.sm },
  errorText: { color: Colors.danger, fontSize: FontSize.sm, textAlign: 'center', fontFamily: Font.medium },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
    fontFamily: Font.medium,
  },
  inputFocused: { borderColor: Colors.primary },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    ...Elevation.card,
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: Font.semibold },
  link: { alignItems: 'center', marginTop: Spacing.md },
  linkText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontFamily: Font.regular },
  linkHighlight: { color: Colors.primary, fontFamily: Font.semibold },
});
