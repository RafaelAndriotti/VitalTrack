/*
  ── VitalTrack · Direction contract (Vital Pulse / C) ───────────────────────
  THESIS: An app that makes you want to log the day. Data is the hero, and it
          is lit: each domain owns one vivid hue so progress jumps off the screen.
  OWN-WORLD: Near-black graphite ground (#0B0D10, the reference's #11141B
          family), SOLID surfaces one tone step up. The reference palette at full
          strength — coral #FF5B3A for training and the primary action, blue
          #60A5FA for hydration, amber #FBBF24 for nutrition. Poppins, normal
          case, weight ≤700. Big readouts, thick rings, one strong action.
  ALLOWS: a soft glow in the accent hue on the one primary action per screen —
          the reference's "Start" button. Nowhere else.
  REFUSES: gradients, glass, glow on resting cards, photos or numbers the user
          did not produce. Colour sits on data and on the action, not on chrome.
  SIGNATURE: "O dia em três anéis" — training, nutrition and hydration as
          concentric arcs on the home screen, each in its own hue; the week strip
          and the streak above it turn a single day into a habit.
  HISTORY: B (Vital Natural, desaturated) read as washed out to the owner; this
          contract replaces it on his request. Later, at the owner's request, the
          lime accent was swapped for coral to cut the default-palette / "AI" look;
          error red is now crimson #E2445C, always paired with an icon or text.
  STORY: The user opens the app, reads their day at a glance, and logs with one tap.
  FORM: user-pinned direction (concept roll skipped — pinned beats the roll).
  ─────────────────────────────────────────────────────────────────────────────
*/

export const Colors = {
  // Accent — training / primary action. Coral, a custom vivid hue (not a Tailwind default).
  primary: '#FF5B3A',
  primaryDark: '#E8431F',
  primaryLight: '#FF8466',
  primarySoft: 'rgba(255, 91, 58, 0.14)', // tinted fill for accent chips/rows
  primaryBorder: 'rgba(255, 91, 58, 0.45)',

  // Ground + solid surfaces (no glass).
  background: '#0B0D10', // near-black graphite
  surface: '#15181D', // card
  surfaceAlt: '#1D2128', // raised / input / lighter panel
  surfaceLight: '#1D2128', // legacy alias
  border: '#252A32', // solid hairline
  borderStrong: '#323844',

  // Text — near-white ink; grey only for secondary notes.
  text: '#F4F6F8',
  textSecondary: '#AEB4BE',
  textMuted: '#707784',
  textInverted: '#0B0D10', // dark text on accent surfaces

  // Semantic.
  success: '#4ADE80',
  warning: '#FBBF24',
  // Error — crimson pulled toward pink, kept apart from the coral accent.
  danger: '#E2445C',
  dangerSoft: 'rgba(226, 68, 92, 0.14)',
  dangerBorder: 'rgba(226, 68, 92, 0.45)',

  // Domain hues — the reference palette.
  water: '#60A5FA',
  waterSoft: 'rgba(96, 165, 250, 0.16)',
  nutrition: '#FBBF24',
  nutritionSoft: 'rgba(251, 191, 36, 0.16)',

  // Macro hues — three distinct hues so each ring reads apart at a glance.
  protein: '#9B8CFF', // lavender; moved off orange so it does not sit next to the coral accent
  carbs: '#FDE047',
  fat: '#F472B6',

  // Rings and tracks.
  track: '#22262E',

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
// `glow` is the one exception: the primary action of a screen, in the accent hue.
export const Elevation = {
  card: {},
  glow: {
    shadowColor: '#FF5B3A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;
