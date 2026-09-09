// Central GSAP entry point. Import `gsap` / `useGSAP` from here (never
// straight from "gsap") so plugin registration and defaults live in one
// place.
"use client";

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { Flip } from "gsap/Flip";

// Flip is registered now for future shared-element page transitions; the
// onboarding hero doesn't use it yet.
gsap.registerPlugin(useGSAP, Flip);

gsap.defaults({ ease: "power3.out", duration: 0.35 });

export { gsap, useGSAP, Flip };
