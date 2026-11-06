import { useCallback, useEffect, useRef, useState } from 'react';
import { workoutsApi } from '@/features/workouts/api';
import { ApiError, errorMessage, rawErrorMessage } from '@/services/http';
import type { Workout, ExerciseSet, ExerciseLibraryItem, UpdateSetPayload, WorkoutTemplate, TemplatePayload } from '@/types';

interface RunOptions {
  /** Se `false`, não exibe o banner de erro (o chamador trata). */
  banner?: boolean;
}

export function useWorkouts() {
  const [workouts, setWorkoutsState] = useState<Workout[]>([]);
  const [library, setLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  // `true` após a primeira carga bem-sucedida; sem isso `active` é desconhecido.
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // Espelho síncrono para ler o estado atual dentro de handlers assíncronos.
  const workoutsRef = useRef<Workout[]>([]);

  const setWorkouts = useCallback((updater: (prev: Workout[]) => Workout[]) => {
    workoutsRef.current = updater(workoutsRef.current);
    setWorkoutsState(workoutsRef.current);
  }, []);

  const load = useCallback(async () => {
    try {
      setError('');
      const [data, libraryData, templateData] = await Promise.all([
        workoutsApi.list(),
        workoutsApi.listLibrary(),
        workoutsApi.listTemplates(),
      ]);
      setTemplates(templateData);
      workoutsRef.current = data;
      setWorkoutsState(data);
      setLibrary(libraryData);
      setLoaded(true);
    } catch (err) {
      setError(rawErrorMessage(err, 'Erro ao carregar dados'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  /** Executa uma mutação e recarrega. Retorna `true` em sucesso. */
  async function run(
    action: () => Promise<unknown>,
    failMessage: string,
    { banner = true }: RunOptions = {}
  ): Promise<boolean> {
    try {
      setError('');
      await action();
    } catch (err) {
      if (banner) setError(errorMessage(err, failMessage));
      return false;
    }
    await load();
    return true;
  }

  // Treino em andamento: no máximo um.
  const active = workouts.find((w) => !w.completed) ?? null;
  const history = workouts.filter((w) => w.completed);

  // --- Treinos ---
  const startWorkout = (name: string, muscleGroups: string[]) =>
    run(
      () => workoutsApi.create({ name, completed: false, muscle_groups: muscleGroups }),
      'Erro ao iniciar treino'
    );

  const renameWorkout = (id: string, name: string) =>
    run(() => workoutsApi.update(id, { name }), 'Erro ao editar treino');

  const removeWorkout = (id: string) =>
    run(() => workoutsApi.remove(id), 'Erro ao excluir treino');

  const finishWorkout = (id: string) =>
    run(() => workoutsApi.update(id, { completed: true }), 'Erro ao finalizar treino');

  const reopenWorkout = (id: string) =>
    run(() => workoutsApi.update(id, { completed: false }), 'Erro ao reabrir treino');

  // --- Modelos de treino ---
  /** Cria (id = null) ou substitui um modelo. */
  const saveTemplate = (id: string | null, payload: TemplatePayload) =>
    run(
      () => (id ? workoutsApi.updateTemplate(id, payload) : workoutsApi.createTemplate(payload)),
      'Erro ao salvar modelo'
    );

  const removeTemplate = (id: string) =>
    run(() => workoutsApi.removeTemplate(id), 'Erro ao excluir modelo');

  /**
   * Inicia um treino a partir do modelo. Não usa `run`: o chamador precisa
   * distinguir conflito (já há treino em andamento) de falha genérica.
   */
  const startTemplate = async (id: string): Promise<'ok' | 'conflict' | 'missing' | 'error'> => {
    try {
      setError('');
      await workoutsApi.startTemplate(id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) return 'conflict';
      if (err instanceof ApiError && err.status === 404) {
        await load();
        return 'missing';
      }
      setError(errorMessage(err, 'Erro ao iniciar treino'));
      return 'error';
    }
    await load();
    return 'ok';
  };

  // --- Exercícios do treino ---
  const addExercise = (workoutId: string, name: string) =>
    run(() => workoutsApi.addExercise(workoutId, { name }), 'Erro ao adicionar exercício');

  const renameExercise = (workoutId: string, exerciseId: string, name: string) =>
    run(
      () => workoutsApi.updateExercise(workoutId, exerciseId, { name }),
      'Falha ao atualizar nome do exercício',
      { banner: false }
    );

  const removeExercise = (workoutId: string, exerciseId: string) =>
    run(() => workoutsApi.removeExercise(workoutId, exerciseId), 'Erro ao deletar exercício');

  // --- Séries ---
  const addSet = (workoutId: string, exerciseId: string, currentCount: number) =>
    run(
      () =>
        workoutsApi.addSet(workoutId, exerciseId, {
          weight: 0,
          reps: 0,
          completed: false,
          order_index: currentCount + 1,
        }),
      'Erro ao adicionar série'
    );

  const removeSet = (workoutId: string, exerciseId: string, setId: string) =>
    run(() => workoutsApi.removeSet(workoutId, exerciseId, setId), 'Erro ao deletar série');

  const patchSet = useCallback(
    (exerciseId: string, setId: string, patch: UpdateSetPayload) =>
      setWorkouts((prev) =>
        prev.map((w) => ({
          ...w,
          exercises: w.exercises.map((ex) =>
            ex.id !== exerciseId
              ? ex
              : {
                  ...ex,
                  exercise_sets: ex.exercise_sets.map((s) => (s.id !== setId ? s : { ...s, ...patch })),
                }
          ),
        }))
      ),
    [setWorkouts]
  );

  /** Atualização otimista; em erro reverte só os campos alterados deste set. */
  async function updateSet(
    workoutId: string,
    exerciseId: string,
    setId: string,
    fields: UpdateSetPayload
  ) {
    const prevSet: ExerciseSet | undefined = workoutsRef.current
      .flatMap((w) => w.exercises)
      .find((ex) => ex.id === exerciseId)
      ?.exercise_sets?.find((s) => s.id === setId);

    patchSet(exerciseId, setId, fields);
    try {
      await workoutsApi.updateSet(workoutId, exerciseId, setId, fields);
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar série'));
      if (prevSet) {
        const revert: UpdateSetPayload = {};
        if ('weight' in fields) revert.weight = prevSet.weight;
        if ('reps' in fields) revert.reps = prevSet.reps;
        if ('completed' in fields) revert.completed = prevSet.completed;
        if ('order_index' in fields) revert.order_index = prevSet.order_index;
        patchSet(exerciseId, setId, revert);
      } else {
        await load();
      }
    }
  }

  // --- Biblioteca de exercícios ---
  const addLibraryExercise = (name: string, muscleGroup: string) =>
    run(
      () => workoutsApi.addLibraryExercise({ name, muscle_group: muscleGroup }),
      'Erro ao cadastrar exercício'
    );

  const removeLibraryExercise = (id: string) =>
    run(() => workoutsApi.removeLibraryExercise(id), 'Erro ao excluir exercício');

  return {
    active,
    history,
    templates,
    saveTemplate,
    removeTemplate,
    startTemplate,
    library,
    loading,
    loaded,
    refreshing,
    error,
    refresh,
    startWorkout,
    renameWorkout,
    removeWorkout,
    finishWorkout,
    reopenWorkout,
    addExercise,
    renameExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    addLibraryExercise,
    removeLibraryExercise,
  };
}

export type WorkoutsApi = ReturnType<typeof useWorkouts>;
