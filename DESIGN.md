# Design

<!-- impeccable:design-schema 1 -->

Visual world: **Clean Clínico (A)** — a calm health instrument. Data is the hero; color is
earned, not sprayed. Deliberately refuses the previous neon-lime-on-black, glassmorphism,
all-pill "AI template" look. Platform: adaptive (Expo · iOS/Android/Web), mobile-first.

Source of truth for tokens: `src/constants/theme.ts`. Shared primitives: `src/components/ui.tsx`.

## Color

Strategy: **Restrained** — warm graphite neutrals + a single vital-green accent. Dark base,
chosen for the use scene (phone in hand at the gym / kitchen, mixed light).

- Ground `#0E1214` · Surface `#161C1E` · Surface raised/input `#1D2529`
- Border `#28312F` (solid 1px hairline) · Border strong `#35403D`
- Text `#ECEFEE` · Secondary `#9EA9A5` · Muted `#6B7570` · On-accent `#08110F`
- Accent (vital green) `#3E8E7E` — reserved for progress + primary action only.
  Soft fill `primarySoft` / border `primaryBorder` for accent chips & rows.
- Semantic (desaturated, never neon): success `#4C9A6E`, warning `#C9964B`, danger `#C55B52`.
- Data hues (muted): water `#5C9CC4`, protein `#6E9CC9`, carbs `#9CB36B`, fat `#C99A6E`.

Secondary text on colored surfaces is tinted from the ground, never pure gray.

## Type

Poppins (brand commitment), normal case, weight ≤700. Roles in `Font`: regular/medium/
semibold/bold. No uppercase + letter-spacing labels (a tell of the old look). Big data
readouts use `FontSize.display` (40) bold with -1 letter-spacing.

## Shape & depth

- Radii (`BorderRadius`): cards `lg` 14, inputs/panels `md` 10, sheets `xl` 18.
  Pills (`full`) are reserved for buttons, chips, toggles — **never cards**.
- Elevation (`Elevation.card` / `.raised`): soft neutral shadow with offset + blur.
  No colored glow, no zero-offset halo.
- Surfaces are **solid**. No translucent white "glass" fills or borders anywhere.

## Icons

lucide-react-native, thin & delicate: `strokeWidth = Icon.stroke` (1.5), sizes
`Icon.sm/md/lg` (18/20/24). One consistent stroke across the app.

## Components (`src/components/ui.tsx`)

`Screen` (scroll container, 600px max, centered), `Card` (solid surface + hairline +
soft shadow), `SectionHeader`, `ProgressBar` (real data only — track `surfaceAlt`,
tinted fill), `Button` (primary/ghost/danger, no uppercase), `ErrorBanner`, `EmptyState`,
`Loading`.

## Navigation

Bottom tabs (`src/app/(tabs)/_layout.tsx`), 5 areas — **one screen per function**:
Início (`home`, dashboard) · Treinos · Dieta · Hidratação · Perfil. Active tint = accent,
inactive = muted. Solid header/tab bar with hairline borders, no shadow.

- **Início** — greeting + today at a glance: active-workout hero (or start shortcut),
  calories and hydration summary cards with progress; each taps into its area.
- **Dieta** — macro summary + meals only (hydration moved out to its own tab).
- **Hidratação** — big ml readout, goal, progress, quick add (−250 / +250 / +500 / +750),
  custom amount. Optimistic updates.

## Principles

- Data legible first; accent marks only what matters now.
- Honest data only — no fabricated metrics, streaks, or "premium" proof.
- Every progress bar/number is tied to real API data.
- Preserve product truth, content, and all working behavior; this was a visual redesign,
  not a functional change.
