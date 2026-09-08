# Onboarding cover-wall animation — design

Date: 2026-09-08
Status: approved, implementing

## Goal

Replace the plain text hero of onboarding **step 1** with an immersive,
diagonally-scrolling wall of book covers. When the user presses
*Continue with Google* (and auth succeeds), the covers scatter in a
swirl, a handful of "hero" books rotate to show their spine and travel
across the screen, everything exits, and we advance to step 2.

Also land a small **reusable animation base** (`lib/anim/`) the rest of
the app can build on later.

## Decisions (locked with user)

- **Tech:** GSAP interpretation + CSS 3D transforms. No WebGL, no
  physics engine, no real particle system.
- **Library:** GSAP only (`gsap` + `@gsap/react`'s `useGSAP`). `Flip`
  plugin registered for future page transitions. No Motion / Framer
  Motion.
- **Scope:** onboarding hero + `lib/anim/` base. ScrollTrigger work,
  Flip shared-element page transitions, and dashboard stagger-in are
  explicit follow-ups (not this change).
- **Covers:** curated fixed set bundled in the repo under
  `public/onboarding/covers/`. Sourced once from the Open Library
  covers API by a setup script, committed as static assets. No runtime
  network calls.
- **Layout:** immersive like the reference video — covers full-bleed,
  small caption + button pinned to the bottom, the big `text-5xl`
  headline is dropped.
- **Caption copy (English):** "Everything you read, gathered."
- **Auth flow unchanged:** `signInWithPopup`; the page never
  navigates. Exit animation plays *after* auth + session succeed, then
  `setStep(2)`.

## Architecture

### Dependencies / setup

- Add `gsap` and `@gsap/react` to `dependencies`.
- `lib/anim/gsap.js` — imports gsap, registers `useGSAP` + `Flip`,
  sets `gsap.defaults`, exports the configured `gsap` and `useGSAP`.
- `lib/anim/tokens.js` — shared `DUR` (durations) and `EASE` (easings)
  so app animation feels consistent. The reusable base.
- `lib/anim/useReducedMotion.js` — hook over
  `matchMedia("(prefers-reduced-motion: reduce)")`, SSR-safe
  (returns `false` until mounted).

### Assets

- `scripts/fetch-onboarding-covers.mjs` — one-off Node script. Reads a
  hardcoded list of ~36 `{ id, title, author }` Open Library cover
  ids, downloads `-M` jpgs (follow redirects), runs them through
  `sips` to width ~160 / reduced quality, writes
  `public/onboarding/covers/NN.jpg`. Committed output; script kept for
  reproducibility.
- `components/onboarding/hero/covers.js` — manifest:
  `[{ src, title, author, hero?: true }]`. ~4 entries flagged `hero`.

### Components

```
components/onboarding/
  OnboardingFlow.js          (existing — small changes)
  hero/
    CoverWall.js             diagonal wall; owns all GSAP
    CoverWall.module.css     grid, -16deg rotation, perspective, 3D faces
    useCoverWallTimeline.js  builds the paused exit timeline; returns { play }
    covers.js                manifest
```

**CoverWall.js**

- Props: `exiting: boolean`, `onExitDone: () => void`.
- Rotated container: `rotate(-16deg) scale(1.35)`, `perspective:
  1200px`, `transform-style: preserve-3d`, `overflow: hidden` on the
  outer wrapper.
- 5 columns. Each column: a flex-column stack of covers, duplicated
  ×2 for a seamless loop.
- Each cell `.book` (`preserve-3d`): `.face--front` = `<img>`. Cells
  with `hero` also render `.face--spine` — a thin strip,
  `rotateY(90deg) translateZ(...)`, vertical title/author text.
  Non-hero cells are front-only.
- **Idle loop** (in `useGSAP`, on mount): one tween per column,
  `yPercent: 0 -> -50` (odd columns `+50`), `repeat: -1`, `ease:
  "none"`. Center columns ~18s, outer ~30s → "more movement in the
  middle". Skipped entirely under reduced motion.
- When `exiting` flips true: call the timeline's `play()`. A safety
  `setTimeout(onExitDone, 1800)` guarantees progress even if GSAP
  throws.

**useCoverWallTimeline.js**

Builds a paused `gsap.timeline({ onComplete: onExitDone })`:

1. `t=0` — `gsap.killTweensOf` the columns; the wall freezes.
2. **Swirl** (~0.9s) — every `.book` to a polar target around screen
   centre: `angle = base + spin`, `radius` beyond the viewport,
   `rotationZ` random ±180, `scale` 0.6, `autoAlpha` 0 at the end.
   `stagger: { each: 0.015, from: "center" }`, `ease: "power2.in"`.
3. **Hero spines** (overlap, ~1.1s) — the ~4 hero books instead:
   `rotationY: 90` then travel `x` from left edge to right edge,
   slight `y` drift, `rotationY -> 270`, `autoAlpha: 0` at the right
   edge. `stagger: 0.12`.
4. **Dust** (optional, `t~0.15`) — one radial sprite `scale 0 -> 3`,
   `autoAlpha 0.7 -> 0`, 0.6s. Cut if it doesn't earn its weight.
5. **Chrome** (`t~0.1`) — caption + button `y: -20, autoAlpha: 0`.
   Indigo backdrop stays.

Total ~1.6–2.0s. Exposes `{ play }`.

**OnboardingFlow.js changes**

- New state `exiting`.
- `handleGoogleSignIn`: on `signInWithPopup` + session-fetch success,
  set `exiting = true` instead of `setStep(2)`. `onExitDone` runs
  `setStep(2)`. On failure: no animation, error shown as today.
- `startAuthenticated` (lands on step 2 directly) → `CoverWall` never
  mounts.
- Step 1 markup reworked to immersive: `CoverWall` absolutely
  positioned full-bleed; gradient overlay (transparent →
  `#322F7A`/85% at the bottom) for legibility; kicker + one-line
  caption + existing Google button pinned to the bottom.
- Reduced motion: `onExitDone` fires after a 250ms opacity crossfade
  instead of the full timeline.

### Data flow

No backend changes. No new network calls at runtime. Auth path
unchanged. Only new coupling: `OnboardingFlow` → `CoverWall` via
`exiting` + `onExitDone`; `CoverWall` owns all GSAP.

## Performance

- ~36 `<img>`, width ~160 jpg, `loading="eager"`, `decoding="async"`,
  explicit `width`/`height`.
- Animate only `transform` / `opacity`. `will-change: transform` on
  `.book` only during the exit (GSAP adds/removes).
- DOM: 5 cols × ~9 covers × 2 ≈ ~90 nodes.
- `useGSAP` context cleans up every tween on unmount.

## Reduced motion / failure

- `prefers-reduced-motion: reduce`: static wall (no idle loop);
  button → 250ms crossfade to step 2. No swirl, no spines, no dust.
- GSAP load/exec failure: `setTimeout(onExitDone, 1800)` safety net so
  the user is never stuck on step 1.

## Testing

Project has no test runner; verification matches existing practice
(`npm run lint` + manual). Manual matrix:

- Desktop + mobile viewport, CPU throttle 4×.
- `prefers-reduced-motion` on / off.
- Auth success, auth failure, already-authenticated deep-link to
  step 2.
- Confirm exit sequence stays within ~2s and step 2 always appears.

## Out of scope (YAGNI)

WebGL; physics; real particle system (dust is one sprite or cut);
3D spine on all covers (only ~4); sound; Motion library; ScrollTrigger;
Flip page transitions; dashboard stagger-in.
