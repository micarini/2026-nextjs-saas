// Shared motion tokens. Keep every animation in the app reaching for
// these so timing and feel stay consistent as more screens get animated.

export const DUR = {
  instant: 0.12,
  fast: 0.2,
  base: 0.35,
  slow: 0.6,
  scene: 1.8, // a full cinematic beat, e.g. the onboarding cover-wall exit
};

export const EASE = {
  out: "power3.out",
  inOut: "power2.inOut",
  in: "power2.in",
  swirl: "power2.in",
  spring: "back.out(1.6)",
};
