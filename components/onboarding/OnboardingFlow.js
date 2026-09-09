"use client";

import { useEffect, useState, useTransition } from "react";
import { signInWithPopup } from "firebase/auth";
import { getClientAuth, getGoogleProvider } from "@/lib/firebase/client";
import { TASTE_TAGS } from "@/lib/books/tasteTags";
import { useReducedMotion } from "@/lib/anim/useReducedMotion";
import CoverWall from "@/components/onboarding/hero/CoverWall";

const DEFAULT_GOAL = 12;

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3.02h3.87c2.27-2.09 3.58-5.17 3.58-8.84z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3.02c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.62H1.27a12 12 0 0 0 0 10.76l4-3.11z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.62l4 3.11C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function StepDots({ step }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1.5 rounded-full transition-all ${
            n === step ? "w-7 bg-[#C9E265]" : "w-1.5 bg-white/25"
          }`}
        />
      ))}
    </div>
  );
}

export default function OnboardingFlow({ startAuthenticated, finishAction, skipAction }) {
  const [step, setStep] = useState(startAuthenticated ? 2 : 1);
  const [authError, setAuthError] = useState("");
  const [exiting, setExiting] = useState(false);
  const [genres, setGenres] = useState(new Set());
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [isPending, startTransition] = useTransition();
  const reducedMotion = useReducedMotion();

  // Dev-only: lets you preview the cover-wall exit without going through
  // the Google popup — `window.dispatchEvent(new Event("quire:demo-exit"))`.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const trigger = () => setExiting(true);
    window.addEventListener("quire:demo-exit", trigger);
    return () => window.removeEventListener("quire:demo-exit", trigger);
  }, []);

  async function handleGoogleSignIn() {
    setAuthError("");

    try {
      await signInWithPopup(getClientAuth(), getGoogleProvider());

      const idToken = await getClientAuth().currentUser.getIdToken();
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("We couldn't create your session. Please try again.");
      }

      // Hand off to the cover-wall exit animation; it advances to step 2
      // when it finishes (or immediately, under reduced motion).
      setExiting(true);
    } catch (err) {
      setAuthError(err.message || "We couldn't sign you in with Google. Please try again.");
    }
  }

  function toggleGenre(tag) {
    setGenres((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  }

  function submit(action, includeGoal) {
    startTransition(async () => {
      const formData = new FormData();
      genres.forEach((tag) => formData.append("genres", tag));
      if (includeGoal) {
        formData.set("goal", String(goal));
      }
      await action(formData);
    });
  }

  return (
    <main
      className={`relative flex min-h-screen flex-col bg-[#322F7A] px-5 pb-10 pt-6 text-white ${
        step === 1 ? "overflow-hidden" : ""
      }`}
    >
      <div className="relative z-20">
        <StepDots step={step} />
      </div>

      {step === 1 ? (
        <CoverWall
          exiting={exiting}
          reducedMotion={reducedMotion}
          onExitDone={() => setStep(2)}
        >
          <div className="mx-auto flex w-full max-w-md flex-col">
            <div className="mb-5 flex items-end gap-1.5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-white/15 bg-[#26235F] font-[family-name:var(--font-bricolage)] text-[26px] font-bold leading-none shadow-lg shadow-black/20">
                Q
              </span>
              <span className="mb-1.5 size-1.5 rounded-full bg-[#C9E265]" />
            </div>

            <p className="mb-5 font-[family-name:var(--font-bricolage)] text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-wrap-balance">
              Everything you read, gathered.
            </p>

            {authError ? (
              <p className="mb-3 font-[family-name:var(--font-instrument)] text-sm text-red-200">
                {authError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white font-[family-name:var(--font-instrument)] text-base font-semibold text-[#1C1B1F] transition hover:bg-white/90"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </div>
        </CoverWall>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-1 flex-col">
          <p className="mt-10 font-[family-name:var(--font-jetbrains)] text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/50">
            Step 2 of 3
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-bricolage)] text-4xl font-bold leading-[1] tracking-[-0.025em]">
            What do you reach for?
          </h1>

          <p className="mt-3 font-[family-name:var(--font-instrument)] text-[14.5px] text-white/60">
            Pick a few. It only shapes what we suggest.
          </p>

          <div className="mt-8 flex flex-wrap gap-2.5">
            {TASTE_TAGS.map((tag) => {
              const selected = genres.has(tag.label);
              return (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => toggleGenre(tag.label)}
                  className={`rounded-full px-4 py-2.5 font-[family-name:var(--font-instrument)] text-[14.5px] font-semibold transition ${
                    selected
                      ? "bg-[#C9E265] text-[#1C1B1F]"
                      : "border border-white/25 text-white/80 hover:border-white/50"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setStep(3)}
            className="h-14 w-full rounded-full bg-[#C9E265] font-[family-name:var(--font-instrument)] text-base font-semibold text-[#1C1B1F] transition hover:brightness-95"
          >
            Continue
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-1 flex-col">
          <p className="mt-10 font-[family-name:var(--font-jetbrains)] text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/50">
            Step 3 of 3 · Optional
          </p>

          <h1 className="mt-3 font-[family-name:var(--font-bricolage)] text-4xl font-bold leading-[1.05] tracking-[-0.025em]">
            Want a number to chase?
          </h1>

          <p className="mt-3 font-[family-name:var(--font-instrument)] text-[14.5px] text-white/60">
            You can set this later, or never. Reading isn&apos;t homework.
          </p>

          <div className="mt-14 flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={() => setGoal((n) => Math.max(1, n - 1))}
              aria-label="Decrease"
              className="flex size-11 items-center justify-center rounded-full border border-white/25 text-2xl transition hover:border-white/50"
            >
              &minus;
            </button>

            <span className="font-[family-name:var(--font-jetbrains)] text-6xl font-medium tabular-nums tracking-[-0.02em]">
              {goal}
            </span>

            <button
              type="button"
              onClick={() => setGoal((n) => n + 1)}
              aria-label="Increase"
              className="flex size-11 items-center justify-center rounded-full border border-white/25 text-2xl transition hover:border-white/50"
            >
              +
            </button>
          </div>

          <p className="mt-3 text-center font-[family-name:var(--font-jetbrains)] text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/50">
            Books in 2026
          </p>

          <div className="flex-1" />

          <button
            type="button"
            disabled={isPending}
            onClick={() => submit(finishAction, true)}
            className="h-14 w-full rounded-full bg-[#C9E265] font-[family-name:var(--font-instrument)] text-base font-semibold text-[#1C1B1F] transition hover:brightness-95 disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Start reading"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => submit(skipAction, false)}
            className="mt-4 font-[family-name:var(--font-instrument)] text-sm font-medium text-white/60 transition hover:text-white disabled:opacity-60"
          >
            Skip for now
          </button>
        </div>
      ) : null}
    </main>
  );
}
