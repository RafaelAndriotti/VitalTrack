/*
  ── VitalTrack · Direction contract (Vital Natural / B) ─────────────────────
  THESIS: A calm health instrument with a colour per domain. Data is the hero;
          each domain owns one hue so the day reads at a glance.
  OWN-WORLD: Warm graphite ground (#0E1214), SOLID surfaces separated by a tone
          step plus a hairline (no glass, no shadow on resting cards). Three
          domain hues, all desaturated — sage green for training, muted steel
          blue for hydration, soft amber for nutrition. Poppins, normal case,
          weight ≤700.
  REFUSES: neon-on-black (#A3E635 lime, #60A5FA, #FBBF24 at full chroma),
          glow, glass, gradients. The reference palette is kept as HUES, their
          chroma pulled down so the app reads natural instead of generated.
  SIGNATURE: "O dia em três anéis" — training, nutrition and hydration as
          concentric arcs on the home screen, each in its own hue.
  STORY: The user opens the app, reads their day at a glance, and logs with one tap.
  FORM: user-pinned direction (concept roll skipped — pinned beats the roll).
  FINISH: unreviewed and undocumented is unfinished; this build ends with the finish
          review, the verdict, and DESIGN.md.
  ─────────────────────────────────────────────────────────────────────────────
*/

export const Colors = {
  // Accent — training / primary action. Sage green: the reference lime, naturalised.
  primary: '#8FB255',
  primaryDark: '#6F8E40',
  primaryLight: '#A6C470',
  primarySoft: 'rgba(143, 178, 85, 0.14)', // tinted fill for accent chips/rows
  primaryBorder: 'rgba(143, 178, 85, 0.40)',

  // Ground + solid surfaces (no glass).
  background: '#0E1214', // warm graphite, not pure black
  surface: '#161B1D', // card
  surfaceAlt: '#1E2528', // raised / input / lighter panel
  surfaceLight: '#1E2528', // legacy alias
  border: '#262E30', // solid hairline
  borderStrong: '#343E40',

  // Text — soft, tinted toward the ground, never pure white/gray.
  text: '#E9EDEB',
  textSecondary: '#9BA5A2',
  textMuted: '#6A7471',
  textInverted: '#0C1108', // dark text on accent surfaces

  // Semantic — desaturated, not signal-neon.
  success: '#6F9E63',
  warning: '#C2924A',
  danger: '#C05C52',
  dangerSoft: 'rgba(192, 92, 82, 0.14)',
  dangerBorder: 'rgba(192, 92, 82, 0.40)',

  // Domain hues — one per area, low chroma.
  water: '#6E9AC2', // hydration, naturalised from #60A5FA
  waterSoft: 'rgba(110, 154, 194, 0.14)',
  nutrition: '#C79A4E', // calories, naturalised from #FBBF24
  nutritionSoft: 'rgba(199, 154, 78, 0.14)',

  // Macro hues — inside the nutrition family, kept apart but quiet.
  protein: '#C08E54',
  carbs: '#93A868',
  fat: '#B07C62',

  // Rings and tracks.
  track: '#232A2C',

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
  lg: 16,
  xl: 20,
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

// Elevation is for what floats (sheets, dialogs). Resting cards use a tone
// step and a hairline instead — never a shadow and a border together.
export const Elevation = {
  card: {},
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
