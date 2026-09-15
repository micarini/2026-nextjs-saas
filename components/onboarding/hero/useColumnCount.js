"use client";

import { useSyncExternalStore } from "react";

// More columns as the viewport widens, so the wall fills the screen with
// more (smaller) covers instead of stretching the same five wide. Kept as
// breakpoints rather than a continuous formula — easy to eyeball-tune.
const BREAKPOINTS = [
  { minWidth: 1920, count: 13 },
  { minWidth: 1440, count: 11 },
  { minWidth: 1024, count: 9 },
  { minWidth: 640, count: 7 },
  { minWidth: 0, count: 5 },
];

function countForWidth(width) {
  const match = BREAKPOINTS.find((bp) => width >= bp.minWidth);
  return match ? match.count : 5;
}

function subscribe(callback) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

export function useColumnCount() {
  return useSyncExternalStore(
    subscribe,
    () => countForWidth(window.innerWidth),
    () => 5 // SSR / first paint default — matches the phone breakpoint
  );
}
