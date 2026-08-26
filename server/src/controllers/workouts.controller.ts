import { Response } from "express";
import { randomUUID } from "node:crypto";
import { AuthRequest } from "../middlewares/auth.js";
import { db } from "../config/db.js";

// Prepared statements for the nested reads.
const exercisesByWorkout = db.prepare(
  "SELECT * FROM exercises WHERE workout_id = ? ORDER BY created_at ASC"
);
const setsByExercise = db.prepare(
  "SELECT * FROM exercise_sets WHERE exercise_id = ? ORDER BY order_index ASC"
);

// Attach exercises (with their sets) to a workout row and normalize the
// SQLite 0/1 integers back to booleans the front-end expects.
function hydrateWorkout(workout: Record<string, any>) {
  workout.completed = !!workout.completed;
  workout.muscle_groups = workout.muscle_groups
    ? String(workout.muscle_groups).split(",").filter(Boolean)
    : [];
  workout.exercises = exercisesByWorkout.all(workout.id).map((ex: any) => {
    ex.exercise_sets = setsByExercise
      .all(ex.id)
      .map((s: any) => ({ ...s, completed: !!s.completed }));
    return ex;
  });
  return workout;
}

// Load a single owned workout fully hydrated, or undefined if not the owner.
function getWorkout(id: string, userId: string) {
  const workout = db
    .prepare("SELECT * FROM workouts WHERE id = ? AND user_id = ?")
    .get(id, userId) as Record<string, any> | undefined;
  return workout ? hydrateWorkout(workout) : undefined;
}

// Confirm the workout belongs to the user before touching child rows (IDOR guard).
function ownsWorkout(workoutId: string, userId: string): boolean {
  return !!db
    .prepare("SELECT id FROM workouts WHERE id = ? AND user_id = ?")
    .get(workoutId, userId);
}

// GET /api/workouts/library/exercises — list global and user's exercises
export async function listExerciseLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const data = db
      .prepare(
        `SELECT * FROM exercise_library
         WHERE user_id = ? OR user_id IS NULL
         ORDER BY name ASC`
      )
      .all(req.userId!);
    res.json(data);
  } catch (err) {
    console.error("List exercise library error:", (err as Error).message);
    res.status(500).json({ error: "Failed to fetch exercise library" });
  }
}

// POST /api/workouts/library/exercises — add exercise to library
export async function createExerciseLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, muscle_group } = req.body;
    if (!name) {
      res.status(400).json({ error: "Exercise name is required" });
      return;
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO exercise_library (id, user_id, name, muscle_group) VALUES (?, ?, ?, ?)"
    ).run(id, req.userId!, name, muscle_group || null);

    const data = db
      .prepare("SELECT * FROM exercise_library WHERE id = ?")
      .get(id);
    res.status(201).json(data);
  } catch (err) {
    console.error("Create exercise library error:", (err as Error).message);
    res.status(500).json({ error: "Failed to create exercise in library" });
  }
}

// DELETE /api/workouts/library/exercises/:id — delete user's exercise
export async function deleteExerciseLibrary(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    // Only allow deleting user's own exercises (user_id = ? excludes globals)
    const info = db
      .prepare("DELETE FROM exercise_library WHERE id = ? AND user_id = ?")
      .run(id, req.userId!);

    if (info.changes === 0) {
      res.status(404).json({ error: "Exercise not found or cannot be deleted" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete exercise library error:", (err as Error).message);
    res.status(500).json({ error: "Failed to delete exercise from library" });
  }
}

// GET /api/workouts — list user's workouts with exercises and sets
export async function listWorkouts(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const workouts = db
      .prepare(
        "SELECT * FROM workouts WHERE user_id = ? ORDER BY created_at DESC"
      )
      .all(req.userId!) as Record<string, any>[];

    res.json(workouts.map(hydrateWorkout));
  } catch (err) {
    console.error("List workouts error:", (err as Error).message);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
}

// POST /api/workouts — create a workout
export async function createWorkout(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { name, date, notes, completed, muscle_groups } = req.body;

    if (!name) {
      res.status(400).json({ error: "Workout name is required" });
      return;
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO workouts (id, user_id, name, date, completed, notes, muscle_groups) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(
      id,
      req.userId!,
      name,
      date || new Date().toISOString().split("T")[0],
      completed ? 1 : 0,
      notes || null,
      Array.isArray(muscle_groups) ? muscle_groups.join(",") : muscle_groups || null
    );

    res.status(201).json(getWorkout(id, req.userId!));
  } catch (err) {
    console.error("Create workout error:", (err as Error).message);
    res.status(500).json({ error: "Failed to create workout" });
  }
}

// PUT /api/workouts/:id — update a workout
export async function updateWorkout(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { name, date, notes, completed, muscle_groups } = req.body;

    // Partial update: COALESCE keeps the current column value when the client
    // omits a field (front sends partial payloads like { completed: true }).
    const info = db
      .prepare(
        `UPDATE workouts
         SET name = COALESCE(@name, name),
             date = COALESCE(@date, date),
             notes = COALESCE(@notes, notes),
             completed = COALESCE(@completed, completed),
             muscle_groups = COALESCE(@muscle_groups, muscle_groups)
         WHERE id = @id AND user_id = @user_id`
      )
      .run({
        id,
        user_id: req.userId!,
        name: name ?? null,
        date: date ?? null,
        notes: notes ?? null,
        completed: completed === undefined ? null : completed ? 1 : 0,
        muscle_groups: Array.isArray(muscle_groups)
          ? muscle_groups.join(",")
          : muscle_groups ?? null,
      });

    if (info.changes === 0) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    res.json(getWorkout(id, req.userId!));
  } catch (err) {
    console.error("Update workout error:", (err as Error).message);
    res.status(500).json({ error: "Failed to update workout" });
  }
}

// DELETE /api/workouts/:id — delete a workout
export async function deleteWorkout(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const info = db
      .prepare("DELETE FROM workouts WHERE id = ? AND user_id = ?")
      .run(id, req.userId!);

    if (info.changes === 0) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete workout error:", (err as Error).message);
    res.status(500).json({ error: "Failed to delete workout" });
  }
}

