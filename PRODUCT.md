# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

Mobile-first priority (iOS/Android via Expo Go and device). Web is a supported but secondary target (`w` in Expo / static output). Design and test decisions favor the native mobile scene first, then adapt to web.

## Stack

Existing codebase. Front-end: React Native 0.86 + React 19, Expo Router (file-based routing, auth-group protected routes), TypeScript, `expo-secure-store` (session), `lucide-react-native` (icons), Poppins via `@expo-google-fonts`. Back-end: Node.js + Express + TypeScript (run via `tsx`), `jsonwebtoken` + `bcryptjs` auth, SQLite via `better-sqlite3` (prepared statements). Built from scratch without boilerplate frameworks.

## Users

People who want to track their training and nutrition routine in one place — logging workouts (exercises, sets, loads, reps in real time), building meals from a nutritional food library, and hitting a daily water goal. Everyday self-trackers managing fitness on their phone, primarily on mobile.

## Product Purpose

A cross-platform health & fitness app that unifies workout logging, diet tracking, and hydration in a single low-friction place. The user creates an account, records workouts live, composes meals from a food library with automatic macro calculation, and follows a daily water target. Success = the user reliably logs their day without friction and comes back.

## Positioning

All-in-one simplicity: workouts + diet + hydration in one app with fast, real-time logging — not three separate tools. This unified low-friction capture is the differentiator future work must preserve.

Serves two goals with equal weight: a portfolio-grade demonstration of craft (UI and hand-built full-stack backend) AND a genuinely usable product for real users. Neither should be sacrificed for the other.

## Operating Context

- Primary scene: on the phone, mid-routine — logging a set at the gym, a meal at the table, water through the day. Interactions must be quick and glanceable.
- Auth gate: email/password signup and login; session persisted 7 days via JWT; token stored in `expo-secure-store` on mobile, `localStorage` on web.
- Workouts: start a "workout in progress", add exercises/sets live, reusable exercise library (global + per-user), inline editing, set-complete marking, finished-workout history, ability to reopen a finished workout.
- Diet: meals logged by time, automatic calories/protein/carbs/fat calculation, food library (global + per-user) with reference portion scaled proportionally to amount eaten, daily macro summary with progress bars.
- Hydration: daily water logging with configurable goal, quick shortcuts (+250ml / +500ml) and custom amount, optimistic UI updates.

## Capabilities and Constraints

- REST API: all routes except `auth` require `Authorization: Bearer <token>`.
- Database: SQLite (local file via `better-sqlite3`), 8 related tables (`users`, `workouts`, `exercises`, `exercise_sets`, `meals`, `meal_items`, `exercise_library`, `food_library`, `daily_water`), indexes on frequent lookups, triggers auto-updating `updated_at`.
- Passwords hashed with bcrypt (salt rounds = 12).
- Optimistic UI updates used for instant response (notably hydration).
- Undecided / not yet built: macronutrient goals are currently fixed (not user-configurable), no automated tests, no pagination on workout/meal history.

## Brand Commitments

- Name: **VitalTrack**.
- Typeface: **Poppins** (`@expo-google-fonts`) — in use across the app.
- Icon set: `lucide-react-native`.
- Dark base color present in identity: `#0F172A` (Android adaptive icon background); `userInterfaceStyle` is `automatic`.

## Evidence on Hand

- Working full-stack implementation (front-end in `src/`, back-end in `server/`, DB schema in `database/` and `server/src/schema.sql` + `server/src/migration_phase2.sql`).
- Real feature set live: auth, workouts, diet, hydration, profile.
- Author: Rafael Andriotti Rebelo (LinkedIn / GitHub in README).
- No real user testimonials, usage metrics, or third-party proof exist yet — future work must not fabricate them.

## Product Principles

1. One place, low friction — logging a workout, meal, or water must be fast and glanceable, never a chore.
2. Real-time and responsive — capture happens live (workout in progress, optimistic updates); the UI must feel instant.
3. Craft and correctness together — portfolio-grade polish and a real, working hand-built stack carry equal weight.
4. Mobile is the home — design for the phone-in-hand scene first, then adapt to web.
5. Honest data — nutrition/hydration numbers are computed from real reference portions; never invent proof or metrics.

## Accessibility & Inclusion

No product-specific accessibility standard has been established yet. Content and UI are in Brazilian Portuguese.
