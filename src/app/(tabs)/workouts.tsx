import { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { workouts as workoutsApi } from '@/services/api';
import { Colors, Spacing, FontSize, BorderRadius, Font, Icon, Elevation } from '@/constants/theme';
import type { Workout, ExerciseSet, ExerciseLibraryItem } from '@/types';
import { Loading, ErrorBanner, EmptyState } from '@/components/ui';
import { Save, X, Pen, Trash2, Check, Plus, Dumbbell, ListPlus } from 'lucide-react-native';

// Grupos musculares disponíveis para o "tipo" do treino. Um treino pode misturar
// vários (multi-seleção). A biblioteca de exercícios é filtrada por esses grupos.
const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Trapézio', 'Bíceps', 'Tríceps', 'Antebraço',
  'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Core', 'Adutores',
];

type TabView = 'treino' | 'exercicios';

function NumberInput({ value, onChangeText, style, placeholder, placeholderTextColor }: any) {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toString());
  const focused = useRef(false);

  // Sincroniza com o valor externo só quando o campo não está sendo editado,
  // evitando sobrescrever/reverter o que o usuário digita. Deps corretas ([value]).
  useEffect(() => {
    if (focused.current) return;
    setLocalValue(value === 0 ? '' : value.toString());
  }, [value]);

  // Persiste apenas ao sair do campo — evita um PUT por caractere digitado
  // e a corrida de várias gravações concorrentes.
  function commit() {
    focused.current = false;
    const parsed = parseFloat(localValue.replace(',', '.')) || 0;
    setLocalValue(parsed === 0 ? '' : parsed.toString());
    if (parsed !== value) onChangeText(parsed);
  }

  return (
    <TextInput
      style={style}
      keyboardType="numeric"
      value={localValue}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      onFocus={() => { focused.current = true; }}
      onChangeText={setLocalValue}
      onBlur={commit}
    />
  );
}

