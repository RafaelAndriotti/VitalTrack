/*
  ── VitalTrack · Direction contract (Clean Clínico / A) ──────────────────────
  THESIS: A calm health instrument. Data is the hero; color is earned, not sprayed.
          Refuses the neon-on-black, glassmorphism, all-pill AI-template look.
  OWN-WORLD: Warm graphite ground (#0E1214), SOLID surfaces with hairline borders
          (no translucent glass), a single vital-green accent (#3E8E7E) reserved for
          progress + primary action, calm radii (cards 14, pills only on buttons/chips),
          soft real shadows (offset + blur, never colored glow). Poppins, normal case,
          weight ≤700. Secondary text tinted, never pure gray on color.
  STORY: The user opens the app, reads their day at a glance, and logs with one tap.
  FIRST VIEWPORT: (per surface) data legible first; accent marks only what matters now.
  FORM: user-pinned direction (concept roll skipped — pinned beats the roll).
  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
          review, the verdict, and DESIGN.md.
  ─────────────────────────────────────────────────────────────────────────────
*/

export const Colors = {
  // Accent — vital green, used only for progress + primary action.
  primary: '#3E8E7E',
  primaryDark: '#2F6E61',
  primaryLight: '#5AA697',
  primarySoft: 'rgba(62, 142, 126, 0.14)', // tinted fill for accent chips/rows
  primaryBorder: 'rgba(62, 142, 126, 0.40)',

  // Ground + solid surfaces (no glass).
  background: '#0E1214', // warm graphite, not pure black
  surface: '#161C1E', // card
  surfaceAlt: '#1D2529', // raised / input / lighter panel
  surfaceLight: '#1D2529', // legacy alias
  border: '#28312F', // solid hairline
  borderStrong: '#35403D',

  // Text — soft, tinted toward the ground, never pure white/gray.
  text: '#ECEFEE',
  textSecondary: '#9EA9A5',
  textMuted: '#6B7570',
  textInverted: '#08110F', // dark text on accent surfaces

  // Semantic — desaturated, not signal-neon.
  success: '#4C9A6E',
  warning: '#C9964B',
  danger: '#C55B52',
  dangerSoft: 'rgba(197, 91, 82, 0.14)',
  dangerBorder: 'rgba(197, 91, 82, 0.40)',

  // Data hues — muted, for macro / hydration viz.
  water: '#5C9CC4',
  waterSoft: 'rgba(92, 156, 196, 0.14)',
  protein: '#6E9CC9',
  carbs: '#9CB36B',
  fat: '#C99A6E',

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
  display: 40, // big data readouts
} as const;

// Calm radii. Pills (full) reserved for buttons, chips, toggles — not cards.
export const BorderRadius = {
  sm: 8,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const Font = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

// Icons (lucide): thin, delicate stroke + a consistent size scale.
export const Icon = {
  stroke: 1.5,
  sm: 18,
  md: 20,
  lg: 24,
} as const;

// Soft, real elevation — offset + blur, neutral shadow (never a colored glow).
export const Elevation = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
