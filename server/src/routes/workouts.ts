import { Router, Response } from "express";
import { AuthRequest, authenticate } from "../middleware/auth.js";
import { supabase } from "../db.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/workouts/library/exercises — list global and user's exercises
router.get("/library/exercises", async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("exercise_library")
      .select("*")
      .or(`user_id.eq.${req.userId},user_id.is.null`)
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("List exercise library error:", err);
    res.status(500).json({ error: "Failed to fetch exercise library" });
  }
});

// POST /api/workouts/library/exercises — add exercise to library
router.post("/library/exercises", async (req: AuthRequest, res: Response) => {
  try {
    const { name, muscle_group } = req.body;
    if (!name) {
      res.status(400).json({ error: "Exercise name is required" });
      return;
    }

    const { data, error } = await supabase
      .from("exercise_library")
      .insert({
        user_id: req.userId!,
        name,
        muscle_group: muscle_group || null,
      })
      .select("*")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error("Create exercise library error:", err);
    res.status(500).json({ error: "Failed to create exercise in library" });
  }
});

// DELETE /api/workouts/library/exercises/:id — delete user's exercise
router.delete("/library/exercises/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error, count } = await supabase
      .from("exercise_library")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", req.userId!); // Only allow deleting user's own exercises

    if (error) throw error;
    if (count === 0) {
      res.status(404).json({ error: "Exercise not found or cannot be deleted" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error("Delete exercise library error:", err);
    res.status(500).json({ error: "Failed to delete exercise from library" });
  }
});

// GET /api/workouts — list user's workouts with exercises and sets
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("workouts")
      .select("*, exercises(*, exercise_sets(*))")
      .eq("user_id", req.userId!)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Ordenar as séries pelo order_index
    if (data) {
      data.forEach((workout: any) => {
        if (workout.exercises) {
          workout.exercises.forEach((exercise: any) => {
            if (exercise.exercise_sets) {
              exercise.exercise_sets.sort((a: any, b: any) => a.order_index - b.order_index);
            }
          });
        }
      });
    }

    res.json(data);
  } catch (err) {
    console.error("List workouts error:", err);
    res.status(500).json({ error: "Failed to fetch workouts" });
  }
});

// POST /api/workouts — create a workout
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { name, date, notes, completed } = req.body;

    if (!name) {
      res.status(400).json({ error: "Workout name is required" });
      return;
    }

    const { data, error } = await supabase
      .from("workouts")
      .insert({
        user_id: req.userId!,
        name,
        date: date || new Date().toISOString().split("T")[0],
        completed: completed || false,
        notes: notes || null,
      })
      .select("*, exercises(*, exercise_sets(*))")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Create workout error:", err);
    res.status(500).json({ error: "Failed to create workout" });
  }
});

// PUT /api/workouts/:id — update a workout
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, date, notes, completed } = req.body;

    const { data, error } = await supabase
      .from("workouts")
      .update({ name, date, notes, completed })
      .eq("id", id)
      .eq("user_id", req.userId!)
      .select("*, exercises(*, exercise_sets(*))")
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error("Update workout error:", err);
    res.status(500).json({ error: "Failed to update workout" });
  }
});

// DELETE /api/workouts/:id — delete a workout
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error, count } = await supabase
      .from("workouts")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", req.userId!);

    if (error) throw error;

    if (count === 0) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete workout error:", err);
    res.status(500).json({ error: "Failed to delete workout" });
  }
});

// POST /api/workouts/:id/exercises — add exercise to workout
router.post("/:id/exercises", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workoutId } = req.params;
    const { name, notes } = req.body;

    if (!name) {
      res.status(400).json({ error: "Exercise name is required" });
      return;
    }

    // Verify ownership
    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", req.userId!)
      .single();

    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const { data, error } = await supabase
      .from("exercises")
      .insert({
        workout_id: workoutId,
        name,
        notes: notes || null,
      })
      .select("*, exercise_sets(*)")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Add exercise error:", err);
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

// DELETE /api/workouts/:id/exercises/:exerciseId — delete exercise
router.delete("/:id/exercises/:exerciseId", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workoutId, exerciseId } = req.params;

    // Verify ownership
    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", req.userId!)
      .single();

    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const { error, count } = await supabase
      .from("exercises")
      .delete({ count: "exact" })
      .eq("id", exerciseId)
      .eq("workout_id", workoutId);

    if (error) throw error;

    if (count === 0) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete exercise error:", err);
    res.status(500).json({ error: "Failed to delete exercise" });
  }
});

// PUT /api/workouts/:id/exercises/:exerciseId — update exercise
router.put("/:id/exercises/:exerciseId", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workoutId, exerciseId } = req.params;
    const { name, notes } = req.body;

    // Verify ownership
    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", req.userId!)
      .single();

    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const { data: updatedExercise, error } = await supabase
      .from("exercises")
      .update({ name, notes })
      .eq("id", exerciseId)
      .eq("workout_id", workoutId)
      .select()
      .single();

    if (error) throw error;

    if (!updatedExercise) {
      res.status(404).json({ error: "Exercise not found" });
      return;
    }

    res.json(updatedExercise);
  } catch (err) {
    console.error("Update exercise error:", err);
    res.status(500).json({ error: "Failed to update exercise" });
  }
});

// POST /api/workouts/:id/exercises/:exerciseId/sets — add set to exercise
router.post("/:id/exercises/:exerciseId/sets", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workoutId, exerciseId } = req.params;
    const { weight, reps, completed, order_index } = req.body;

    // Verify ownership
    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", req.userId!)
      .single();

    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const { data, error } = await supabase
      .from("exercise_sets")
      .insert({
        exercise_id: exerciseId,
        weight: weight || 0,
        reps: reps || 0,
        completed: completed || false,
        order_index: order_index || 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error("Add set error:", err);
    res.status(500).json({ error: "Failed to add set" });
  }
});

// PUT /api/workouts/:id/exercises/:exerciseId/sets/:setId — update set
router.put("/:id/exercises/:exerciseId/sets/:setId", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workoutId, exerciseId, setId } = req.params;
    const { weight, reps, completed, order_index } = req.body;

    // Verify ownership
    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", req.userId!)
      .single();

    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const { data, error } = await supabase
      .from("exercise_sets")
      .update({ weight, reps, completed, order_index })
      .eq("id", setId)
      .eq("exercise_id", exerciseId)
      .select("*")
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: "Set not found" });
      return;
    }

    res.json(data);
  } catch (err) {
    console.error("Update set error:", err);
    res.status(500).json({ error: "Failed to update set" });
  }
});

// DELETE /api/workouts/:id/exercises/:exerciseId/sets/:setId — delete set
router.delete("/:id/exercises/:exerciseId/sets/:setId", async (req: AuthRequest, res: Response) => {
  try {
    const { id: workoutId, exerciseId, setId } = req.params;

    // Verify ownership
    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", workoutId)
      .eq("user_id", req.userId!)
      .single();

    if (!workout) {
      res.status(404).json({ error: "Workout not found" });
      return;
    }

    const { error, count } = await supabase
      .from("exercise_sets")
      .delete({ count: "exact" })
      .eq("id", setId)
      .eq("exercise_id", exerciseId);

    if (error) throw error;

    if (count === 0) {
      res.status(404).json({ error: "Set not found" });
      return;
    }

    res.status(204).send();
  } catch (err) {
    console.error("Delete set error:", err);
    res.status(500).json({ error: "Failed to delete set" });
  }
});

export default router;
