import { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal, RefreshControl } from 'react-native';
import { meals as mealsApi } from '@/services/api';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon } from '@/constants/theme';
import type { Meal, FoodLibraryItem } from '@/types';
import { Card, ProgressBar, Loading, ErrorBanner, EmptyState } from '@/components/ui';
import { Plus, X, Trash2 } from 'lucide-react-native';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

const CALORIE_GOAL = 2500;
const PROTEIN_GOAL = 150;
const CARBS_GOAL = 300;
const FAT_GOAL = 80;

export default function DietScreen() {
  const [mealsList, setMealsList] = useState<Meal[]>([]);
  const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate] = useState(getTodayDate());

  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealTime, setNewMealTime] = useState('');

  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activeMealName, setActiveMealName] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [modalTab, setModalTab] = useState<'library' | 'custom'>('library');

  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState('100');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');

  const [selectedLibraryFood, setSelectedLibraryFood] = useState<FoodLibraryItem | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [mealsData, libraryData] = await Promise.all([
        mealsApi.list(selectedDate),
        mealsApi.getLibraryFoods(),
      ]);
      const sorted = [...mealsData].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      setMealsList(sorted);
      setFoodLibrary(libraryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function onRefresh() {
    setRefreshing(true);
    fetchData();
  }

  async function handleAddMeal() {
    if (!newMealName.trim()) return;
    try {
      setLoading(true);
      await mealsApi.create({
        name: newMealName.trim(),
        date: selectedDate,
        time: newMealTime.trim() || undefined,
      });
      setNewMealName('');
      setNewMealTime('');
      setShowAddMealModal(false);
      await fetchData();
    } catch (err) {
      setError('Erro ao criar refeição');
      setLoading(false);
    }
  }

  async function handleDeleteMeal(mealId: string) {
    try {
      setLoading(true);
      await mealsApi.delete(mealId);
      await fetchData();
    } catch (err) {
      setError('Erro ao deletar refeição');
      setLoading(false);
    }
  }

  async function handleAddCustomFood() {
    if (!activeMealId || !foodName.trim()) return;
    try {
      setLoading(true);
      const newFood = await mealsApi.addLibraryFood({
        name: foodName.trim(),
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        serving_size: 100,
      });
      const qty = parseFloat(amount) || 100;
      const ratio = qty / 100;
      await mealsApi.addFoodItem(activeMealId, {
        name: foodName.trim(),
        amount: qty,
        calories: Math.round(newFood.calories * ratio),
        protein: Math.round(newFood.protein * ratio),
        carbs: Math.round(newFood.carbs * ratio),
        fat: Math.round(newFood.fat * ratio),
      });
      resetFoodForm();
      setShowAddFoodModal(false);
      await fetchData();
    } catch (err) {
      setError('Erro ao cadastrar alimento');
      setLoading(false);
    }
  }

  async function handleAddLibraryFood() {
    if (!activeMealId || !selectedLibraryFood) return;
    try {
      setLoading(true);
      const qty = parseFloat(amount) || 100;
      const ratio = qty / selectedLibraryFood.serving_size;
      await mealsApi.addFoodItem(activeMealId, {
        name: selectedLibraryFood.name,
        amount: qty,
        calories: Math.round(selectedLibraryFood.calories * ratio),
        protein: Math.round(selectedLibraryFood.protein * ratio),
        carbs: Math.round(selectedLibraryFood.carbs * ratio),
        fat: Math.round(selectedLibraryFood.fat * ratio),
      });
      resetFoodForm();
      setShowAddFoodModal(false);
      await fetchData();
    } catch (err) {
      setError('Erro ao adicionar alimento da biblioteca');
      setLoading(false);
    }
  }

  function resetFoodForm() {
    setFoodName('');
    setAmount('100');
    setCalories('0');
    setProtein('0');
    setCarbs('0');
    setFat('0');
    setSelectedLibraryFood(null);
  }

  async function handleDeleteFood(mealId: string, itemId: string) {
    try {
      await mealsApi.deleteFoodItem(mealId, itemId);
      await fetchData();
    } catch (err) {
      setError('Erro ao deletar alimento');
    }
  }

  const allItems = mealsList.flatMap((m) => m.meal_items || []);
  const totalCalories = allItems.reduce((sum, item) => sum + Number(item.calories), 0);
  const totalProtein = allItems.reduce((sum, item) => sum + Number(item.protein), 0);
  const totalCarbs = allItems.reduce((sum, item) => sum + Number(item.carbs), 0);
  const totalFat = allItems.reduce((sum, item) => sum + Number(item.fat), 0);

  if (loading && !refreshing) return <Loading />;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <ErrorBanner message={error} />

        {/* Resumo de macros */}
        <Card style={{ gap: Spacing.md }}>
          <View style={styles.calorieRow}>
            <View style={styles.calorieValueRow}>
              <Text style={styles.calorieValue}>{totalCalories.toLocaleString('pt-BR')}</Text>
              <Text style={styles.calorieUnit}>/ {CALORIE_GOAL.toLocaleString('pt-BR')} kcal</Text>
            </View>
            <Text style={styles.calorieLabel}>Consumidas hoje</Text>
          </View>

          <ProgressBar value={totalCalories} max={CALORIE_GOAL} color={Colors.primary} height={12} />

          <View style={styles.macrosRow}>
            <MacroCol label="Proteína" grams={totalProtein} goal={PROTEIN_GOAL} color={Colors.protein} />
            <MacroCol label="Carbos" grams={totalCarbs} goal={CARBS_GOAL} color={Colors.carbs} />
            <MacroCol label="Gordura" grams={totalFat} goal={FAT_GOAL} color={Colors.fat} />
          </View>
        </Card>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refeições do dia</Text>
          <Pressable style={styles.addMealBtn} onPress={() => setShowAddMealModal(true)}>
            <Plus size={Icon.sm} color={Colors.primary} strokeWidth={Icon.stroke} />
            <Text style={styles.addMealBtnText}>Refeição</Text>
          </Pressable>
        </View>

        {mealsList.length === 0 ? (
          <EmptyState text="Nenhuma refeição cadastrada hoje." />
        ) : (
          mealsList.map((meal) => {
            const mealCalories = meal.meal_items?.reduce((s, i) => s + Number(i.calories), 0) || 0;
            const mealProtein = meal.meal_items?.reduce((s, i) => s + Number(i.protein), 0) || 0;
            return (
              <Card key={meal.id} style={{ marginBottom: 0 }}>
                <View style={styles.mealHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTitle}>
                      {meal.time ? `${meal.time} · ` : ''}{meal.name}
                    </Text>
                    <Text style={styles.mealSubtitle}>{mealProtein.toFixed(0)}g proteína · {mealCalories.toLocaleString('pt-BR')} kcal</Text>
                  </View>
                  <View style={styles.mealActions}>
                    <Pressable
                      style={styles.addFoodBtn}
                      onPress={() => {
                        setActiveMealId(meal.id);
                        setActiveMealName(meal.name);
                        setModalTab('library');
                        resetFoodForm();
                        setShowAddFoodModal(true);
                      }}
                    >
                      <Plus size={Icon.sm} color={Colors.text} strokeWidth={Icon.stroke} />
                    </Pressable>
                    <Pressable style={styles.deleteMealBtn} onPress={() => handleDeleteMeal(meal.id)}>
                      <X size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                    </Pressable>
                  </View>
                </View>

                {meal.meal_items?.length > 0 ? (
                  <View style={styles.foodList}>
                    {meal.meal_items.map((item) => (
                      <View key={item.id} style={styles.foodRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.foodName}>{item.name}</Text>
                          <Text style={styles.foodMacros}>
                            {item.amount}g · P {Number(item.protein).toFixed(0)} · C {Number(item.carbs).toFixed(0)} · G {Number(item.fat).toFixed(0)}
                          </Text>
                        </View>
                        <View style={styles.foodRight}>
                          <Text style={styles.foodKcal}>{Number(item.calories)} kcal</Text>
                          <Pressable onPress={() => handleDeleteFood(meal.id, item.id)} hitSlop={8}>
                            <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal: nova refeição */}
      <Modal visible={showAddMealModal} transparent animationType="fade" onRequestClose={() => setShowAddMealModal(false)}>
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContainer, styles.modalCentered]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova refeição</Text>
              <Pressable onPress={() => setShowAddMealModal(false)} hitSlop={8}>
                <X size={Icon.lg} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
              </Pressable>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="ex: Café da manhã"
                placeholderTextColor={Colors.textMuted}
                value={newMealName}
                onChangeText={setNewMealName}
                autoFocus
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Horário</Text>
              <TextInput
                style={styles.input}
                value={newMealTime}
                onChangeText={setNewMealTime}
                placeholder="ex: 08:00 (opcional)"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <Pressable style={styles.submitBtn} onPress={handleAddMeal}>
              <Text style={styles.submitBtnText}>Salvar refeição</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Modal: adicionar alimento */}
      <Modal visible={showAddFoodModal} transparent animationType="slide" onRequestClose={() => setShowAddFoodModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar a {activeMealName}</Text>
              <Pressable onPress={() => setShowAddFoodModal(false)} hitSlop={8}>
                <X size={Icon.lg} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
              </Pressable>
            </View>

            <View style={styles.modalTabs}>
              <Pressable style={[styles.modalTab, modalTab === 'library' && styles.modalTabActive]} onPress={() => setModalTab('library')}>
                <Text style={[styles.modalTabText, modalTab === 'library' && styles.modalTabActiveText]}>Biblioteca</Text>
              </Pressable>
              <Pressable style={[styles.modalTab, modalTab === 'custom' && styles.modalTabActive]} onPress={() => setModalTab('custom')}>
                <Text style={[styles.modalTabText, modalTab === 'custom' && styles.modalTabActiveText]}>Personalizado</Text>
              </Pressable>
            </View>

            {modalTab === 'library' && (
              <View style={styles.modalForm}>
                {!selectedLibraryFood ? (
                  <ScrollView style={{ maxHeight: 320 }}>
                    {foodLibrary.map((item) => (
                      <Pressable key={item.id} style={styles.libraryItem} onPress={() => setSelectedLibraryFood(item)}>
                        <Text style={styles.libraryItemText}>{item.name}</Text>
                        <Text style={styles.libraryItemSub}>
                          {item.calories} kcal · P {item.protein} · C {item.carbs} · G {item.fat} (em {item.serving_size}g)
                        </Text>
                      </Pressable>
                    ))}
                    {foodLibrary.length === 0 && <Text style={styles.mutedCenter}>Nenhum alimento na biblioteca.</Text>}
                  </ScrollView>
                ) : (
                  <View style={{ gap: Spacing.md }}>
                    <View style={styles.formRow}>
                      <Text style={styles.fieldLabel}>Alimento</Text>
                      <Text style={styles.formValue}>{selectedLibraryFood.name}</Text>
                    </View>
                    <View style={styles.formRow}>
                      <Text style={styles.fieldLabel}>Quantidade</Text>
                      <View style={styles.amountRow}>
                        <TextInput style={styles.amountInput} keyboardType="numeric" value={amount} onChangeText={setAmount} autoFocus />
                        <Text style={styles.amountUnit}>g</Text>
                      </View>
                    </View>
                    <View style={styles.rowButtons}>
                      <Pressable style={[styles.ghostBtn, { flex: 1 }]} onPress={() => setSelectedLibraryFood(null)}>
                        <Text style={styles.ghostBtnText}>Voltar</Text>
                      </Pressable>
                      <Pressable style={[styles.submitBtn, { flex: 2, marginTop: 0 }]} onPress={handleAddLibraryFood}>
                        <Text style={styles.submitBtnText}>Adicionar</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {modalTab === 'custom' && (
              <ScrollView style={styles.modalForm} contentContainerStyle={{ gap: Spacing.md }}>
                <View style={styles.formRow}>
                  <Text style={styles.fieldLabel}>Quantidade</Text>
                  <View style={styles.amountRow}>
                    <TextInput style={styles.amountInput} keyboardType="numeric" value={amount} onChangeText={setAmount} />
                    <Text style={styles.amountUnit}>g</Text>
                  </View>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Nome do alimento (ex: Omelete de 3 ovos)"
                  placeholderTextColor={Colors.textMuted}
                  value={foodName}
                  onChangeText={setFoodName}
                />
                <View style={styles.grid}>
                  <View style={styles.gridField}>
                    <Text style={styles.fieldLabel}>Kcal</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={calories} onChangeText={setCalories} />
                  </View>
                  <View style={styles.gridField}>
                    <Text style={styles.fieldLabel}>Proteína (g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={protein} onChangeText={setProtein} />
                  </View>
                  <View style={styles.gridField}>
                    <Text style={styles.fieldLabel}>Carbo (g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={carbs} onChangeText={setCarbs} />
                  </View>
                  <View style={styles.gridField}>
                    <Text style={styles.fieldLabel}>Gordura (g)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={fat} onChangeText={setFat} />
                  </View>
                </View>
                <Pressable style={styles.submitBtn} onPress={handleAddCustomFood}>
                  <Text style={styles.submitBtnText}>Salvar e adicionar</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function MacroCol({ label, grams, goal, color }: { label: string; grams: number; goal: number; color: string }) {
  return (
    <View style={styles.macroCol}>
      <View style={styles.macroInfo}>
        <Text style={styles.macroGram}>{grams.toFixed(0)}g</Text>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
      <ProgressBar value={grams} max={goal} color={color} height={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.md,
  },

  calorieRow: { gap: 2 },
  calorieValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  calorieValue: { fontSize: FontSize.display, fontFamily: Font.bold, color: Colors.text, letterSpacing: -1 },
  calorieUnit: { fontSize: FontSize.md, color: Colors.textSecondary, fontFamily: Font.medium },
  calorieLabel: { fontSize: FontSize.sm, color: Colors.textMuted, fontFamily: Font.medium },

  macrosRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  macroCol: { flex: 1, gap: Spacing.xs },
  macroInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  macroGram: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text },
  addMealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  addMealBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontFamily: Font.semibold },

  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  mealTitle: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  mealSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: Font.regular },
  mealActions: { flexDirection: 'row', gap: Spacing.xs },
  addFoodBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteMealBtn: { width: 36, height: 36, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },

  foodList: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md, marginTop: Spacing.md, gap: Spacing.sm },
  foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  foodName: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.medium },
  foodMacros: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontFamily: Font.regular },
  foodRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  foodKcal: { fontSize: FontSize.sm, color: Colors.text, fontFamily: Font.semibold },

  // Modais
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.lg },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '90%',
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalCentered: { width: '100%', maxWidth: 400, borderRadius: BorderRadius.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text, flex: 1 },
  modalTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.lg },
  modalTab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  modalTabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  modalTabText: { fontSize: FontSize.md, color: Colors.textMuted, fontFamily: Font.medium },
  modalTabActiveText: { color: Colors.text, fontFamily: Font.semibold },
  modalForm: { minHeight: 200 },

  field: { marginBottom: Spacing.md, gap: Spacing.xs },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formValue: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  amountInput: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    width: 90,
    height: 48,
    color: Colors.text,
    textAlign: 'center',
    fontFamily: Font.semibold,
    fontSize: FontSize.md,
  },
  amountUnit: { color: Colors.textSecondary, fontSize: FontSize.sm, fontFamily: Font.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridField: { width: '47%', gap: Spacing.xs },
  rowButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },

  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitBtnText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: Font.semibold },
  ghostBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  ghostBtnText: { color: Colors.text, fontSize: FontSize.md, fontFamily: Font.semibold },

  libraryItem: {
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  libraryItemText: { color: Colors.text, fontSize: FontSize.md, fontFamily: Font.semibold },
  libraryItemSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4, fontFamily: Font.regular },
  mutedCenter: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginVertical: Spacing.md, fontFamily: Font.regular },
});
