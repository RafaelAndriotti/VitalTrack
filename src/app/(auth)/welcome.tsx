import { View, Text, Pressable, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Dumbbell, Utensils, Droplets, ArrowRight } from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';

const WIDE_BREAKPOINT = 900;

const FEATURES = [
  { icon: Dumbbell, color: Colors.primary, title: 'Treinos em tempo real', desc: 'Séries, carga e repetições registradas durante o treino.' },
  { icon: Utensils, color: Colors.warning, title: 'Dieta com macros', desc: 'Calorias, proteína, carbo e gordura calculados por refeição.' },
  { icon: Droplets, color: Colors.water, title: 'Hidratação diária', desc: 'Acompanhe sua meta de água com atalhos rápidos.' },
];

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.inner, isWide && styles.innerWide]}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Dumbbell size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
          </View>
          <Text style={styles.brandName}>VitalTrack</Text>
        </View>

        <Text style={styles.headline}>
          Treine. Coma melhor.{'\n'}
          <Text style={styles.headlineAccent}>Evolua.</Text>
        </Text>

        <Text style={styles.description}>
          Registre treinos, acompanhe calorias e macros das refeições e bata sua meta
          de água — tudo em um app rápido, feito para a sua rotina.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => {
            const IconCmp = f.icon;
            return (
              <View key={f.title} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: Colors.surfaceAlt }]}>
                  <IconCmp size={Icon.md} color={f.color} strokeWidth={Icon.stroke} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureDesc}>{f.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
            <ArrowRight size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>Criar conta</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { flexGrow: 1, padding: Spacing.xl, justifyContent: 'center' },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center', gap: Spacing.lg },
  innerWide: { maxWidth: 520 },

  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandMark: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Elevation.card,
  },
  brandName: { fontSize: FontSize.lg, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.3 },

  headline: { fontSize: 34, lineHeight: 42, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5, marginTop: Spacing.sm },
  headlineAccent: { color: Colors.primary },
  description: { fontSize: FontSize.md, lineHeight: 24, color: Colors.textSecondary, fontFamily: Font.regular },

  features: { gap: Spacing.md, marginTop: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  featureIcon: { width: 44, height: 44, borderRadius: BorderRadius.md, justifyContent: 'center', alignItems: 'center' },
  featureTitle: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  featureDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular, marginTop: 1 },

  actions: { gap: Spacing.md, marginTop: Spacing.lg },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    ...Elevation.card,
  },
  primaryButtonText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: Font.semibold },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
  },
  secondaryButtonText: { color: Colors.text, fontSize: FontSize.md, fontFamily: Font.semibold },
  pressed: { opacity: 0.8 },
});