export default function WorkoutsScreen() {
  const [workoutsList, setWorkoutsList] = useState<Workout[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

  const [view, setView] = useState<TabView>('treino');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing] = useState(false);

  const [showNewWorkoutInput, setShowNewWorkoutInput] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [newWorkoutGroups, setNewWorkoutGroups] = useState<string[]>([]);

  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [editingWorkoutName, setEditingWorkoutName] = useState('');

  const [addingExerciseToId, setAddingExerciseToId] = useState<string | null>(null);

  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExerciseName, setEditingExerciseName] = useState('');

  // Cadastro de exercício na biblioteca (aba Exercícios).
  const [libName, setLibName] = useState('');
  const [libGroup, setLibGroup] = useState<string | null>(null);

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
        workoutsApi.getLibraryExercises(),
      ]);
      setWorkoutsList(data);
      setExerciseLibrary(libraryData);
      const active = data.find((w) => !w.completed);
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

  function toggleNewWorkoutGroup(group: string) {
    setNewWorkoutGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  }

  async function handleStartWorkout() {
    if (!newWorkoutName.trim()) return;
    if (newWorkoutGroups.length === 0) {
      Alert.alert('Selecione o tipo', 'Escolha ao menos um grupo muscular para o treino.');
      return;
    }
    try {
      setLoading(true);
      await workoutsApi.create({
        name: newWorkoutName.trim(),
        completed: false,
        muscle_groups: newWorkoutGroups,
      });
      setNewWorkoutName('');
      setNewWorkoutGroups([]);
      setShowNewWorkoutInput(false);
      await fetchData();
    } catch (err) {
      setError('Erro ao iniciar treino');
      setLoading(false);
    }
  }

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

  async function handleAddExercise(name: string) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.addExercise(activeWorkout.id, { name });
      setAddingExerciseToId(null);
      await fetchData();
    } catch (err) {
      setError('Erro ao adicionar exercício');
    }
  }

  async function handleDeleteExercise(exerciseId: string) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.deleteExercise(activeWorkout.id, exerciseId);
      await fetchData();
    } catch (err) {
      setError('Erro ao deletar exercício');
    }
  }

  // --- Biblioteca de exercícios (aba Exercícios) ---
  async function handleCreateLibraryExercise() {
    if (!libName.trim()) {
      Alert.alert('Nome obrigatório', 'Informe o nome do exercício.');
      return;
    }
    if (!libGroup) {
      Alert.alert('Grupo obrigatório', 'Selecione o grupo muscular do exercício.');
      return;
    }
    try {
      setLoading(true);
      await workoutsApi.addLibraryExercise({ name: libName.trim(), muscle_group: libGroup });
      setLibName('');
      setLibGroup(null);
      await fetchData();
    } catch (err) {
      setError('Erro ao cadastrar exercício');
      setLoading(false);
    }
  }

  function confirmDeleteLibraryExercise(item: ExerciseLibraryItem) {
    Alert.alert('Excluir exercício', `Remover "${item.name}" da biblioteca?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await workoutsApi.deleteLibraryExercise(item.id);
            await fetchData();
          } catch (err) {
            setError('Erro ao excluir exercício');
          }
        },
      },
    ]);
  }

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

  async function handleUpdateSet(exerciseId: string, setId: string, fields: Partial<ExerciseSet>) {
    if (!activeWorkout) return;
    const workoutId = activeWorkout.id;
    // Snapshot do set atual para reverter só ele em caso de erro, sem descartar
    // edições concorrentes de outros sets (evita "pular" valores em digitação rápida).
    const prevSet = activeWorkout.exercises
      ?.find((ex) => ex.id === exerciseId)
      ?.exercise_sets?.find((s) => s.id === setId);

    const applyToSet = (patch: Partial<ExerciseSet>) =>
      setActiveWorkout((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          exercises: prev.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              exercise_sets: ex.exercise_sets.map((s) => (s.id !== setId ? s : { ...s, ...patch })),
            };
          }),
        };
      });

    applyToSet(fields); // otimista
    try {
      await workoutsApi.updateSet(workoutId, exerciseId, setId, fields);
    } catch (err) {
      setError('Erro ao salvar série');
      // Reverte apenas os campos alterados deste set.
      if (prevSet) {
        const revert = Object.fromEntries(
          Object.keys(fields).map((k) => [k, (prevSet as any)[k]])
        ) as Partial<ExerciseSet>;
        applyToSet(revert);
      } else {
        await fetchData();
      }
    }
  }

  async function handleDeleteSet(exerciseId: string, setId: string) {
    if (!activeWorkout) return;
    try {
      await workoutsApi.deleteSet(activeWorkout.id, exerciseId, setId);
      await fetchData();
    } catch (err) {
      setError('Erro ao deletar série');
    }
  }

  if (loading && !refreshing) return <Loading />;

  // Grupos do treino ativo definem quais exercícios da biblioteca aparecem.
  // Exercícios sem grupo (muscle_group vazio) aparecem sempre — nada some.
  const activeGroups = activeWorkout?.muscle_groups ?? [];
  const filteredLibrary = exerciseLibrary.filter(
    (item) =>
      !item.muscle_group ||
      activeGroups.length === 0 ||
      activeGroups.includes(item.muscle_group)
  );

  // Biblioteca agrupada por grupo muscular para a aba Exercícios.
  const librarySections = MUSCLE_GROUPS.map((g) => ({
    group: g,
    items: exerciseLibrary.filter((e) => e.muscle_group === g),
  })).filter((s) => s.items.length > 0);
  const ungroupedLibrary = exerciseLibrary.filter((e) => !e.muscle_group);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <ErrorBanner message={error} />

      {/* Abas internas: Treino / Exercícios */}
      <View style={styles.tabsRow}>
        <Pressable
          style={[styles.tabBtn, view === 'treino' && styles.tabBtnActive]}
          onPress={() => setView('treino')}
        >
          <Dumbbell
            size={Icon.sm}
            color={view === 'treino' ? Colors.textInverted : Colors.textSecondary}
            strokeWidth={Icon.stroke}
          />
          <Text style={[styles.tabText, view === 'treino' && styles.tabTextActive]}>Treino</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, view === 'exercicios' && styles.tabBtnActive]}
          onPress={() => setView('exercicios')}
        >
          <ListPlus
            size={Icon.sm}
            color={view === 'exercicios' ? Colors.textInverted : Colors.textSecondary}
            strokeWidth={Icon.stroke}
          />
          <Text style={[styles.tabText, view === 'exercicios' && styles.tabTextActive]}>Exercícios</Text>
        </Pressable>
      </View>

      {view === 'exercicios' ? (
        <View style={styles.startContainer}>
          <Text style={styles.headerTitle}>Exercícios</Text>

          {/* Cadastro de novo exercício */}
          <View style={styles.newWorkoutCard}>
            <Text style={styles.cardSectionTitle}>Cadastrar exercício</Text>
            <TextInput
              style={styles.inlineInput}
              placeholder="Nome (ex: Supino inclinado)"
              placeholderTextColor={Colors.textMuted}
              value={libName}
              onChangeText={setLibName}
            />
            <Text style={styles.fieldLabel}>Grupo muscular</Text>
            <View style={styles.groupChipsWrap}>
              {MUSCLE_GROUPS.map((g) => {
                const selected = libGroup === g;
                return (
                  <Pressable
                    key={g}
                    style={[styles.groupChip, selected && styles.groupChipSelected]}
                    onPress={() => setLibGroup(selected ? null : g)}
                  >
                    <Text style={[styles.groupChipText, selected && styles.groupChipTextSelected]}>{g}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.finishWorkoutButton} onPress={handleCreateLibraryExercise}>
              <Plus size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
              <Text style={styles.finishWorkoutText}>Cadastrar exercício</Text>
            </Pressable>
          </View>

          {/* Lista da biblioteca por grupo */}
          <Text style={styles.sectionTitle}>Cadastrados</Text>
          {exerciseLibrary.length === 0 ? (
            <EmptyState text="Nenhum exercício cadastrado ainda." />
          ) : (
            <>
              {librarySections.map((section) => (
                <View key={section.group} style={styles.libGroupCard}>
                  <Text style={styles.libGroupTitle}>{section.group}</Text>
                  {section.items.map((item) => (
                    <View key={item.id} style={styles.libRow}>
                      <Text style={styles.libRowText}>{item.name}</Text>
                      {item.user_id ? (
                        <Pressable hitSlop={8} onPress={() => confirmDeleteLibraryExercise(item)}>
                          <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                        </Pressable>
                      ) : (
                        <Text style={styles.libGlobalTag}>padrão</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))}
              {ungroupedLibrary.length > 0 && (
                <View style={styles.libGroupCard}>
                  <Text style={styles.libGroupTitle}>Sem grupo</Text>
                  {ungroupedLibrary.map((item) => (
                    <View key={item.id} style={styles.libRow}>
                      <Text style={styles.libRowText}>{item.name}</Text>
                      {item.user_id ? (
                        <Pressable hitSlop={8} onPress={() => confirmDeleteLibraryExercise(item)}>
                          <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                        </Pressable>
                      ) : (
                        <Text style={styles.libGlobalTag}>padrão</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      ) : activeWorkout ? (
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
                <Pressable style={styles.iconBtn} onPress={handleUpdateWorkoutName}>
                  <Save size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
                </Pressable>
                <Pressable style={styles.iconBtn} onPress={() => setIsEditingWorkout(false)}>
                  <X size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.activeHeaderTitleRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.statusChip}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Treino em andamento</Text>
                  </View>
                  <View style={styles.titleRow}>
                    <Text style={styles.activeTitle}>{activeWorkout.name}</Text>
                    <Pressable
                      style={styles.editTitleBtn}
                      onPress={() => {
                        setEditingWorkoutName(activeWorkout.name);
                        setIsEditingWorkout(true);
                      }}
                    >
                      <Pen size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                    </Pressable>
                  </View>
                  {activeGroups.length > 0 && (
                    <View style={styles.groupTagRow}>
                      {activeGroups.map((g) => (
                        <View key={g} style={styles.groupTag}>
                          <Text style={styles.groupTagText}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            {!isEditingWorkout && (
              <View style={styles.headerActions}>
                <Pressable style={[styles.iconBtn, styles.dangerAction]} onPress={() => handleCancelWorkout(activeWorkout.id)}>
                  <Trash2 size={Icon.md} color={Colors.danger} strokeWidth={Icon.stroke} />
                </Pressable>
                <Pressable style={[styles.iconBtn, styles.successAction]} onPress={() => handleFinishWorkout(activeWorkout.id)}>
                  <Check size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
                </Pressable>
              </View>
            )}
          </View>

          {activeWorkout.exercises?.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                {editingExerciseId === exercise.id ? (
                  <View style={styles.editExerciseRow}>
                    <TextInput
                      style={[styles.inlineInput, { flex: 1 }]}
                      value={editingExerciseName}
                      onChangeText={setEditingExerciseName}
                      autoFocus
                    />
                    <Pressable style={styles.iconBtn} onPress={() => handleUpdateExerciseName(activeWorkout.id, exercise.id)}>
                      <Save size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => setEditingExerciseId(null)}>
                      <X size={Icon.md} color={Colors.text} strokeWidth={Icon.stroke} />
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <View style={styles.exerciseNameRow}>
                      <View style={{ flexShrink: 1 }}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        {exercise.notes ? <Text style={styles.exerciseNotes}>Obs: {exercise.notes}</Text> : null}
                      </View>
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          setEditingExerciseId(exercise.id);
                          setEditingExerciseName(exercise.name);
                        }}
                      >
                        <Pen size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                      </Pressable>
                    </View>
                    <Pressable hitSlop={8} onPress={() => handleDeleteExercise(exercise.id)}>
                      <X size={Icon.md} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                    </Pressable>
                  </>
                )}
              </View>

              <View style={styles.setsTableHeader}>
                <Text style={[styles.columnHeader, { width: '15%' }]}>Série</Text>
                <Text style={[styles.columnHeader, { width: '35%', textAlign: 'center' }]}>Peso (kg)</Text>
                <Text style={[styles.columnHeader, { width: '35%', textAlign: 'center' }]}>Reps</Text>
                <Text style={[styles.columnHeader, { width: '15%' }]}></Text>
              </View>

              {exercise.exercise_sets?.map((set, index) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={[styles.setIndex, { width: '15%' }]}>{index + 1}</Text>
                  <View style={{ width: '35%', alignItems: 'center' }}>
                    <NumberInput
                      style={styles.setInput}
                      value={set.weight || 0}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      onChangeText={(num: number) => handleUpdateSet(exercise.id, set.id, { weight: num })}
                    />
                  </View>
                  <View style={{ width: '35%', alignItems: 'center' }}>
                    <NumberInput
                      style={styles.setInput}
                      value={set.reps || 0}
                      placeholder="0"
                      placeholderTextColor={Colors.textMuted}
                      onChangeText={(num: number) => handleUpdateSet(exercise.id, set.id, { reps: num })}
                    />
                  </View>
                  <View style={styles.setActions}>
                    <Pressable
                      style={[styles.checkButton, set.completed && styles.checkButtonActive]}
                      onPress={() => handleUpdateSet(exercise.id, set.id, { completed: !set.completed })}
                    >
                      {set.completed ? <Check size={14} color={Colors.textInverted} strokeWidth={2.5} /> : null}
                    </Pressable>
                    <Pressable onPress={() => handleDeleteSet(exercise.id, set.id)} hitSlop={6}>
                      <Trash2 size={Icon.sm} color={Colors.textMuted} strokeWidth={Icon.stroke} />
                    </Pressable>
                  </View>
                </View>
              ))}

              <Pressable style={styles.addSetButton} onPress={() => handleAddSet(exercise.id, exercise.exercise_sets || [])}>
                <Plus size={Icon.sm} color={Colors.textSecondary} strokeWidth={Icon.stroke} />
                <Text style={styles.addSetText}>Adicionar série</Text>
              </Pressable>
            </View>
          ))}

          {addingExerciseToId === activeWorkout.id ? (
            <View style={styles.libraryCard}>
              <Text style={styles.cardSectionTitle}>Selecione um exercício</Text>
              {activeGroups.length > 0 && (
                <Text style={styles.librarySubtitle}>Filtrado por: {activeGroups.join(' · ')}</Text>
              )}

              <ScrollView style={styles.libraryList} nestedScrollEnabled>
                {filteredLibrary.map((item) => (
                  <Pressable key={item.id} style={styles.libraryItem} onPress={() => handleAddExercise(item.name)}>
                    <Text style={styles.libraryItemText}>{item.name}</Text>
                    <Text style={styles.libraryItemSub}>{item.muscle_group || 'Sem grupo'}</Text>
                  </Pressable>
                ))}
                {filteredLibrary.length === 0 && (
                  <Text style={styles.mutedCenter}>
                    Nenhum exercício para os grupos deste treino. Cadastre na aba Exercícios.
                  </Text>
                )}
              </ScrollView>

              <Pressable style={styles.closeLibraryBtn} onPress={() => setAddingExerciseToId(null)}>
                <Text style={styles.closeLibraryBtnText}>Cancelar</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.addExerciseButton} onPress={() => setAddingExerciseToId(activeWorkout.id)}>
              <Plus size={Icon.sm} color={Colors.primary} strokeWidth={Icon.stroke} />
              <Text style={styles.addExerciseText}>Adicionar exercício</Text>
            </Pressable>
          )}

          <Pressable
            style={({ pressed }) => [styles.finishWorkoutButton, pressed && styles.pressed]}
            onPress={() => handleFinishWorkout(activeWorkout.id)}
          >
            <Check size={Icon.md} color={Colors.textInverted} strokeWidth={Icon.stroke} />
            <Text style={styles.finishWorkoutText}>Finalizar treino</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.headerTitle}>Registro de treino</Text>

          {showNewWorkoutInput ? (
            <View style={styles.newWorkoutCard}>
              <Text style={styles.cardSectionTitle}>Iniciar novo treino</Text>
              <TextInput
                style={styles.inlineInput}
                placeholder="Nome do treino (ex: Treino A · Peito)"
                placeholderTextColor={Colors.textMuted}
                value={newWorkoutName}
                onChangeText={setNewWorkoutName}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Tipo do treino (grupos musculares)</Text>
              <View style={styles.groupChipsWrap}>
                {MUSCLE_GROUPS.map((g) => {
                  const selected = newWorkoutGroups.includes(g);
                  return (
                    <Pressable
                      key={g}
                      style={[styles.groupChip, selected && styles.groupChipSelected]}
                      onPress={() => toggleNewWorkoutGroup(g)}
                    >
                      <Text style={[styles.groupChipText, selected && styles.groupChipTextSelected]}>{g}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.fieldHint}>
                Selecione um ou mais grupos. Os exercícios serão filtrados por eles.
              </Text>

              <View style={styles.inlineActions}>
                <Pressable
                  style={styles.ghostBtn}
                  onPress={() => {
                    setShowNewWorkoutInput(false);
                    setNewWorkoutGroups([]);
                  }}
                >
                  <Text style={styles.ghostBtnText}>Cancelar</Text>
                </Pressable>
                <Pressable style={styles.primarySmall} onPress={handleStartWorkout}>
                  <Text style={styles.primarySmallText}>Começar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={({ pressed }) => [styles.startWorkoutCard, pressed && styles.pressed]} onPress={() => setShowNewWorkoutInput(true)}>
              <View style={styles.startWorkoutIcon}>
                <Dumbbell size={28} color={Colors.textInverted} strokeWidth={Icon.stroke} />
              </View>
              <Text style={styles.startWorkoutTitle}>Iniciar novo treino</Text>
              <Text style={styles.startWorkoutSubtitle}>Escolha o tipo e registre seus exercícios</Text>
            </Pressable>
          )}

          <Text style={styles.sectionTitle}>Histórico</Text>

          {workoutsList.filter((w) => w.completed).length === 0 ? (
            <EmptyState text="Nenhum treino realizado ainda." />
          ) : (
            workoutsList
              .filter((w) => w.completed)
              .map((workout) => (
                <View key={workout.id} style={styles.historyCard}>
                  <View style={styles.historyHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyTitle}>{workout.name}</Text>
                      <Text style={styles.historyDate}>
                        {new Date(workout.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    <Pressable style={styles.reopenBtn} onPress={() => handleReopenWorkout(workout.id)}>
                      <Text style={styles.reopenBtnText}>Editar</Text>
                    </Pressable>
                  </View>
                  {workout.muscle_groups?.length > 0 && (
                    <View style={styles.groupTagRow}>
                      {workout.muscle_groups.map((g) => (
                        <View key={g} style={styles.groupTag}>
                          <Text style={styles.groupTagText}>{g}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <Text style={styles.historySub}>{workout.exercises?.length || 0} exercícios</Text>
                  {workout.exercises?.length > 0 ? (
                    <View style={styles.historyExercises}>
                      {workout.exercises.map((ex) => (
                        <Text key={ex.id} style={styles.historyExerciseItem}>
                          {ex.name} · {ex.exercise_sets?.length || 0} séries
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
  scrollContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, maxWidth: 600, width: '100%', alignSelf: 'center', gap: Spacing.md },
  headerTitle: { fontSize: FontSize.xxl, fontFamily: Font.bold, color: Colors.text, letterSpacing: -0.5 },

  tabsRow: { flexDirection: 'row', gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, padding: 4 },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },
  tabTextActive: { color: Colors.textInverted },

  activeContainer: { gap: Spacing.md },
  activeHeader: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    ...Elevation.card,
  },
  activeHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  statusDot: { width: 7, height: 7, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  statusText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: Font.semibold },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeTitle: { fontSize: FontSize.xl, fontFamily: Font.bold, color: Colors.text },
  editTitleBtn: { padding: Spacing.xs },

  groupTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  groupTag: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  groupTagText: { fontSize: FontSize.xs, color: Colors.primary, fontFamily: Font.semibold },

  editWorkoutContainer: { flexDirection: 'row', flex: 1, alignItems: 'center', gap: Spacing.sm },
  editWorkoutInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  headerActions: { flexDirection: 'row', gap: Spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dangerAction: { backgroundColor: Colors.dangerSoft, borderColor: Colors.dangerBorder },
  successAction: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Elevation.card,
  },
  exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: Spacing.sm },
  editExerciseRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  exerciseNameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  exerciseName: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  exerciseNotes: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2, fontFamily: Font.regular },

  setsTableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  columnHeader: { fontSize: FontSize.xs, fontFamily: Font.medium, color: Colors.textMuted },
  setRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.xs },
  setIndex: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.semibold },
  setInput: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    color: Colors.text,
    textAlign: 'center',
    width: 72,
    height: 40,
    fontSize: FontSize.md,
    fontFamily: Font.medium,
  },
  setActions: { width: '15%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: Spacing.sm },
  checkButton: { width: 28, height: 28, borderRadius: BorderRadius.sm, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkButtonActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  addSetText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },

  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primarySoft,
  },
  addExerciseText: { fontSize: FontSize.sm, color: Colors.primary, fontFamily: Font.semibold },

  finishWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    ...Elevation.card,
  },
  pressed: { opacity: 0.8 },
  finishWorkoutText: { color: Colors.textInverted, fontSize: FontSize.md, fontFamily: Font.semibold },

  startContainer: { gap: Spacing.md },
  startWorkoutCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Elevation.raised,
  },
  startWorkoutIcon: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(8, 17, 15, 0.16)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  startWorkoutTitle: { fontSize: FontSize.lg, fontFamily: Font.bold, color: Colors.textInverted },
  startWorkoutSubtitle: { fontSize: FontSize.sm, color: Colors.textInverted, textAlign: 'center', fontFamily: Font.medium, opacity: 0.8 },

  newWorkoutCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    ...Elevation.card,
  },
  cardSectionTitle: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  librarySubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, fontFamily: Font.medium, marginTop: -Spacing.xs },

  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.semibold },
  fieldHint: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.regular, marginTop: -Spacing.xs },
  groupChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  groupChip: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  groupChipSelected: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  groupChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.medium },
  groupChipTextSelected: { color: Colors.primary, fontFamily: Font.semibold },

  inlineInput: {
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
  inlineActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm },
  ghostBtn: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  ghostBtnText: { color: Colors.text, fontSize: FontSize.sm, fontFamily: Font.semibold },
  primarySmall: { backgroundColor: Colors.primary, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.full },
  primarySmallText: { color: Colors.textInverted, fontSize: FontSize.sm, fontFamily: Font.semibold },

  sectionTitle: { fontSize: FontSize.lg, fontFamily: Font.semibold, color: Colors.text, marginTop: Spacing.sm },

  libGroupCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    ...Elevation.card,
  },
  libGroupTitle: { fontSize: FontSize.sm, fontFamily: Font.bold, color: Colors.primary, marginBottom: Spacing.xs },
  libRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  libRowText: { fontSize: FontSize.md, color: Colors.text, fontFamily: Font.medium },
  libGlobalTag: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium },

  historyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.card,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: Spacing.sm },
  historyTitle: { fontSize: FontSize.md, fontFamily: Font.semibold, color: Colors.text },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted, fontFamily: Font.medium, marginTop: 1 },
  reopenBtn: { backgroundColor: Colors.surfaceAlt, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  reopenBtnText: { color: Colors.text, fontSize: FontSize.xs, fontFamily: Font.semibold },
  historySub: { fontSize: FontSize.sm, color: Colors.primary, marginBottom: Spacing.sm, marginTop: Spacing.xs, fontFamily: Font.semibold },
  historyExercises: { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm, gap: 4 },
  historyExerciseItem: { fontSize: FontSize.sm, color: Colors.textSecondary, fontFamily: Font.regular },

  libraryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Elevation.card,
  },
  libraryList: { maxHeight: 300, marginVertical: Spacing.sm },
  libraryItem: { padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.md, marginBottom: 8 },
  libraryItemText: { color: Colors.text, fontSize: FontSize.md, fontFamily: Font.semibold },
  libraryItemSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, fontFamily: Font.regular },
  mutedCenter: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginVertical: Spacing.md, fontFamily: Font.regular },
  closeLibraryBtn: { alignItems: 'center', padding: Spacing.md, marginTop: Spacing.sm },
  closeLibraryBtnText: { color: Colors.textSecondary, fontFamily: Font.semibold },
});
