import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { workouts as workoutsApi } from '@/services/api';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import type { Workout, Exercise, ExerciseSet, ExerciseLibraryItem } from '@/types';
import { Save, X, Pen, Trash2, Check, Plus, Dumbbell } from 'lucide-react-native';

function NumberInput({ value, onChangeText, style, placeholder, placeholderTextColor }: any) {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());

  useEffect(() => {
    if (value === 0 && localValue === '') return;
    const parsed = parseFloat(localValue.replace(',', '.')) || 0;
    if (parsed !== value && !localValue.endsWith(',') && !localValue.endsWith('.')) {
      setLocalValue(value === 0 ? '' : value.toString());
    }
  }, [value]);

  return (
    <TextInput
      style={style}
      keyboardType="numeric"
      value={localValue}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      onChangeText={(val) => {
        setLocalValue(val);
        const parsed = parseFloat(val.replace(',', '.')) || 0;
        onChangeText(parsed);
      }}
      onBlur={() => {
        const parsed = parseFloat(localValue.replace(',', '.')) || 0;
        setLocalValue(parsed === 0 ? '' : parsed.toString());
      }}
    />
  );
}

export default function WorkoutsScreen() {
  const [workoutsList, setWorkoutsList] = useState<Workout[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modals / Inputs
  const [showNewWorkoutInput, setShowNewWorkoutInput] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  
  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [editingWorkoutName, setEditingWorkoutName] = useState('');

  const [addingExerciseToId, setAddingExerciseToId] = useState<string | null>(null);
  const [isCreatingNewLibraryExercise, setIsCreatingNewLibraryExercise] = useState(false);
  const [newLibraryExerciseName, setNewLibraryExerciseName] = useState('');

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState('');

  async function handleUpdateExerciseName(workoutId: string, exerciseId: string) {
    if (!editingExerciseName.trim()) return;
    try {
      await workoutsApi.updateExercise(workoutId, exerciseId, { name: editingExerciseName.trim() });
      setEditingExerciseId(null);
      await fetchData();
    } catch (err) {
      Alert.alert('Erro', 'Falha ao atualizar nome do exercício');
    }
  }

  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [data, libraryData] = await Promise.all([
        workoutsApi.list(),
        workoutsApi.getLibraryExercises()
      ]);
      setWorkoutsList(data);
      setExerciseLibrary(libraryData);
      
      const active = data.find(w => !w.completed);
      setActiveWorkout(active || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Iniciar treino
  async function handleStartWorkout() {
    if (!newWorkoutName.trim()) return;
    try {
      setLoading(true);
      await workoutsApi.create({
        name: newWorkoutName.trim(),
        completed: false,
      });
      setNewWorkoutName('');
      setShowNewWorkoutInput(false);
      await fetchData();
    } catch (err) {
      setError('Erro ao iniciar treino');
      setLoading(false);
    }
  }

  // Editar Nome do Treino
  async function handleUpdateWorkoutName() {
    if (!activeWorkout || !editingWorkoutName.trim()) return;
    try {
      setLoading(true);
      await workoutsApi.update(activeWorkout.id, { name: editingWorkoutName.trim() });
      setIsEditingWorkout(false);
      await fetchData();
    } catch (err) {
      setError('Erro ao editar treino');
      setLoading(false);
    }
  }

  // Cancelar treino em andamento
  async function handleCancelWorkout(workoutId: string) {
    try {
      setLoading(true);
      await workoutsApi.delete(workoutId);
      await fetchData();
    } catch (err) {
      setError('Erro ao excluir treino');
      setLoading(false);
    }
  }

  // Finalizar treino
  async function handleFinishWorkout(workoutId: string) {
    try {
      setLoading(true);
      await workoutsApi.update(workoutId, { completed: true });
      await fetchData();
    } catch (err) {
      setError('Erro ao finalizar treino');
      setLoading(false);
    }
  }

  // Reabrir treino
  async function handleReopenWorkout(workoutId: string) {
    if (activeWorkout) {
      Alert.alert(
        'Treino em andamento',
        'Você já possui um treino em andamento. Conclua-o ou exclua-o antes de editar outro treino.'
      );
      return;
    }
    try {
      setLoading(true);
      await workoutsApi.update(workoutId, { completed: false });
      await fetchData();
    } catch (err) {
      setError('Erro ao reabrir treino');
      setLoading(false);
    }
  }

  // Adicionar Exercício ao Treino (da biblioteca)
  async function handleAddExercise(name: string) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.addExercise(activeWorkout.id, { name });
      setAddingExerciseToId(null);
      setIsCreatingNewLibraryExercise(false);
      setNewLibraryExerciseName('');
      await fetchData();
    } catch (err) {
      setError('Erro ao adicionar exercício');
    }
  }

  // Criar na biblioteca e adicionar
  async function handleCreateAndAddExercise() {
    if (!newLibraryExerciseName.trim()) return;
    try {
      setLoading(true);
      // Cria na biblioteca
      await workoutsApi.addLibraryExercise({ name: newLibraryExerciseName.trim() });
      // Adiciona ao treino
      await handleAddExercise(newLibraryExerciseName.trim());
    } catch (err) {
      setError('Erro ao criar exercício na biblioteca');
      setLoading(false);
    }
  }

  // Excluir Exercício do treino
  async function handleDeleteExercise(exerciseId: string) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.deleteExercise(activeWorkout.id, exerciseId);
      await fetchData();
    } catch (err) {
      setError('Erro ao deletar exercício');
    }
  }

  // Adicionar Série
  async function handleAddSet(exerciseId: string, currentSets: ExerciseSet[]) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.addSet(activeWorkout.id, exerciseId, {
        weight: 0,
        reps: 0,
        completed: false,
        order_index: currentSets.length + 1,
      });
      await fetchData();
    } catch (err) {
      setError('Erro ao adicionar série');
    }
  }

  // Atualizar Série
  async function handleUpdateSet(exerciseId: string, setId: string, fields: Partial<ExerciseSet>) {
    if (!activeWorkout) return;
    try {
      setActiveWorkout(prev => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              exercise_sets: ex.exercise_sets.map(s => {
                if (s.id !== setId) return s;
                return { ...s, ...fields };
              }),
            };
          }),
        };
      });
      await workoutsApi.updateSet(activeWorkout.id, exerciseId, setId, fields);
    } catch (err) {
      await fetchData();
    }
  }

  // Excluir Série
  async function handleDeleteSet(exerciseId: string, setId: string) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.deleteSet(activeWorkout.id, exerciseId, setId);
      await fetchData();
    } catch (err) {
      setError('Erro ao deletar série');
    }
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {activeWorkout ? (
        // --- MODO: TREINO EM ANDAMENTO ---
        <View style={styles.activeContainer}>
          <View style={styles.activeHeader}>
            {isEditingWorkout ? (
              <View style={styles.editWorkoutContainer}>
                <TextInput
                  style={styles.editWorkoutInput}
                  value={editingWorkoutName}
                  onChangeText={setEditingWorkoutName}
                  autoFocus
                />
                <Pressable style={styles.actionIcon} onPress={handleUpdateWorkoutName}>
                  <Save size={20} color={Colors.text} />
                </Pressable>
                <Pressable style={styles.actionIcon} onPress={() => setIsEditingWorkout(false)}>
                  <X size={20} color={Colors.text} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.activeHeaderTitleRow}>
                <View>
                  <Text style={styles.activeTag}>Treino em Andamento</Text>
                  <Text style={styles.activeTitle}>{activeWorkout.name}</Text>
                </View>
                <Pressable 
                  style={styles.editIconBtn} 
                  onPress={() => {
                    setEditingWorkoutName(activeWorkout.name);
                    setIsEditingWorkout(true);
                  }}>
                  <Pen size={16} color={Colors.text} />
                </Pressable>
              </View>
            )}
            
            {!isEditingWorkout && (
              <View style={styles.headerActions}>
                <Pressable
                  style={[styles.actionIcon, styles.dangerAction]}
                  onPress={() => handleCancelWorkout(activeWorkout.id)}
                >
                  <Trash2 size={20} color={Colors.danger} />
                </Pressable>
                <Pressable
                  style={[styles.actionIcon, styles.successAction]}
                  onPress={() => handleFinishWorkout(activeWorkout.id)}
                >
                  <Check size={20} color={Colors.textInverted || '#000'} />
                </Pressable>
              </View>
            )}
          </View>

          {/* Lista de Exercícios */}
          {activeWorkout.exercises?.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                {editingExerciseId === exercise.id ? (
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                    <TextInput
                      style={[styles.inlineInput, { flex: 1, paddingVertical: 4, height: 40 }]}
                      value={editingExerciseName}
                      onChangeText={setEditingExerciseName}
                      autoFocus
                    />
                    <Pressable style={styles.actionIcon} onPress={() => handleUpdateExerciseName(activeWorkout.id, exercise.id)}>
                      <Save size={20} color={Colors.text} />
                    </Pressable>
                    <Pressable style={styles.actionIcon} onPress={() => setEditingExerciseId(null)}>
                      <X size={20} color={Colors.text} />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <View>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.notes ? (
                          <Text style={styles.exerciseMax}>Obs: {exercise.notes}</Text>
                        ) : null}
                      </View>
                      <Pressable onPress={() => { setEditingExerciseId(exercise.id); setEditingExerciseName(exercise.name); }}>
                        <Pen size={16} color={Colors.textMuted} />
                      </Pressable>
                    </View>
                    <Pressable onPress={() => handleDeleteExercise(exercise.id)}>
                      <X size={20} color={Colors.textMuted} />
                    </Pressable>
                  </>
                )}
              </View>

              {/* Tabela de Séries */}
              <View style={styles.setsTableHeader}>
                <Text style={[styles.columnHeader, { width: '15%' }]}>SÉRIE</Text>
                <Text style={[styles.columnHeader, { width: '35%', textAlign: 'center' }]}>PESO (KG)</Text>
                <Text style={[styles.columnHeader, { width: '35%', textAlign: 'center' }]}>REPS</Text>
                <Text style={[styles.columnHeader, { width: '15%', textAlign: 'right' }]}></Text>
              </View>

              {exercise.exercise_sets?.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setText, { width: '15%', fontWeight: '600' }]}>{index + 1}</Text>
                  <View style={{ width: '35%', alignItems: 'center' }}>
                    <NumberInput
                      style={styles.setInput}
                      value={set.weight || 0}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      onChangeText={(num: number) => {
                        handleUpdateSet(exercise.id, set.id, { weight: num });
                      }}
                    />
                  </View>
                  <View style={{ width: '35%', alignItems: 'center' }}>
                    <NumberInput
                      style={styles.setInput}
                      value={set.reps || 0}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      onChangeText={(num: number) => {
                        handleUpdateSet(exercise.id, set.id, { reps: num });
                      }}
                    />
                  </View>
                  <View style={styles.setActions}>
                    <Pressable
                      style={[
                        styles.checkButton,
                        set.completed && styles.checkButtonActive
                      ]}
                      onPress={() => handleUpdateSet(exercise.id, set.id, { completed: !set.completed })}
                    >
                      {set.completed ? <Check size={16} color={Colors.textInverted || '#000'} /> : null}
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSet(exercise.id, set.id)} style={styles.deleteSetBtn}>
                      <Trash2 size={16} color={Colors.textMuted} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <Pressable
                style={styles.addSetButton}
                onPress={() => handleAddSet(exercise.id, exercise.exercise_sets || [])}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Plus size={16} color={Colors.text} style={{ marginRight: 4 }} />
                  <Text style={styles.addSetText}>Adicionar Série</Text>
                </View>
              </Pressable>
            </View>
          ))}

          {/* Seção Adicionar Exercício */}
          {addingExerciseToId === activeWorkout.id ? (
            <View style={styles.libraryCard}>
              <Text style={styles.cardSectionTitle}>Selecione um exercício</Text>
              
              {!isCreatingNewLibraryExercise ? (
                <>
                  <ScrollView style={styles.libraryList} nestedScrollEnabled>
                    {exerciseLibrary.map(item => (
                      <Pressable 
                        key={item.id} 
                        style={styles.libraryItem}
                        onPress={() => handleAddExercise(item.name)}
                      >
                        <Text style={styles.libraryItemText}>{item.name}</Text>
                        {item.muscle_group && (
                          <Text style={styles.libraryItemSub}>{item.muscle_group}</Text>
                        )}
                      </Pressable>
                    ))}
                    {exerciseLibrary.length === 0 && (
                      <Text style={styles.textMuted}>Nenhum exercício na biblioteca.</Text>
                    )}
                  </ScrollView>
                  <Pressable 
                    style={styles.createNewBtn} 
                    onPress={() => setIsCreatingNewLibraryExercise(true)}
                  >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Plus size={16} color={Colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.createNewBtnText}>Criar Novo Exercício</Text>
                  </View>
                  </Pressable>
                </>
              ) : (
                <View style={styles.inlineInputCard}>
                  <TextInput
                    style={styles.inlineInput}
                    placeholder="Nome (ex: Supino Inclinado)"
                    placeholderTextColor={Colors.textMuted}
                    value={newLibraryExerciseName}
                    onChangeText={setNewLibraryExerciseName}
                    autoFocus
                  />
                  <View style={styles.inlineInputActions}>
                    <Pressable style={styles.inlineBtnCancel} onPress={() => setIsCreatingNewLibraryExercise(false)}>
                      <Text style={styles.inlineBtnCancelText}>Voltar</Text>
                    </Pressable>
                    <Pressable style={styles.inlineBtnSave} onPress={handleCreateAndAddExercise}>
                      <Text style={styles.inlineBtnSaveText}>Salvar e Adicionar</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {!isCreatingNewLibraryExercise && (
                <Pressable style={styles.closeLibraryBtn} onPress={() => setAddingExerciseToId(null)}>
                  <Text style={styles.closeLibraryBtnText}>Cancelar</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <Pressable
              style={styles.addExerciseButton}
              onPress={() => setAddingExerciseToId(activeWorkout.id)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Plus size={16} color={Colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.addExerciseText}>Adicionar Exercício</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.finishWorkoutButton, pressed && styles.finishWorkoutButtonPressed]}
            onPress={() => handleFinishWorkout(activeWorkout.id)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Check size={20} color={Colors.textInverted || '#000'} style={{ marginRight: 8 }} />
              <Text style={styles.finishWorkoutText}>Finalizar Treino</Text>
            </View>
          </Pressable>
        </View>
      ) : (
        // --- MODO: TELA INICIAL (LISTA DE TREINOS) ---
        <View style={styles.startContainer}>
          <Text style={styles.headerTitle}>Registro de Treino</Text>

          {showNewWorkoutInput ? (
            <View style={styles.newWorkoutCard}>
              <Text style={styles.cardSectionTitle}>Iniciar Novo Treino</Text>
              <TextInput
                style={styles.newWorkoutInput}
                placeholder="Nome do Treino (ex: Treino A - Peito)"
                placeholderTextColor={Colors.textMuted}
                value={newWorkoutName}
                onChangeText={setNewWorkoutName}
                autoFocus
              />
              <View style={styles.inlineInputActions}>
                <Pressable style={styles.inlineBtnCancel} onPress={() => setShowNewWorkoutInput(false)}>
                  <Text style={styles.inlineBtnCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.inlineBtnSave} onPress={handleStartWorkout}>
                  <Text style={styles.inlineBtnSaveText}>Começar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.startWorkoutCard} onPress={() => setShowNewWorkoutInput(true)}>
              <Dumbbell size={32} color={Colors.textInverted || '#000'} style={{ marginBottom: 4 }} />
              <Text style={styles.startWorkoutTextTitle}>Iniciar novo treino</Text>
              <Text style={styles.startWorkoutTextSubtitle}>Comece a registrar seus exercícios em tempo real</Text>
            </Pressable>
          )}

          <Text style={styles.sectionTitle}>Histórico de Treinos</Text>
          
          {workoutsList.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>Nenhum treino realizado ainda.</Text>
            </View>
          ) : (
            workoutsList
              .filter(w => w.completed)
              .map((workout) => (
                <View key={workout.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyTitle}>{workout.name}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(workout.date).toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.reopenBtn}
                      onPress={() => handleReopenWorkout(workout.id)}
                    >
                      <Text style={styles.reopenBtnText}>Editar</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.historySub}>
                    {workout.exercises?.length || 0} exercícios realizados
                  </Text>
                  {workout.exercises?.length > 0 ? (
                    <View style={styles.historyExercises}>
                      {workout.exercises.map(ex => (
                        <Text key={ex.id} style={styles.historyExerciseItem}>
                          • {ex.name} ({ex.exercise_sets?.length || 0} séries)
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, maxWidth: 600, width: '100%', alignSelf: 'center' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { color: Colors.danger, textAlign: 'center', marginBottom: Spacing.md, backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: Spacing.sm, borderRadius: BorderRadius.md, fontFamily: 'Poppins_500Medium' },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: 'Poppins_700Bold', color: Colors.text, marginBottom: Spacing.lg },
  
  activeContainer: { gap: Spacing.md },
  activeHeader: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 15, elevation: 5 },
  activeHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  activeTag: { fontSize: FontSize.xs, color: Colors.primary, textTransform: 'uppercase', fontFamily: 'Poppins_700Bold', marginBottom: 2, letterSpacing: 1 },
  activeTitle: { fontSize: FontSize.xl, fontFamily: 'Poppins_700Bold', color: Colors.text },
  editIconBtn: { padding: Spacing.xs, opacity: 0.7 },
  editWorkoutContainer: { flexDirection: 'row', flex: 1, alignItems: 'center', gap: Spacing.sm },
  editWorkoutInput: { flex: 1, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.sm, paddingHorizontal: Spacing.lg, color: Colors.text, fontSize: FontSize.md, fontFamily: 'Poppins_500Medium' },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  actionIcon: { width: 44, height: 44, borderRadius: BorderRadius.full, justifyContent: 'center', alignItems: 'center' },
  dangerAction: { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
  successAction: { backgroundColor: Colors.primary },
  actionIconText: { color: Colors.text, fontSize: 18 },
  
  exerciseCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm, shadowColor: '#000', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xs },
  exerciseName: { fontSize: FontSize.lg, fontFamily: 'Poppins_600SemiBold', color: Colors.text },
  exerciseMax: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  deleteText: { fontSize: 20, color: Colors.textMuted, padding: Spacing.xs },
  
  setsTableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.surfaceLight },
  columnHeader: { fontSize: 10, fontFamily: 'Poppins_700Bold', color: Colors.textSecondary, letterSpacing: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  setText: { fontSize: FontSize.md, color: Colors.text, fontFamily: 'Poppins_600SemiBold' },
  setInput: { backgroundColor: Colors.background, borderColor: Colors.border, borderWidth: 1, borderRadius: BorderRadius.md, color: Colors.text, textAlign: 'center', width: 64, height: 36, fontSize: FontSize.md, fontFamily: 'Poppins_500Medium' },
  setActions: { width: '15%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.xs },
  
  checkButton: { width: 28, height: 28, borderRadius: BorderRadius.sm, borderWidth: 2, borderColor: Colors.textMuted, justifyContent: 'center', alignItems: 'center' },
  checkButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkText: { color: Colors.textInverted, fontSize: 14, fontFamily: 'Poppins_900Black' },
  deleteSetBtn: { opacity: 0.7, padding: 4 },
  
  addSetButton: { alignItems: 'center', paddingVertical: Spacing.sm, backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  addSetText: { fontSize: FontSize.sm, color: Colors.text, fontFamily: 'Poppins_600SemiBold' },
  addExerciseButton: { alignItems: 'center', paddingVertical: Spacing.md, borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primary, borderRadius: BorderRadius.xl, backgroundColor: 'rgba(210, 255, 58, 0.05)', marginVertical: Spacing.sm },
  addExerciseText: { fontSize: FontSize.sm, color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  
  finishWorkoutButton: { backgroundColor: Colors.primary, borderRadius: BorderRadius.full, padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  finishWorkoutButtonPressed: { opacity: 0.8 },
  finishWorkoutText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase', letterSpacing: 1 },
  
  // MODO LISTA DE TREINOS
  startContainer: { gap: Spacing.md },
  startWorkoutCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', gap: Spacing.xs, shadowColor: Colors.primary, shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  startWorkoutTextTitle: { fontSize: FontSize.lg, fontFamily: 'Poppins_700Bold', color: Colors.textInverted, textTransform: 'uppercase', letterSpacing: 1 },
  startWorkoutTextSubtitle: { fontSize: FontSize.sm, color: Colors.textInverted, textAlign: 'center', fontFamily: 'Poppins_500Medium', opacity: 0.8 },
  
  newWorkoutCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.primary, gap: Spacing.md },
  cardSectionTitle: { fontSize: FontSize.md, fontFamily: 'Poppins_600SemiBold', color: Colors.text, marginBottom: Spacing.sm },
  newWorkoutInput: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, padding: Spacing.md, paddingHorizontal: Spacing.lg, color: Colors.text, fontSize: FontSize.md, fontFamily: 'Poppins_500Medium' },
  
  inlineInputCard: { backgroundColor: Colors.background, borderRadius: BorderRadius.xl, padding: Spacing.md, gap: Spacing.md, marginTop: Spacing.sm },
  inlineInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, padding: Spacing.md, paddingHorizontal: Spacing.lg, color: Colors.text, fontSize: FontSize.md, fontFamily: 'Poppins_500Medium' },
  inlineInputActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  inlineBtnCancel: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
  inlineBtnCancelText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontFamily: 'Poppins_600SemiBold' },
  inlineBtnSave: { backgroundColor: Colors.primary, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full },
  inlineBtnSaveText: { color: Colors.textInverted, fontSize: FontSize.sm, fontFamily: 'Poppins_700Bold' },
  
  sectionTitle: { fontSize: FontSize.lg, fontFamily: 'Poppins_600SemiBold', color: Colors.text, marginTop: Spacing.lg },
  emptyHistory: { padding: Spacing.xl, alignItems: 'center' },
  emptyHistoryText: { color: Colors.textMuted, fontSize: FontSize.sm, fontFamily: 'Poppins_400Regular' },
  
  historyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  historyTitle: { fontSize: FontSize.lg, fontFamily: 'Poppins_600SemiBold', color: Colors.text },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: 'Poppins_500Medium' },
  reopenBtn: { backgroundColor: 'rgba(210, 255, 58, 0.1)', borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  reopenBtnText: { color: Colors.primary, fontSize: FontSize.xs, fontFamily: 'Poppins_700Bold', textTransform: 'uppercase' },
  historySub: { fontSize: FontSize.sm, color: Colors.primary, marginBottom: Spacing.sm, fontFamily: 'Poppins_600SemiBold' },
  historyExercises: { borderTopWidth: 1, borderTopColor: Colors.surfaceLight, paddingTop: Spacing.sm, gap: 4 },
  historyExerciseItem: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: 'Poppins_400Regular' },
  
  // LIBRARY
  libraryCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginVertical: Spacing.sm },
  libraryList: { maxHeight: 300, marginVertical: Spacing.sm },
  libraryItem: { padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.surfaceLight, backgroundColor: Colors.background, borderRadius: BorderRadius.lg, marginBottom: 8 },
  libraryItemText: { color: Colors.text, fontSize: FontSize.md, fontFamily: 'Poppins_600SemiBold' },
  libraryItemSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  textMuted: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginVertical: Spacing.md, fontFamily: 'Poppins_400Regular' },
  createNewBtn: { alignItems: 'center', padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.full, borderStyle: 'dashed', marginTop: Spacing.sm },
  createNewBtnText: { color: Colors.primary, fontFamily: 'Poppins_700Bold', fontSize: FontSize.sm },
  closeLibraryBtn: { alignItems: 'center', padding: Spacing.md, marginTop: Spacing.md },
  closeLibraryBtnText: { color: Colors.textSecondary, fontFamily: 'Poppins_600SemiBold' }
});