// POST /api/workouts/:id/exercises — add exercise to workout
export async function addExercise(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id: workoutId } = req.params;
    const { name, notes } = req.body;

    if (!name) {
      res.status(400).json({ error: "Exercise name is required" });
      return;
    }

    if (!ownsWorkout(workoutId, req.userId!)) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const id = randomUUID();
    db.prepare(
      "INSERT INTO exercises (id, workout_id, name, notes) VALUES (?, ?, ?, ?)"
    ).run(id, workoutId, name, notes || null);

    const data = db
      .prepare("SELECT * FROM exercises WHERE id = ?")
      .get(id) as Record<string, any>;
    data.exercise_sets = [];
    res.status(201).json(data);
  } catch (err) {
    console.error("Add exercise error:", (err as Error).message);
    res.status(500).json({ error: "Failed to add exercise" });
  }
}

// DELETE /api/workouts/:id/exercises/:exerciseId — delete exercise
export async function deleteExercise(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id: workoutId, exerciseId } = req.params;

    if (!ownsWorkout(workoutId, req.userId!)) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const info = db
      .prepare("DELETE FROM exercises WHERE id = ? AND workout_id = ?")
      .run(exerciseId, workoutId);

    if (info.changes === 0) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete exercise error:", (err as Error).message);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
}

// PUT /api/workouts/:id/exercises/:exerciseId — update exercise
export async function updateExercise(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id: workoutId, exerciseId } = req.params;
    const { name, notes } = req.body;

    if (!ownsWorkout(workoutId, req.userId!)) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const info = db
      .prepare(
        `UPDATE exercises
         SET name = COALESCE(@name, name), notes = COALESCE(@notes, notes)
         WHERE id = @exerciseId AND workout_id = @workoutId`
      )
      .run({
        exerciseId,
        workoutId,
        name: name ?? null,
        notes: notes ?? null,
      });

    if (info.changes === 0) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    const updatedExercise = db
      .prepare("SELECT * FROM exercises WHERE id = ?")
      .get(exerciseId);
    res.json(updatedExercise);
  } catch (err) {
    console.error("Update exercise error:", (err as Error).message);
    res.status(500).json({ error: "Failed to update exercise" });
  }
}

// POST /api/workouts/:id/exercises/:exerciseId/sets — add set to exercise
export async function addSet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: workoutId, exerciseId } = req.params;
    const { weight, reps, completed, order_index } = req.body;

    if (!ownsWorkout(workoutId, req.userId!)) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const id = randomUUID();
    db.prepare(
      `INSERT INTO exercise_sets (id, exercise_id, weight, reps, completed, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      exerciseId,
      weight || 0,
      reps || 0,
      completed ? 1 : 0,
      order_index || 0
    );

    const data = db
      .prepare("SELECT * FROM exercise_sets WHERE id = ?")
      .get(id) as Record<string, any>;
    data.completed = !!data.completed;
    res.status(201).json(data);
  } catch (err) {
    console.error("Add set error:", (err as Error).message);
    res.status(500).json({ error: "Failed to add set" });
  }
}

// PUT /api/workouts/:id/exercises/:exerciseId/sets/:setId — update set
export async function updateSet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: workoutId, exerciseId, setId } = req.params;
    const { weight, reps, completed, order_index } = req.body;

    if (!ownsWorkout(workoutId, req.userId!)) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    // Partial update: the front edits one field at a time ({ weight },
    // { reps }, { completed }). COALESCE preserves the untouched columns.
    const info = db
      .prepare(
        `UPDATE exercise_sets
         SET weight = COALESCE(@weight, weight),
             reps = COALESCE(@reps, reps),
             completed = COALESCE(@completed, completed),
             order_index = COALESCE(@order_index, order_index)
         WHERE id = @setId AND exercise_id = @exerciseId`
      )
      .run({
        setId,
        exerciseId,
        weight: weight ?? null,
        reps: reps ?? null,
        completed: completed === undefined ? null : completed ? 1 : 0,
        order_index: order_index ?? null,
      });

    if (info.changes === 0) {
      res.status(404).json({ error: "Set not found" });
      return;
    }

    const data = db
      .prepare("SELECT * FROM exercise_sets WHERE id = ?")
      .get(setId) as Record<string, any>;
    data.completed = !!data.completed;
    res.json(data);
  } catch (err) {
    console.error("Update set error:", (err as Error).message);
    res.status(500).json({ error: "Failed to update set" });
  }
}

// DELETE /api/workouts/:id/exercises/:exerciseId/sets/:setId — delete set
export async function deleteSet(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id: workoutId, exerciseId, setId } = req.params;

    if (!ownsWorkout(workoutId, req.userId!)) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const info = db
      .prepare("DELETE FROM exercise_sets WHERE id = ? AND exercise_id = ?")
      .run(setId, exerciseId);

    if (info.changes === 0) {
      res.status(404).json({ error: "Set not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete set error:", (err as Error).message);
    res.status(500).json({ error: "Failed to delete set" });
  }
}
