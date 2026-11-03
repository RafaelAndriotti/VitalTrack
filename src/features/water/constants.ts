import { CupSoda, GlassWater, Milk } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

export const DEFAULT_WATER_GOAL = 2000;
// Limite aceito pelo backend para amount_ml/goal_ml.
export const MAX_WATER_ML = 50000;

// Cada quantidade é um recipiente que armazena água: ícone, nome e capacidade.
export type Recipiente = { ml: number; label: string; icon: LucideIcon };

export const RECIPIENTES: Recipiente[] = [
  { ml: 100, label: 'Dose', icon: CupSoda },
  { ml: 200, label: 'Copo pequeno', icon: GlassWater },
  { ml: 250, label: 'Copo', icon: GlassWater },
  { ml: 300, label: 'Copo grande', icon: GlassWater },
  { ml: 500, label: 'Garrafa', icon: Milk },
  { ml: 750, label: 'Garrafa grande', icon: Milk },
  { ml: 1000, label: 'Garrafão', icon: Milk },
];
