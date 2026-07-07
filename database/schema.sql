-- VitalTrack Database Schema (Updated for Sets and Meal Items)
-- Run this in your Supabase SQL Editor to create/update all tables

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Workouts table (Treinos)
CREATE TABLE IF NOT EXISTS workouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  completed  BOOLEAN      NOT NULL DEFAULT false,
  notes      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date    ON workouts(date);

-- Exercises table (Exercícios)
CREATE TABLE IF NOT EXISTS exercises (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID         NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);

-- Exercise Sets table (Séries)
CREATE TABLE IF NOT EXISTS exercise_sets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID         NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight      NUMERIC(7, 2),
  reps        INTEGER,
  completed   BOOLEAN      NOT NULL DEFAULT false,
  order_index INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON exercise_sets(exercise_id);

-- Meals table (Refeições)
CREATE TABLE IF NOT EXISTS meals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  date       DATE         NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date    ON meals(date);

-- Meal Items table (Alimentos da Refeição)
CREATE TABLE IF NOT EXISTS meal_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id    UUID         NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  amount     NUMERIC(7, 2) NOT NULL DEFAULT 100.0, -- em gramas/ml
  calories   INTEGER      NOT NULL DEFAULT 0,
  protein    NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  carbs      NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  fat        NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_sets_updated_at
  BEFORE UPDATE ON exercise_sets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_meal_items_updated_at
  BEFORE UPDATE ON meal_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
