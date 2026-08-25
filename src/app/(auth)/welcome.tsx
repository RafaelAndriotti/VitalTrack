import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import {
  Dumbbell,
  Utensils,
  Droplets,
  Target,
  TrendingUp,
  ArrowRight,
  Play,
  Star,
  Activity,
  Flame,
  Award,
} from 'lucide-react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';

const WIDE_BREAKPOINT = 900;

/* Cores de vidro (glassmorphism) — traduzem os utilitários
 * bg-white/5, border-white/10 do template Tailwind. */
const Glass = {
  fill: 'rgba(255, 255, 255, 0.05)',
  fillStrong: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.10)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
} as const;

/* Hook de entrada: fade + slide vertical, equivalente ao
 * @keyframes fadeSlideIn do template, com delay escalonado. */
function useEntrance(delay: number) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 500,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);

  return {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [24, 0],
        }),
      },
    ],
  };
}

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const badgeAnim = useEntrance(0);
  const titleAnim = useEntrance(90);
  const descAnim = useEntrance(180);
  const ctaAnim = useEntrance(270);
  const cardAnim = useEntrance(200);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, isWide && styles.scrollContentWide]}
    >
      {/* Brilho radial de fundo (traduz o glow do template) */}
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <View style={[styles.hero, isWide && styles.heroWide]}>
        {/* Coluna esquerda: apresentação + ações */}
        <View style={[styles.pitch, isWide && styles.pitchWide]}>
          <Animated.View style={[styles.brandRow, isWide && styles.brandRowWide]}>
            <Dumbbell size={32} color={Colors.primary} />
            <Text style={styles.brandName}>VitalTrack</Text>
          </Animated.View>

          {/* Badge glassmorphism (pill com blur/borda translúcida + estrela) */}
          <Animated.View style={[styles.badge, badgeAnim]}>
            <Star size={14} color={Colors.primary} fill={Colors.primary} />
            <Text style={styles.badgeText}>Seu treino e dieta em um só lugar</Text>
          </Animated.View>

          <Animated.Text
            style={[styles.headline, isWide && styles.headlineWide, titleAnim]}
            accessibilityRole="header"
          >
            Treine. Coma melhor.{'\n'}
            <Text style={styles.headlineAccent}>Evolua.</Text>
          </Animated.Text>

          <Animated.Text style={[styles.description, isWide && styles.descriptionWide, descAnim]}>
            Registre séries, peso e repetições em tempo real, acompanhe calorias e
            macros das refeições e bata sua meta de água todos os dias. Tudo em um
            app rápido e feito para a sua rotina.
          </Animated.Text>

          <Animated.View style={[styles.actions, isWide && styles.actionsWide, ctaAnim]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Entrar na sua conta"
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.primaryButtonText}>Entrar</Text>
              <ArrowRight size={18} color={Colors.textInverted} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Criar uma nova conta"
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
              onPress={() => router.push('/(auth)/register')}
            >
              <Play size={16} color={Colors.text} fill={Colors.text} />
              <Text style={styles.secondaryButtonText}>Criar conta</Text>
            </Pressable>
          </Animated.View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Já tem conta? Entrar"
            style={styles.textLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.textLinkLabel}>
              Já tem conta? <Text style={styles.textLinkHighlight}>Entrar</Text>
            </Text>
          </Pressable>
        </View>

        {/* Coluna direita: card de stats glass + marquee de features */}
        <Animated.View style={[styles.showcase, isWide && styles.showcaseWide, cardAnim]}>
          <StatsCard />
          <FeatureMarquee />
        </Animated.View>
      </View>
    </ScrollView>
  );
}

/* -------------------- Card de stats glassmorphism -------------------- */

function StatsCard() {
  return (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <View style={styles.statsHeaderLeft}>
          <View style={styles.statsIcon}>
            <Target size={20} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.statsTitle}>Resumo da semana</Text>
            <Text style={styles.statsSub}>Você está no ritmo</Text>
          </View>
        </View>
        <View style={styles.tagRow}>
          <View style={styles.tagActive}>
            <Text style={styles.tagActiveText}>ATIVO</Text>
          </View>
        </View>
      </View>

      {/* Barra de progresso — Meta de água */}
      <View style={styles.progressBlock}>
        <View style={styles.progressLabelRow}>
          <View style={styles.progressLabelLeft}>
            <Droplets size={14} color="#3B82F6" />
            <Text style={styles.progressLabel}>Meta de água</Text>
          </View>
          <Text style={styles.progressValue}>78%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '78%' }]} />
        </View>
      </View>

      {/* Mini-stats */}
      <View style={styles.miniStatsRow}>
        <MiniStat icon={<Activity size={16} color={Colors.primary} />} value="128" label="Séries" />
        <MiniStat icon={<Flame size={16} color={Colors.warning} />} value="1.8k" label="kcal" />
        <MiniStat icon={<Award size={16} color={Colors.primary} />} value="12" label="Streak" />
      </View>

      <View style={styles.statsFooter}>
        <View style={styles.tagPremium}>
          <Text style={styles.tagPremiumText}>PREMIUM</Text>
        </View>
        <View style={styles.trendChip}>
          <TrendingUp size={14} color={Colors.success} />
          <Text style={styles.trendText}>+18% vs. semana passada</Text>
        </View>
      </View>
    </View>
  );
}

function MiniStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      {icon}
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatLabel}>{label}</Text>
    </View>
  );
}

/* -------------------- Marquee de features (loop infinito) -------------------- */

type Feature = { label: string; icon: React.ReactNode };

