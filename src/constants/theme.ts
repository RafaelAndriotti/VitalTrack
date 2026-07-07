export const Colors = {
  primary: '#D2FF3A', // Neon Green
  primaryDark: '#B4E612', 
  primaryLight: '#E4FF7A',
  background: '#09090B', // Deep black
  surface: '#18181B', // Dark gray card
  surfaceLight: '#27272A', // Lighter gray
  text: '#FAFAFA', // Pure white
  textSecondary: '#A1A1AA', // Light gray
  textMuted: '#71717A',
  textInverted: '#09090B', // Dark text for neon backgrounds
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  border: '#27272A',
  white: '#FFFFFF',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
