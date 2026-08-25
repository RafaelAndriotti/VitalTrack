-- VitalTrack — SQLite schema (better-sqlite3)
-- Applied automatically on server boot when the .db file does not exist.
-- Idempotent: safe to re-run. Contains NO user data (only global seeds).

PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- Workouts (Treinos)
CREATE TABLE IF NOT EXISTS workouts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  date       TEXT NOT NULL DEFAULT (date('now')),
  completed  INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date    ON workouts(date);

-- Exercises (Exercícios)
CREATE TABLE IF NOT EXISTS exercises (
  id         TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  notes      TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);

-- Exercise Sets (Séries)
CREATE TABLE IF NOT EXISTS exercise_sets (
  id          TEXT PRIMARY KEY,
  exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight      REAL,
  reps        INTEGER,
  completed   INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON exercise_sets(exercise_id);

-- Meals (Refeições)
CREATE TABLE IF NOT EXISTS meals (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  date       TEXT NOT NULL DEFAULT (date('now')),
  time       TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_date    ON meals(date);

-- Meal Items (Alimentos da Refeição)
CREATE TABLE IF NOT EXISTS meal_items (
  id         TEXT PRIMARY KEY,
  meal_id    TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  amount     REAL NOT NULL DEFAULT 100.0,
  calories   INTEGER NOT NULL DEFAULT 0,
  protein    REAL NOT NULL DEFAULT 0.0,
  carbs      REAL NOT NULL DEFAULT 0.0,
  fat        REAL NOT NULL DEFAULT 0.0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_meal_items_meal_id ON meal_items(meal_id);

-- Exercise library (user_id NULL = global)
CREATE TABLE IF NOT EXISTS exercise_library (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  muscle_group TEXT,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_ex_library_user_id ON exercise_library(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ex_lib_global ON exercise_library(name) WHERE user_id IS NULL;

-- Food library (user_id NULL = global)
CREATE TABLE IF NOT EXISTS food_library (
  id           TEXT PRIMARY KEY,
  user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  calories     INTEGER NOT NULL DEFAULT 0,
  protein      REAL NOT NULL DEFAULT 0.0,
  carbs        REAL NOT NULL DEFAULT 0.0,
  fat          REAL NOT NULL DEFAULT 0.0,
  serving_size REAL NOT NULL DEFAULT 100.0,
  created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_food_library_user_id ON food_library(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_lib_global ON food_library(name) WHERE user_id IS NULL;

-- Daily water
CREATE TABLE IF NOT EXISTS daily_water (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       TEXT NOT NULL DEFAULT (date('now')),
  amount_ml  INTEGER NOT NULL DEFAULT 0,
  goal_ml    INTEGER NOT NULL DEFAULT 2000,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_water_user_date ON daily_water(user_id, date);

-- Auto-update updated_at on row changes (replaces Postgres plpgsql trigger)
CREATE TRIGGER IF NOT EXISTS trg_users_updated_at AFTER UPDATE ON users FOR EACH ROW
BEGIN UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_workouts_updated_at AFTER UPDATE ON workouts FOR EACH ROW
BEGIN UPDATE workouts SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_exercises_updated_at AFTER UPDATE ON exercises FOR EACH ROW
BEGIN UPDATE exercises SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_sets_updated_at AFTER UPDATE ON exercise_sets FOR EACH ROW
BEGIN UPDATE exercise_sets SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_meals_updated_at AFTER UPDATE ON meals FOR EACH ROW
BEGIN UPDATE meals SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_meal_items_updated_at AFTER UPDATE ON meal_items FOR EACH ROW
BEGIN UPDATE meal_items SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_ex_library_updated_at AFTER UPDATE ON exercise_library FOR EACH ROW
BEGIN UPDATE exercise_library SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_food_library_updated_at AFTER UPDATE ON food_library FOR EACH ROW
BEGIN UPDATE food_library SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

CREATE TRIGGER IF NOT EXISTS trg_daily_water_updated_at AFTER UPDATE ON daily_water FOR EACH ROW
BEGIN UPDATE daily_water SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = OLD.id; END;

-- Global exercise seeds (user_id NULL). Deduped by unique partial index above.
INSERT OR IGNORE INTO exercise_library (id, user_id, name, muscle_group) VALUES
  (lower(hex(randomblob(16))), NULL, 'Supino Reto', 'Peito'),
  (lower(hex(randomblob(16))), NULL, 'Agachamento Livre', 'Pernas'),
  (lower(hex(randomblob(16))), NULL, 'Levantamento Terra', 'Costas'),
  (lower(hex(randomblob(16))), NULL, 'Rosca Direta', 'Bíceps'),
  (lower(hex(randomblob(16))), NULL, 'Desenvolvimento com Halteres', 'Ombros');

-- Global food seeds (user_id NULL)
INSERT OR IGNORE INTO food_library (id, user_id, name, calories, protein, carbs, fat, serving_size) VALUES
  (lower(hex(randomblob(16))), NULL, 'Arroz Branco Cozido', 130, 2.7, 28.1, 0.3, 100.0),
  (lower(hex(randomblob(16))), NULL, 'Feijão Carioca Cozido', 76, 4.8, 13.6, 0.5, 100.0),
  (lower(hex(randomblob(16))), NULL, 'Peito de Frango Grelhado', 165, 31.0, 0.0, 3.6, 100.0),
  (lower(hex(randomblob(16))), NULL, 'Ovo Cozido (1 unid)', 77, 6.3, 0.6, 5.3, 50.0),
  (lower(hex(randomblob(16))), NULL, 'Aveia em Flocos', 389, 16.9, 66.3, 6.9, 100.0),
  (lower(hex(randomblob(16))), NULL, 'Leite Integral', 61, 3.2, 4.8, 3.3, 100.0);