const FEATURES: Feature[] = [
  { label: 'Treino', icon: <Dumbbell size={14} color={Colors.primary} /> },
  { label: 'Dieta', icon: <Utensils size={14} color={Colors.primary} /> },
  { label: 'Água', icon: <Droplets size={14} color="#3B82F6" /> },
  { label: 'Macros', icon: <Flame size={14} color={Colors.warning} /> },
  { label: 'Progresso', icon: <TrendingUp size={14} color={Colors.success} /> },
];

function FeaturePill({ feature }: { feature: Feature }) {
  return (
    <View style={styles.featurePill}>
      {feature.icon}
      <Text style={styles.featurePillText}>{feature.label}</Text>
    </View>
  );
}

function FeatureMarquee() {
  const translateX = useRef(new Animated.Value(0)).current;
  // Largura de um ciclo (metade da faixa duplicada). Estimada; o segundo
  // bloco idêntico garante continuidade visual mesmo com pequena variação.
  const cycleWidth = useRef(0);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;

    const start = () => {
      const distance = cycleWidth.current || 640;
      translateX.setValue(0);
      loop = Animated.loop(
        Animated.timing(translateX, {
          toValue: -distance,
          duration: distance * 22, // ~22ms por px => velocidade suave
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      loop.start();
    };

    start();
    return () => loop?.stop();
  }, [translateX]);

  return (
    <View style={styles.marqueeCard}>
      <Text style={styles.marqueeTitle}>Tudo que você acompanha</Text>
      <View style={styles.marqueeViewport}>
        <Animated.View style={[styles.marqueeTrack, { transform: [{ translateX }] }]}>
          {/* Dois blocos idênticos para o loop parecer contínuo */}
          <View
            style={styles.marqueeBlock}
            onLayout={(e) => {
              cycleWidth.current = e.nativeEvent.layout.width;
            }}
          >
            {FEATURES.map((f) => (
              <FeaturePill key={`a-${f.label}`} feature={f} />
            ))}
          </View>
          <View style={styles.marqueeBlock}>
            {FEATURES.map((f) => (
              <FeaturePill key={`b-${f.label}`} feature={f} />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
  },
  scrollContentWide: {
    paddingHorizontal: Spacing.xxl,
  },

  /* Glows radiais decorativos */
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

  hero: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: Spacing.xxl,
  },
  heroWide: {
    maxWidth: 1120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xxl,
  },

  /* --- Pitch --- */
  pitch: {
    gap: Spacing.lg,
    alignItems: 'center',
  },
  pitchWide: {
    flex: 1,
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandRowWide: {
    marginBottom: Spacing.xs,
  },
  brandName: {
    fontSize: FontSize.lg,
    fontFamily: 'Poppins_900Black',
    color: Colors.text,
    letterSpacing: -0.5,
  },

  /* Badge glass */
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'center',
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },

  headline: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headlineWide: {
    fontSize: 52,
    lineHeight: 58,
    textAlign: 'left',
  },
  headlineAccent: {
    color: Colors.primary,
    fontFamily: 'Poppins_900Black',
  },
  description: {
    fontSize: FontSize.md,
    lineHeight: 24,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  descriptionWide: {
    textAlign: 'left',
    maxWidth: 460,
  },

  actions: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionsWide: {
    flexDirection: 'row',
    width: 'auto',
  },
  primaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: Colors.textInverted,
    fontSize: FontSize.md,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.borderStrong,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: 'Poppins_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.8,
  },
  textLink: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
  },
  textLinkLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontFamily: 'Poppins_500Medium',
  },
  textLinkHighlight: {
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },

  /* --- Showcase (coluna direita) --- */
  showcase: {
    width: '100%',
    gap: Spacing.md,
    alignItems: 'stretch',
  },
  showcaseWide: {
    flex: 1,
    maxWidth: 460,
  },

  /* Card de stats glass */
  statsCard: {
    backgroundColor: Glass.fillStrong,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  statsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(210, 255, 58, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsTitle: {
    fontSize: FontSize.md,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text,
  },
  statsSub: {
    fontSize: FontSize.xs,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textMuted,
  },
  tagRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  tagActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderRadius: BorderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  tagActiveText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: Colors.success,
    letterSpacing: 1,
  },

  progressBlock: {
    gap: Spacing.sm,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },
  progressValue: {
    fontSize: FontSize.sm,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text,
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
    backgroundColor: '#3B82F6',
  },

  miniStatsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  miniStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  miniStatValue: {
    fontSize: FontSize.lg,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text,
    marginTop: 2,
  },
  miniStatLabel: {
    fontSize: FontSize.xs,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textMuted,
  },

  statsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  tagPremium: {
    backgroundColor: 'rgba(210, 255, 58, 0.14)',
    borderRadius: BorderRadius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  tagPremiumText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    letterSpacing: 1,
  },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
  },
  trendText: {
    fontSize: FontSize.xs,
    fontFamily: 'Poppins_500Medium',
    color: Colors.textSecondary,
  },

  /* Marquee */
  marqueeCard: {
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  marqueeTitle: {
    fontSize: FontSize.xs,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: Spacing.md,
  },
  marqueeViewport: {
    overflow: 'hidden',
  },
  marqueeTrack: {
    flexDirection: 'row',
  },
  marqueeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Glass.fill,
    borderWidth: 1,
    borderColor: Glass.border,
    borderRadius: BorderRadius.full,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    marginLeft: Spacing.sm,
  },
  featurePillText: {
    fontSize: FontSize.sm,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text,
  },
});
