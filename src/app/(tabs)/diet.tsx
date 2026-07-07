import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Modal, RefreshControl } from 'react-native';
import { meals as mealsApi, water as waterApi } from '@/services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Meal, MealItem, FoodLibraryItem, DailyWater } from '@/types';
import { TrendingUp, Droplets, X, Trash2 } from 'lucide-react-native';
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export default function DietScreen() {
  const [mealsList, setMealsList] = useState<Meal[]>([]);
  const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
  const [dailyWater, setDailyWater] = useState<DailyWater | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate] = useState(getTodayDate());

  // Modal de Adicionar Refeição
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealTime, setNewMealTime] = useState('');

  // Modal de Adicionar Alimento
  const [activeMealId, setActiveMealId] = useState<string | null>(null);
  const [activeMealName, setActiveMealName] = useState('');
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [modalTab, setModalTab] = useState<'library' | 'custom'>('library');

  // New Food Form State
  const [foodName, setFoodName] = useState('');
  const [amount, setAmount] = useState('100');
  const [calories, setCalories] = useState('0');
  const [protein, setProtein] = useState('0');
  const [carbs, setCarbs] = useState('0');
  const [fat, setFat] = useState('0');

  // Estado para adicionar da biblioteca
  const [selectedLibraryFood, setSelectedLibraryFood] = useState<FoodLibraryItem | null>(null);

  // Água customizada
  const [customWaterAdd, setCustomWaterAdd] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [mealsData, libraryData, waterData] = await Promise.all([
        mealsApi.list(selectedDate),
        mealsApi.getLibraryFoods(),
        waterApi.get(selectedDate)
      ]);
      
      // Ordena por horário (time), lidando com null
      const sorted = [...mealsData].sort((a, b) => {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      });
      
      setMealsList(sorted);
      setFoodLibrary(libraryData);
      setDailyWater(waterData);
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

  // --- REFEIÇÕES ---

  async function handleAddMeal() {
    if (!newMealName.trim()) return;
    try {
      setLoading(true);
      await mealsApi.create({
        name: newMealName.trim(),
        date: selectedDate,
        time: newMealTime.trim() || null,
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

  // --- ALIMENTOS ---

  // Custom
  async function handleAddCustomFood() {
    if (!activeMealId || !foodName.trim()) return;
    try {
      setLoading(true);
      // Salva na biblioteca também para uso futuro
      const newFood = await mealsApi.addLibraryFood({
        name: foodName.trim(),
        calories: parseInt(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        serving_size: 100, // custom sempre usa 100 como base
      });

      // Adiciona na refeição calculando proporção
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

  // Da biblioteca
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

  // --- ÁGUA ---
  async function handleAddWater(addMl: number) {
    if (!dailyWater) return;
    try {
      const newAmount = Math.max(0, dailyWater.amount_ml + addMl);
      // Atualiza localmente otimista
      setDailyWater({ ...dailyWater, amount_ml: newAmount });
      await waterApi.update({ date: selectedDate, amount_ml: newAmount });
    } catch (err) {
      setError('Erro ao registrar água');
      await fetchData();
    }
  }

  async function handleUpdateWaterGoal(goalStr: string) {
    if (!dailyWater) return;
    const num = parseInt(goalStr);
    if (isNaN(num)) return;
    
    try {
      setDailyWater({ ...dailyWater, goal_ml: num });
      await waterApi.update({ date: selectedDate, goal_ml: num });
    } catch (err) {
      setError('Erro ao atualizar meta de água');
      await fetchData();
    }
  }


  // Cálculos de Macros Totais
  const allItems = mealsList.flatMap(m => m.meal_items || []);
  const totalCalories = allItems.reduce((sum, item) => sum + item.calories, 0);
  const totalProtein = allItems.reduce((sum, item) => sum + Number(item.protein), 0);
  const totalCarbs = allItems.reduce((sum, item) => sum + Number(item.carbs), 0);
  const totalFat = allItems.reduce((sum, item) => sum + Number(item.fat), 0);

  const CALORIE_GOAL = 2500;
  const PROTEIN_GOAL = 150;
  const CARBS_GOAL = 300;
  const FAT_GOAL = 80;

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* --- CABEÇALHO RESUMO DE DIETA --- */}
        <View style={styles.summaryCard}>
          <View style={styles.calorieRow}>
            <View>
              <Text style={styles.calorieTitle}>{totalCalories} <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary }}>kcal consumidas</Text></Text>
              <Text style={styles.calorieSubtitle}>Meta diária: {CALORIE_GOAL} kcal</Text>
            </View>
            <TrendingUp size={24} color={Colors.primary} />
          </View>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((totalCalories / CALORIE_GOAL) * 100, 100)}%` }
              ]}
            />
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroCol}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroGram}>{totalProtein.toFixed(0)}g</Text>
                <Text style={styles.macroLabel}>Proteína</Text>
              </View>
              <View style={styles.macroBarBg}>
                <View
                  style={[
                    styles.macroBarFill,
                    { backgroundColor: '#60A5FA', width: `${Math.min((totalProtein / PROTEIN_GOAL) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroGram}>{totalCarbs.toFixed(0)}g</Text>
                <Text style={styles.macroLabel}>Carbos</Text>
              </View>
              <View style={styles.macroBarBg}>
                <View
                  style={[
                    styles.macroBarFill,
                    { backgroundColor: '#A3E635', width: `${Math.min((totalCarbs / CARBS_GOAL) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>
            <View style={styles.macroCol}>
              <View style={styles.macroInfo}>
                <Text style={styles.macroGram}>{totalFat.toFixed(0)}g</Text>
                <Text style={styles.macroLabel}>Gordura</Text>
              </View>
              <View style={styles.macroBarBg}>
                <View
                  style={[
                    styles.macroBarFill,
                    { backgroundColor: '#F472B6', width: `${Math.min((totalFat / FAT_GOAL) * 100, 100)}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* --- CONTADOR DE ÁGUA --- */}
        {dailyWater && (
          <View style={styles.waterCard}>
            <View style={styles.waterHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Droplets size={20} color="#06b6d4" style={{ marginRight: 6 }} />
                <Text style={styles.waterTitle}>Hidratação</Text>
              </View>
              <View style={styles.waterGoalRow}>
                <Text style={styles.waterGoalLabel}>Meta:</Text>
                <TextInput 
                  style={styles.waterGoalInput}
                  keyboardType="numeric"
                  value={dailyWater.goal_ml.toString()}
                  onChangeText={handleUpdateWaterGoal}
                />
                <Text style={styles.waterGoalLabel}>ml</Text>
              </View>
            </View>

            <View style={styles.waterBody}>
              <Text style={styles.waterAmount}>{dailyWater.amount_ml} ml</Text>
              <Text style={styles.waterSubtitle}>{(dailyWater.amount_ml / dailyWater.goal_ml * 100).toFixed(0)}% da meta alcançada</Text>
              
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { backgroundColor: '#3B82F6', width: `${Math.min((dailyWater.amount_ml / dailyWater.goal_ml) * 100, 100)}%` }
                  ]}
                />
              </View>
              
              <View style={styles.waterActions}>
                <Pressable style={styles.waterBtnRed} onPress={() => handleAddWater(-250)}>
                  <Text style={styles.waterBtnTextRed}>- 250ml</Text>
                </Pressable>
                <Pressable style={styles.waterBtn} onPress={() => handleAddWater(250)}>
                  <Text style={styles.waterBtnText}>+ 250ml</Text>
                </Pressable>
                <Pressable style={styles.waterBtn} onPress={() => handleAddWater(500)}>
                  <Text style={styles.waterBtnText}>+ 500ml</Text>
                </Pressable>
              </View>
              
              <View style={styles.customWaterRow}>
                <TextInput 
                  style={styles.customWaterInput}
                  placeholder="Outra quantia (ml)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={customWaterAdd}
                  onChangeText={setCustomWaterAdd}
                />
                <Pressable 
                  style={styles.waterBtn} 
                  onPress={() => {
                    const ml = parseInt(customWaterAdd);
                    if (ml) handleAddWater(ml);
                    setCustomWaterAdd('');
                  }}
                >
                  <Text style={styles.waterBtnText}>Adicionar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Refeições do Dia</Text>
          <Pressable style={styles.addMealBtn} onPress={() => setShowAddMealModal(true)}>
            <Text style={styles.addMealBtnText}>+ Refeição</Text>
          </Pressable>
        </View>

        {/* --- LISTAGEM DE REFEIÇÕES --- */}
        {mealsList.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>Nenhuma refeição cadastrada hoje.</Text>
          </View>
        ) : (
          mealsList.map((meal) => {
            const mealCalories = meal.meal_items?.reduce((sum, item) => sum + item.calories, 0) || 0;
            const mealProtein = meal.meal_items?.reduce((sum, item) => sum + Number(item.protein), 0) || 0;

            return (
              <View key={meal.id} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View>
                    <Text style={styles.mealTitle}>
                      {meal.time ? `${meal.time} - ` : ''}{meal.name}
                    </Text>
                    <Text style={styles.mealSubtitle}>{mealProtein.toFixed(0)}g prot • {mealCalories} kcal</Text>
                  </View>
                  <View style={{flexDirection: 'row', gap: Spacing.sm}}>
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
                      <Text style={styles.addFoodBtnText}>+ Adicionar</Text>
                    </Pressable>
                    <Pressable style={styles.deleteMealBtn} onPress={() => handleDeleteMeal(meal.id)}>
                      <X size={16} color={Colors.textSecondary} />
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
                            Qtd: {item.amount}g • P: {Number(item.protein).toFixed(0)}g • C: {Number(item.carbs).toFixed(0)}g
                          </Text>
                        </View>
                        <View style={styles.foodRowRight}>
                          <Text style={styles.foodKcal}>{item.calories} kcal</Text>
                          <Pressable onPress={() => handleDeleteFood(meal.id, item.id)}>
                            <Trash2 size={16} color={Colors.danger} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- MODAL: CRIAR REFEIÇÃO --- */}
      <Modal
        visible={showAddMealModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddMealModal(false)}
      >
        <View style={styles.modalOverlayCenter}>
          <View style={[styles.modalContainer, { width: '90%', maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova Refeição</Text>
              <Pressable onPress={() => setShowAddMealModal(false)} style={styles.closeModalBtn}>
                <X size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Nome (ex: Café da Manhã):</Text>
              <TextInput 
                style={styles.formInput} 
                value={newMealName} 
                onChangeText={setNewMealName} 
                autoFocus
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Horário (ex: 08:00):</Text>
              <TextInput 
                style={styles.formInput} 
                value={newMealTime} 
                onChangeText={setNewMealTime} 
                placeholder="Opcional"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <Pressable style={styles.submitBtn} onPress={handleAddMeal}>
              <Text style={styles.submitBtnText}>Salvar Refeição</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* --- MODAL: REGISTRAR ALIMENTO --- */}
      <Modal
        visible={showAddFoodModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar ao {activeMealName}</Text>
              <Pressable onPress={() => setShowAddFoodModal(false)} style={styles.closeModalBtn}>
                <X size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.modalTabs}>
              <Pressable
                style={[styles.modalTab, modalTab === 'library' && styles.modalTabActive]}
                onPress={() => setModalTab('library')}
              >
                <Text style={[styles.modalTabText, modalTab === 'library' && styles.modalTabActiveText]}>
                  Biblioteca
                </Text>
              </Pressable>
              <Pressable
                style={[styles.modalTab, modalTab === 'custom' && styles.modalTabActive]}
                onPress={() => setModalTab('custom')}
              >
                <Text style={[styles.modalTabText, modalTab === 'custom' && styles.modalTabActiveText]}>
                  Criar Personalizado
                </Text>
              </Pressable>
            </View>

            {modalTab === 'library' && (
              <View style={styles.modalForm}>
                {!selectedLibraryFood ? (
                  <ScrollView style={{ maxHeight: 300 }}>
                    {foodLibrary.map(item => (
                      <Pressable 
                        key={item.id} 
                        style={styles.libraryItem}
                        onPress={() => setSelectedLibraryFood(item)}
                      >
                        <Text style={styles.libraryItemText}>{item.name}</Text>
                        <Text style={styles.libraryItemSub}>
                          {item.calories} kcal • {item.protein}g P • {item.carbs}g C • {item.fat}g G (em {item.serving_size}g)
                        </Text>
                      </Pressable>
                    ))}
                    {foodLibrary.length === 0 && (
                      <Text style={styles.textMuted}>Nenhum alimento cadastrado na biblioteca.</Text>
                    )}
                  </ScrollView>
                ) : (
                  <View style={{ gap: Spacing.md }}>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Alimento Selecionado:</Text>
                      <Text style={styles.formValue}>{selectedLibraryFood.name}</Text>
                    </View>
                    <View style={styles.formRow}>
                      <Text style={styles.formLabel}>Quantidade de Consumo:</Text>
                      <View style={styles.amountInputRow}>
                        <TextInput
                          style={styles.amountInput}
                          keyboardType="numeric"
                          value={amount}
                          onChangeText={setAmount}
                          autoFocus
                        />
                        <Text style={styles.amountUnit}>g</Text>
                      </View>
                    </View>
                    
                    <View style={{flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md}}>
                      <Pressable style={[styles.submitBtn, {flex:1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border}]} onPress={() => setSelectedLibraryFood(null)}>
                        <Text style={[styles.submitBtnText, {color: Colors.text}]}>Voltar</Text>
                      </Pressable>
                      <Pressable style={[styles.submitBtn, {flex: 2}]} onPress={handleAddLibraryFood}>
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
                  <Text style={styles.formLabel}>Quantidade (g/ml):</Text>
                  <View style={styles.amountInputRow}>
                    <TextInput
                      style={styles.amountInput}
                      keyboardType="numeric"
                      value={amount}
                      onChangeText={setAmount}
                    />
                    <Text style={styles.amountUnit}>g</Text>
                  </View>
                </View>

                <View style={styles.formField}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Nome do Alimento (ex: Omelete de 3 ovos)"
                    placeholderTextColor={Colors.textMuted}
                    value={foodName}
                    onChangeText={setFoodName}
                  />
                </View>

                <View style={styles.formGrid}>
                  <View style={styles.gridField}>
                    <Text style={styles.gridLabel}>Kcal:</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={calories}
                      onChangeText={setCalories}
                    />
                  </View>
                  <View style={styles.gridField}>
                    <Text style={styles.gridLabel}>Proteína (g):</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={protein}
                      onChangeText={setProtein}
                    />
                  </View>
                  <View style={styles.gridField}>
                    <Text style={styles.gridLabel}>Carbo (g):</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={carbs}
                      onChangeText={setCarbs}
                    />
                  </View>
                  <View style={styles.gridField}>
                    <Text style={styles.gridLabel}>Gordura (g):</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={fat}
                      onChangeText={setFat}
                    />
                  </View>
                </View>

                <Pressable style={styles.submitBtn} onPress={handleAddCustomFood}>
                  <Text style={styles.submitBtnText}>Salvar na Biblioteca e Adicionar</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, maxWidth: 600, width: '100%', alignSelf: 'center', gap: Spacing.md },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.danger, textAlign: 'center', marginBottom: Spacing.md, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: Spacing.sm, borderRadius: BorderRadius.md, fontFamily: 'Poppins_500Medium' },
  
  summaryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 },
  calorieRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  calorieTitle: { fontSize: FontSize.xxl, fontFamily: 'Poppins_900Black', color: Colors.text },
  calorieSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -4, fontFamily: 'Poppins_500Medium' },
  progressBarBg: { height: 16, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.full, overflow: 'hidden', marginVertical: Spacing.xs },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary },
  macrosRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  macroCol: { flex: 1, gap: Spacing.xs },
  macroInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  macroGram: { fontSize: FontSize.md, fontFamily: 'Poppins_700Bold', color: Colors.text },
  macroLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'Poppins_600SemiBold', textTransform: 'uppercase' },
  macroBarBg: { height: 8, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.full, overflow: 'hidden' },
  macroBarFill: { height: '100%' },
  
  // Water
  waterCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: '#06b6d4', gap: Spacing.md, shadowColor: '#06b6d4', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  waterTitle: { fontSize: FontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text },
  waterGoalRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  waterGoalLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: 'Poppins_500Medium' },
  waterGoalInput: { backgroundColor: Colors.background, color: Colors.text, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.sm, paddingVertical: 2, minWidth: 50, textAlign: 'center', fontSize: FontSize.sm, fontFamily: 'Poppins_600SemiBold' },
  waterBody: { gap: Spacing.sm },
  waterAmount: { fontSize: 32, fontFamily: 'Poppins_900Black', color: '#06b6d4', textAlign: 'center' },
  waterSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', fontFamily: 'Poppins_500Medium', marginTop: -4 },
  waterActions: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.sm },
  waterBtn: { backgroundColor: 'rgba(6, 182, 212, 0.1)', borderWidth: 1, borderColor: '#06b6d4', borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  waterBtnText: { color: '#06b6d4', fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
  waterBtnRed: { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: Colors.danger, borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg },
  waterBtnTextRed: { color: Colors.danger, fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.sm },
  customWaterRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  customWaterInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, height: 40, width: 140, color: Colors.text, textAlign: 'center', fontSize: FontSize.sm, fontFamily: 'Poppins_500Medium' },
 
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text },
  addMealBtn: { backgroundColor: 'rgba(210, 255, 58, 0.1)', paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.primary },
  addMealBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  emptyHistory: { padding: Spacing.xl, alignItems: 'center' },
  emptyHistoryText: { color: Colors.textMuted, fontSize: FontSize.sm, fontFamily: 'Poppins_500Medium' },
 
  mealCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xs },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  mealTitle: { fontSize: FontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.text },
  mealSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: 'Poppins_500Medium' },
  addFoodBtn: { backgroundColor: Colors.surfaceLight, borderColor: Colors.border, borderWidth: 1, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  addFoodBtnText: { fontSize: FontSize.sm, color: Colors.text, fontFamily: 'Poppins_600SemiBold' },
  deleteMealBtn: { justifyContent: 'center', alignItems: 'center', padding: Spacing.xs, opacity: 0.6 },
  foodList: { borderTopWidth: 1, borderTopColor: Colors.surfaceLight, paddingTop: Spacing.md, marginTop: Spacing.xs, gap: Spacing.sm },
  foodRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  foodName: { fontSize: FontSize.md, color: Colors.text, fontFamily: 'Poppins_600SemiBold' },
  foodMacros: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, fontFamily: 'Poppins_500Medium' },
  foodRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  foodKcal: { fontSize: FontSize.md, color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  deleteFoodIcon: { fontSize: 18, color: Colors.danger },
  
  // MODAL STYLING
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: Colors.background, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, borderWidth: 1, borderColor: Colors.border, maxHeight: '90%', padding: Spacing.lg, paddingBottom: Spacing.xxl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: FontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text },
  closeModalBtn: { padding: Spacing.xs },
  closeModalBtnText: { fontSize: FontSize.xl, color: Colors.textSecondary, fontFamily: 'Poppins_400Regular' },
  modalTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, marginBottom: Spacing.lg },
  modalTab: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center' },
  modalTabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  modalTabText: { fontSize: FontSize.md, color: Colors.textMuted, fontFamily: 'Poppins_600SemiBold' },
  modalTabActiveText: { color: Colors.text, fontFamily: 'Poppins_700Bold' },
  modalForm: { flex: 1, minHeight: 200 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' },
  formValue: { fontSize: FontSize.md, color: Colors.text, fontFamily: 'Poppins_700Bold' },
  amountInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  amountInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, width: 80, height: 44, color: Colors.text, textAlign: 'center', fontFamily: 'Poppins_600SemiBold', fontSize: FontSize.md },
  amountUnit: { color: Colors.textSecondary, fontSize: FontSize.sm, fontFamily: 'Poppins_500Medium' },
  formField: { marginBottom: Spacing.md },
  formInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, padding: Spacing.md, paddingHorizontal: Spacing.lg, color: Colors.text, fontSize: FontSize.md, fontFamily: 'Poppins_500Medium' },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridField: { width: '47%', gap: Spacing.xs },
  gridLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: 'Poppins_500Medium' },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg, marginBottom: Spacing.sm, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  submitBtnText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
 
  libraryItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceLight, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, marginBottom: Spacing.sm },
  libraryItemText: { color: Colors.text, fontSize: FontSize.md, fontFamily: 'Poppins_600SemiBold' },
  libraryItemSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4, fontFamily: 'Poppins_400Regular' },
});
