-- Migrations para a Fase 2: Bibliotecas, Horários e Água
-- Execute este script no SQL Editor do Supabase

-- 1. Adicionar coluna time em meals (horário da refeição)
ALTER TABLE meals ADD COLUMN IF NOT EXISTS time TIME;

-- 2. Tabela de Biblioteca de Exercícios
CREATE TABLE IF NOT EXISTS exercise_library (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL significa global
  name         VARCHAR(255) NOT NULL,
  muscle_group VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ex_library_user_id ON exercise_library(user_id);

CREATE OR REPLACE TRIGGER trg_ex_library_updated_at
  BEFORE UPDATE ON exercise_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Tabela de Biblioteca de Alimentos
CREATE TABLE IF NOT EXISTS food_library (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL significa global
  name         VARCHAR(255) NOT NULL,
  calories     INTEGER NOT NULL DEFAULT 0,
  protein      NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  carbs        NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  fat          NUMERIC(6, 2) NOT NULL DEFAULT 0.0,
  serving_size NUMERIC(7, 2) NOT NULL DEFAULT 100.0, -- em gramas/ml
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_library_user_id ON food_library(user_id);

CREATE OR REPLACE TRIGGER trg_food_library_updated_at
  BEFORE UPDATE ON food_library
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Tabela de Consumo de Água
CREATE TABLE IF NOT EXISTS daily_water (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml  INTEGER NOT NULL DEFAULT 0,
  goal_ml    INTEGER NOT NULL DEFAULT 2000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_water_user_date ON daily_water(user_id, date);

CREATE OR REPLACE TRIGGER trg_daily_water_updated_at
  BEFORE UPDATE ON daily_water
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Popular a biblioteca global com exercícios básicos (caso não existam)
INSERT INTO exercise_library (user_id, name, muscle_group)
SELECT NULL, 'Supino Reto', 'Peito'
WHERE NOT EXISTS (SELECT 1 FROM exercise_library WHERE name = 'Supino Reto' AND user_id IS NULL);

INSERT INTO exercise_library (user_id, name, muscle_group)
SELECT NULL, 'Agachamento Livre', 'Pernas'
WHERE NOT EXISTS (SELECT 1 FROM exercise_library WHERE name = 'Agachamento Livre' AND user_id IS NULL);

INSERT INTO exercise_library (user_id, name, muscle_group)
SELECT NULL, 'Levantamento Terra', 'Costas'
WHERE NOT EXISTS (SELECT 1 FROM exercise_library WHERE name = 'Levantamento Terra' AND user_id IS NULL);

INSERT INTO exercise_library (user_id, name, muscle_group)
SELECT NULL, 'Rosca Direta', 'Bíceps'
WHERE NOT EXISTS (SELECT 1 FROM exercise_library WHERE name = 'Rosca Direta' AND user_id IS NULL);

INSERT INTO exercise_library (user_id, name, muscle_group)
SELECT NULL, 'Desenvolvimento com Halteres', 'Ombros'
WHERE NOT EXISTS (SELECT 1 FROM exercise_library WHERE name = 'Desenvolvimento com Halteres' AND user_id IS NULL);

-- 6. Popular a biblioteca global com alimentos básicos (caso não existam)
INSERT INTO food_library (user_id, name, calories, protein, carbs, fat, serving_size)
SELECT NULL, 'Arroz Branco Cozido', 130, 2.7, 28.1, 0.3, 100.0
WHERE NOT EXISTS (SELECT 1 FROM food_library WHERE name = 'Arroz Branco Cozido' AND user_id IS NULL);

INSERT INTO food_library (user_id, name, calories, protein, carbs, fat, serving_size)
SELECT NULL, 'Feijão Carioca Cozido', 76, 4.8, 13.6, 0.5, 100.0
WHERE NOT EXISTS (SELECT 1 FROM food_library WHERE name = 'Feijão Carioca Cozido' AND user_id IS NULL);

INSERT INTO food_library (user_id, name, calories, protein, carbs, fat, serving_size)
SELECT NULL, 'Peito de Frango Grelhado', 165, 31.0, 0.0, 3.6, 100.0
WHERE NOT EXISTS (SELECT 1 FROM food_library WHERE name = 'Peito de Frango Grelhado' AND user_id IS NULL);

INSERT INTO food_library (user_id, name, calories, protein, carbs, fat, serving_size)
SELECT NULL, 'Ovo Cozido (1 unid)', 77, 6.3, 0.6, 5.3, 50.0
WHERE NOT EXISTS (SELECT 1 FROM food_library WHERE name = 'Ovo Cozido (1 unid)' AND user_id IS NULL);

INSERT INTO food_library (user_id, name, calories, protein, carbs, fat, serving_size)
SELECT NULL, 'Aveia em Flocos', 389, 16.9, 66.3, 6.9, 100.0
WHERE NOT EXISTS (SELECT 1 FROM food_library WHERE name = 'Aveia em Flocos' AND user_id IS NULL);

INSERT INTO food_library (user_id, name, calories, protein, carbs, fat, serving_size)
SELECT NULL, 'Leite Integral', 61, 3.2, 4.8, 3.3, 100.0
WHERE NOT EXISTS (SELECT 1 FROM food_library WHERE name = 'Leite Integral' AND user_id IS NULL);
