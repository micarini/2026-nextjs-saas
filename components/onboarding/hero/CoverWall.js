"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/lib/anim/gsap";
import { columns, COLUMN_COUNT } from "./covers";
import { createExitTimeline } from "./exitTimeline";
import styles from "./CoverWall.module.css";

const PER_COLUMN = 8;

export default function CoverWall({
  exiting = false,
  onExitDone,
  reducedMotion = false,
  children,
}) {
  const root = useRef(null);
  const chrome = useRef(null);
  const idleTweens = useRef([]);
  const finished = useRef(false);

  const cols = useMemo(() => columns(PER_COLUMN), []);

  // Idle drift: alternating columns scroll opposite ways, the middle
  // ones faster than the edges.
  useGSAP(
    () => {
      if (reducedMotion) return;
      const colEls = gsap.utils.toArray(
        root.current.querySelectorAll("[data-col]")
      );
      idleTweens.current = colEls.map((el, i) => {
        const up = i % 2 === 0;
        const fromEdge = Math.abs(i - (COLUMN_COUNT - 1) / 2);
        const duration = 15 + fromEdge * 7;
        gsap.set(el, { yPercent: up ? 0 : -50 });
        return gsap.to(el, {
          yPercent: up ? -50 : 0,
          duration,
          ease: "none",
          repeat: -1,
        });
      });
    },
    { scope: root, dependencies: [reducedMotion] }
  );

  // Exit: fired when `exiting` flips true (after auth succeeds).
  useGSAP(
    () => {
      if (!exiting || finished.current) return;

      const finish = () => {
        if (finished.current) return;
        finished.current = true;
        onExitDone?.();
      };

      if (reducedMotion) {
        gsap.to(root.current, {
          autoAlpha: 0,
          duration: 0.25,
          onComplete: finish,
        });
        return;
      }

      idleTweens.current.forEach((t) => t.kill());

      // Safety net: never leave the user stranded on step 1 if the
      // timeline throws or stalls.
      const guard = window.setTimeout(finish, 1800);
      const tl = createExitTimeline(gsap, {
        root: root.current,
        chrome: chrome.current,
        onComplete: () => {
          window.clearTimeout(guard);
          finish();
        },
      });
      tl.play();
    },
    { scope: root, dependencies: [exiting] }
  );

  return (
    <div ref={root} className={styles.wall}>
      <div className={styles.stage}>
        {cols.map((col, ci) => (
          <div key={ci} data-col className={styles.column}>
            {[...col, ...col].map((cover, i) => (
              <div
                key={`${ci}-${i}`}
                data-book
                data-hero={cover.hero ? "true" : "false"}
                className={styles.book}
              >
                <div className={`${styles.face} ${styles.front}`} data-front>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cover.src}
                    alt=""
                    width="92"
                    height="138"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                {cover.hero ? (
                  <div className={styles.spine} data-spine>
                    <span className={styles.spineText}>{cover.title}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ))}
        <div className={styles.dust} data-dust />
      </div>

      <div className={styles.veil} data-veil />

      <div ref={chrome} className={styles.chrome}>
        {children}
      </div>
    </div>
  );
}
