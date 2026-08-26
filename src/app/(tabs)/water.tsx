import { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { water as waterApi } from '@/services/api';
import type { DailyWater } from '@/types';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import { Screen, Card, ProgressBar, Loading, ErrorBanner } from '@/components/ui';
import { CupSoda, Droplets, GlassWater, Milk, Minus, Plus } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// Cada quantidade é um recipiente que armazena água: ícone, nome e capacidade.
type Recipiente = { ml: number; label: string; icon: LucideIcon };

const RECIPIENTES: Recipiente[] = [
  { ml: 100, label: 'Dose', icon: CupSoda },
  { ml: 200, label: 'Copo pequeno', icon: GlassWater },
  { ml: 250, label: 'Copo', icon: GlassWater },
  { ml: 300, label: 'Copo grande', icon: GlassWater },
  { ml: 500, label: 'Garrafa', icon: Milk },
  { ml: 750, label: 'Garrafa grande', icon: Milk },
  { ml: 1000, label: 'Garrafão', icon: Milk },
];

function parseMl(value: string): number | null {
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

const DEFAULT_GOAL = 2000;

export default function WaterScreen() {
  const [daily, setDaily] = useState<DailyWater | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [custom, setCustom] = useState('');
  const [removeAmount, setRemoveAmount] = useState('');
  const [goalInput, setGoalInput] = useState(String(DEFAULT_GOAL));
  const date = today();

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const data = await waterApi.get(date);
      setDaily(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar hidratação');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Sincroniza o texto do campo de meta quando o valor chega do servidor,
  // sem sobrescrever o que o usuário está digitando (só reage a goal_ml).
  useEffect(() => {
    setGoalInput(daily ? String(daily.goal_ml) : String(DEFAULT_GOAL));
  }, [daily?.goal_ml]);

  async function addWater(ml: number) {
    const currentAmount = daily?.amount_ml ?? 0;
    const currentGoal = daily?.goal_ml ?? DEFAULT_GOAL;
    // Ao adicionar, o total não pode ultrapassar a meta. Para registrar mais,
    // o usuário precisa aumentar a meta primeiro.
    if (ml > 0 && currentAmount + ml > currentGoal) {
      setError(
        `Meta de ${currentGoal.toLocaleString('pt-BR')} ml atingida. Aumente a meta para registrar mais.`
      );
      return;
    }
    setError('');
    const next = Math.max(0, currentAmount + ml);
    // Otimista — funciona mesmo se ainda não existir registro do dia (daily === null).
    setDaily({ ...(daily as DailyWater | null ?? {} as DailyWater), amount_ml: next, goal_ml: currentGoal });
    try {
      const updated = await waterApi.update({ date, amount_ml: next });
      setDaily(updated);
    } catch {
      setError('Erro ao registrar água');
      fetchData();
    }
  }

  async function commitGoal() {
    const num = parseInt(goalInput, 10);
    if (isNaN(num) || num <= 0) {
      // Texto inválido/vazio: restaura o valor válido atual em vez de gravar lixo.
      setGoalInput(daily ? String(daily.goal_ml) : String(DEFAULT_GOAL));
      return;
    }
    const currentAmount = daily?.amount_ml ?? 0;
    setDaily({ ...(daily as DailyWater | null ?? {} as DailyWater), goal_ml: num, amount_ml: currentAmount });
    try {
      const updated = await waterApi.update({ date, goal_ml: num });
      setDaily(updated);
    } catch {
      setError('Erro ao atualizar meta');
      fetchData();
    }
  }

  if (loading) return <Loading />;

  const amount = daily?.amount_ml ?? 0;
  const goal = daily?.goal_ml ?? DEFAULT_GOAL;
  const pct = goal > 0 ? Math.round((amount / goal) * 100) : 0;
  const remaining = Math.max(0, goal - amount);

  function handleAddCustom() {
    const ml = parseMl(custom);
    if (ml !== null) addWater(ml);
    setCustom('');
  }

  function handleRemove() {
    const ml = parseMl(removeAmount);
    if (ml !== null) addWater(-ml);
    setRemoveAmount('');
  }

  return (
    <Screen>
      <ErrorBanner message={error} />

      {/* Leitura principal do dia */}
      <Card style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.badge}>
            <Droplets size={Icon.sm} color={Colors.water} strokeWidth={Icon.stroke} />
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>Meta</Text>
            <TextInput
              style={styles.goalInput}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              onBlur={commitGoal}
              onSubmitEditing={commitGoal}
              returnKeyType="done"
            />
            <Text style={styles.goalLabel}>ml</Text>
          </View>
        </View>

        <View style={styles.readout}>
          <Text style={styles.amount}>{amount.toLocaleString('pt-BR')}</Text>
          <Text style={styles.unit}>ml</Text>
        </View>
        <Text style={styles.sub}>
          {pct}% da meta
          {remaining > 0 ? ` · faltam ${remaining.toLocaleString('pt-BR')} ml` : ' · meta atingida'}
        </Text>

        <View style={styles.barWrap}>
          <ProgressBar value={amount} max={goal} color={Colors.water} height={12} />
        </View>
      </Card>

      {/* Recipientes — cada um armazena uma quantidade */}
      <Card style={styles.presetsCard}>
        <Text style={styles.sectionLabel}>Adicionar</Text>
        <View style={styles.presetGrid}>
          {RECIPIENTES.map((r) => {
            const iconSize = r.ml >= 500 ? 28 : 22;
            // Recipiente que estouraria a meta fica desabilitado; para usá-lo,
            // o usuário aumenta a meta.
            const exceeds = amount + r.ml > goal;
            return (
              <Pressable
                key={r.ml}
                style={[styles.presetBtn, exceeds && styles.presetBtnDisabled]}
                disabled={exceeds}
                onPress={() => addWater(r.ml)}
              >
                <r.icon size={iconSize} color={Colors.water} strokeWidth={Icon.stroke} />
                <Text style={styles.presetName} numberOfLines={1}>
                  {r.label}
                </Text>
                <Text style={styles.presetMl}>{r.ml} ml</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Quantidade custom */}
      <Card style={styles.customCard}>
        <Text style={styles.sectionLabel}>Outra quantidade</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="ml"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={custom}
            onChangeText={setCustom}
            returnKeyType="done"
            onSubmitEditing={handleAddCustom}
          />
          <Pressable style={styles.customAdd} onPress={handleAddCustom}>
            <Text style={styles.customAddText}>Adicionar</Text>
          </Pressable>
        </View>
      </Card>

      {/* Remover (corrigir registro) */}
      <Card style={styles.customCard}>
        <Text style={styles.sectionLabel}>Remover quantidade</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.customInput}
            placeholder="ml"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={removeAmount}
            onChangeText={setRemoveAmount}
            returnKeyType="done"
            onSubmitEditing={handleRemove}
          />
          <Pressable style={styles.removeBtn} onPress={handleRemove}>
            <Minus size={Icon.sm} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
            <Text style={styles.removeText}>Remover</Text>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.sm },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.waterSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  goalLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  goalInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 64,
    textAlign: 'center',
    color: Colors.text,
    fontSize: FontSize.sm,
    fontFamily: Font.semibold,
  },
  readout: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs, marginTop: Spacing.sm },
  amount: { fontSize: FontSize.display, fontFamily: Font.bold, color: Colors.text, letterSpacing: -1 },
  unit: { fontSize: FontSize.lg, fontFamily: Font.medium, color: Colors.textSecondary },
  sub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  barWrap: { marginTop: Spacing.sm },

  sectionLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },

  presetsCard: { gap: Spacing.md },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  presetBtn: {
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
  presetBtnDisabled: { opacity: 0.4 },
  presetName: { color: Colors.water, fontFamily: Font.semibold, fontSize: FontSize.sm },
  presetMl: { color: Colors.textSecondary, fontFamily: Font.medium, fontSize: FontSize.xs },

  customCard: { gap: Spacing.sm },
  customRow: { flexDirection: 'row', gap: Spacing.sm },
  customInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    height: 48,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  customAdd: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  customAddText: { color: Colors.textInverted, fontFamily: Font.semibold, fontSize: FontSize.sm },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  removeText: { color: Colors.textSecondary, fontFamily: Font.semibold, fontSize: FontSize.sm },
});
