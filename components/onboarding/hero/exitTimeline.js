// Builds the paused "press the button and the wall comes apart" timeline.
// Kept separate from CoverWall so the choreography is readable in one
// place. Called from inside a useGSAP scope; every tween it creates is
// cleaned up with that scope.

const SWIRL_RAD = 0.85; // tangential kick that turns the scatter into a vortex

export function createExitTimeline(gsap, { root, chrome, onComplete }) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = vw / 2;
  const cy = vh / 2;

  const all = gsap.utils.toArray(root.querySelectorAll("[data-book]"));
  const heroes = all.filter((el) => el.dataset.hero === "true");
  const rest = all.filter((el) => el.dataset.hero !== "true");
  const dust = root.querySelector("[data-dust]");
  const veil = root.querySelector("[data-veil]");

  // Snapshot on-screen geometry now, before anything moves.
  const rect = new Map();
  for (const el of all) {
    const r = el.getBoundingClientRect();
    rect.set(el, {
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      w: r.width,
      left: r.left,
    });
  }

  const spiral = (el) => {
    const { cx: bx, cy: by } = rect.get(el);
    const ang = Math.atan2(by - cy, bx - cx) + SWIRL_RAD;
    const dist = Math.hypot(bx - cx, by - cy) * 1.12 + 150;
    return { x: cx + Math.cos(ang) * dist - bx, y: cy + Math.sin(ang) * dist - by };
  };

  const tl = gsap.timeline({ paused: true, onComplete });

  // Caption + button lift away first; the readability veil fades with
  // them so the hero spines read cleanly against the covers.
  if (chrome) {
    tl.to(chrome, { y: -24, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 0);
  }
  if (veil) {
    tl.to(veil, { autoAlpha: 0.12, duration: 0.5, ease: "power1.out" }, 0.2);
  }

  // Vortex — non-hero covers spiral outward, fading only once they're
  // already moving so the swirl is legible.
  tl.to(
    rest,
    {
      x: (i, el) => spiral(el).x,
      y: (i, el) => spiral(el).y,
      rotationZ: () => gsap.utils.random(-160, 160),
      scale: 0.62,
      duration: 1.0,
      ease: "power1.in",
      stagger: { amount: 0.4, from: "center", grid: "auto" },
    },
    0.05
  );
  tl.to(
    rest,
    {
      autoAlpha: 0,
      duration: 0.5,
      stagger: { amount: 0.4, from: "center", grid: "auto" },
    },
    0.6
  );

  // Dust kicked up where the wall broke.
  if (dust) {
    tl.fromTo(
      dust,
      { scale: 0.3, autoAlpha: 0 },
      { scale: 2.6, autoAlpha: 0.5, duration: 0.45, ease: "power2.out" },
      0.1
    ).to(dust, { autoAlpha: 0, duration: 0.5 }, 0.42);
  }

  // Hero books: gather off the left edge, cross-fade the cover to a
  // spine strip, then sweep across the screen and out to the right.
  if (heroes.length) {
    const fronts = heroes.map((el) => el.querySelector("[data-front]"));
    const spines = heroes.map((el) => el.querySelector("[data-spine]"));

    tl.set(heroes, { zIndex: 60, transformOrigin: "50% 50%" }, 0);
    tl.to(
      heroes,
      {
        x: (i, el) => -rect.get(el).left - 130,
        y: (i, el) => vh * 0.5 - rect.get(el).cy,
        scale: 1.18,
        duration: 0.38,
        ease: "power2.out",
        stagger: 0.05,
      },
      0.1
    );
    tl.to(fronts, { autoAlpha: 0, duration: 0.24, stagger: 0.04 }, 0.16);
    tl.to(spines, { autoAlpha: 1, duration: 0.24, stagger: 0.04 }, 0.2);
    tl.to(
      heroes,
      {
        x: () => vw + 170,
        y: () => `+=${gsap.utils.random(-26, 26)}`,
        rotationZ: () => gsap.utils.random(-6, 6),
        duration: 0.8,
        ease: "power1.inOut",
        stagger: 0.11,
      },
      0.4
    );
    tl.to(heroes, { autoAlpha: 0, duration: 0.18 }, 1.08);
  }

  return tl;
}
