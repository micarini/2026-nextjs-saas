"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
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

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" strokeLinecap="round" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 5 8.5 8a10.8 10.8 0 0 1-2 4.2" strokeLinecap="round" />
        <path d="M6.2 6.2C4.1 7.7 3.5 10 3.5 12c0 3 3.5 8 8.5 8a8.8 8.8 0 0 0 3.1-.6" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EmailErrorMessage(err) {
  if (err.code === "auth/email-already-in-use") {
    return "There is already an account with this email.";
  }
  if (err.code === "auth/invalid-credential") {
    return "Incorrect email or password.";
  }
  if (err.code === "auth/weak-password") {
    return "Your password must contain at least 6 characters.";
  }
  if (err.code === "auth/invalid-email") {
    return "Please enter a valid email address.";
  }
  if (err.code === "auth/operation-not-allowed") {
    // Config issue, not a user mistake: the Email/Password provider is
    // off in Firebase Console → Authentication → Sign-in method.
    return "Email sign-in isn't turned on for this project yet.";
  }
  return err.message || "Something went wrong. Please try again.";
}

// On mobile, the on-screen keyboard can cover an input pinned near the
// bottom of the screen. Nudge the focused field back into view once the
// keyboard has finished animating in. Skipped on mouse/trackpad devices —
// there's no keyboard to dodge there, and it would just be an
// unexplained jump.
function scrollFieldIntoView(event) {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;

  const el = event.currentTarget;
  window.setTimeout(() => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 300);
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

export default function OnboardingFlow({
  startAuthenticated,
  finishAction,
  skipAction,
  checkOnboardingStatusAction,
}) {
  const router = useRouter();
  const [step, setStep] = useState(startAuthenticated ? 2 : 1);
  const [authView, setAuthView] = useState("start"); // "start" | "email"
  const [emailMode, setEmailMode] = useState("signin"); // "signin" | "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthing, setIsAuthing] = useState(false);
  const [authError, setAuthError] = useState("");
  const [exiting, setExiting] = useState(false);
  const [postAuthTarget, setPostAuthTarget] = useState("step2"); // "step2" | "dashboard"
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

  // Shared tail for both Google and email auth: persist the session, work
  // out whether this person already finished onboarding, then hand off to
  // the cover-wall exit animation. onExitDone reads postAuthTarget to
  // either resume onboarding at step 2 or skip straight to the dashboard.
  async function completeAuth() {
    // Force-refresh: a display name set moments ago (email sign-up) needs
    // a fresh token before its claim shows up server-side.
    const idToken = await getClientAuth().currentUser.getIdToken(true);
    const response = await fetch("/api/session/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error("We couldn't create your session. Please try again.");
    }

    const { completed } = await checkOnboardingStatusAction();
    setPostAuthTarget(completed ? "dashboard" : "step2");
    setExiting(true);
  }

  async function handleGoogleSignIn() {
    setAuthError("");
    setIsAuthing(true);

    try {
      await signInWithPopup(getClientAuth(), getGoogleProvider());
      await completeAuth();
    } catch (err) {
      setAuthError(err.message || "We couldn't sign you in with Google. Please try again.");
    } finally {
      setIsAuthing(false);
    }
  }

  async function handleEmailSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setIsAuthing(true);

    try {
      const auth = getClientAuth();

      if (emailMode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      await completeAuth();
    } catch (err) {
      setAuthError(EmailErrorMessage(err));
    } finally {
      setIsAuthing(false);
    }
  }

  function openEmailView() {
    setAuthError("");
    setAuthView("email");
  }

  function backToStart() {
    setAuthError("");
    setAuthView("start");
  }

  function toggleEmailMode() {
    setAuthError("");
    setEmailMode((mode) => (mode === "signin" ? "signup" : "signin"));
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

  // Live validation feedback for the email form — computed every render,
  // cheap, and only ever shown once the person has actually typed something.
  const emailTyped = email.length > 0;
  const emailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordTyped = password.length > 0;
  const passwordLongEnough = password.length >= 6;

  return (
    <main
      className={`relative flex min-h-dvh flex-col bg-[#322F7A] px-5 pb-10 pt-6 text-white ${
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
          onExitDone={() => {
            if (postAuthTarget === "dashboard") {
              router.push("/dashboard");
            } else {
              setStep(2);
            }
          }}
        >
          <div className="mx-auto flex w-full max-w-md flex-col">
            {authView === "start" ? (
              <>
                <div className="mb-5">
                  <span className="relative flex size-12 items-center justify-center rounded-xl bg-[#26235F] pr-[3px] shadow-lg shadow-black/20">
                    <span className="translate-y-px font-[family-name:var(--font-bricolage)] text-[24px] font-bold leading-none">
                      Q
                    </span>
                    <span className="absolute bottom-2 right-2 size-2 rounded-full bg-[#C9E265]" />
                  </span>
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
                  disabled={isAuthing}
                  className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-white font-[family-name:var(--font-instrument)] text-base font-semibold text-[#1C1B1F] transition hover:bg-white/90 disabled:opacity-60"
                >
                  <GoogleIcon />
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={openEmailView}
                  disabled={isAuthing}
                  className="mt-3 h-14 w-full rounded-full border border-white/25 font-[family-name:var(--font-instrument)] text-base font-semibold text-white transition hover:border-white/50 disabled:opacity-60"
                >
                  Continue with email
                </button>
              </>
            ) : (
              <>
                <div className="mb-5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={backToStart}
                    aria-label="Back"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 text-white transition hover:border-white/50"
                  >
                    <BackIcon />
                  </button>

                  <p className="font-[family-name:var(--font-bricolage)] text-lg font-bold">
                    {emailMode === "signin" ? "Log in" : "Create an account"}
                  </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="flex flex-col">
                  {/* Animated height so the extra "name" row on sign-up
                      slides in/out instead of jumping the layout. */}
                  <div
                    className={`grid overflow-hidden transition-[grid-template-rows,margin-bottom] duration-300 ease-out ${
                      emailMode === "signup" ? "mb-3 grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <input
                        type="text"
                        required={emailMode === "signup"}
                        tabIndex={emailMode === "signup" ? 0 : -1}
                        aria-hidden={emailMode !== "signup"}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onFocus={scrollFieldIntoView}
                        autoComplete="name"
                        placeholder="Your name"
                        disabled={isAuthing}
                        className={`h-14 w-full rounded-full bg-white px-5 font-[family-name:var(--font-instrument)] text-[15px] text-[#1C1B1F] outline-none transition placeholder:text-gray-400 disabled:opacity-60 ${
                          emailMode === "signup" ? "opacity-100" : "opacity-0"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      onFocus={scrollFieldIntoView}
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={isAuthing}
                      className="h-14 w-full rounded-full bg-white px-5 font-[family-name:var(--font-instrument)] text-[15px] text-[#1C1B1F] outline-none transition placeholder:text-gray-400 disabled:opacity-60"
                    />
                    {emailTyped && !emailFormatValid ? (
                      <p className="mt-1.5 inline-block rounded-full bg-[#1C1B4D]/80 px-3 py-1 font-[family-name:var(--font-instrument)] text-[13px] text-red-300">
                        Enter a valid email address.
                      </p>
                    ) : null}
                  </div>

                  <div className="mb-3">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        onFocus={scrollFieldIntoView}
                        autoComplete={emailMode === "signup" ? "new-password" : "current-password"}
                        placeholder={emailMode === "signup" ? "At least 6 characters" : "Your password"}
                        disabled={isAuthing}
                        className="h-14 w-full rounded-full bg-white px-5 pr-12 font-[family-name:var(--font-instrument)] text-[15px] text-[#1C1B1F] outline-none transition placeholder:text-gray-400 disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:text-gray-700"
                      >
                        <EyeIcon open={showPassword} />
                      </button>
                    </div>
                    {passwordTyped && emailMode === "signup" ? (
                      passwordLongEnough ? (
                        <p className="mt-1.5 inline-block rounded-full bg-[#1C1B4D]/80 px-3 py-1 font-[family-name:var(--font-instrument)] text-[13px] text-[#C9E265]">
                          ✓ Looks good
                        </p>
                      ) : (
                        <p className="mt-1.5 inline-block rounded-full bg-[#1C1B4D]/80 px-3 py-1 font-[family-name:var(--font-instrument)] text-[13px] text-red-300">
                          Use at least 6 characters ({password.length}/6)
                        </p>
                      )
                    ) : null}
                  </div>

                  {authError ? (
                    <p className="mb-3 inline-block rounded-full bg-[#1C1B4D]/80 px-3 py-1 font-[family-name:var(--font-instrument)] text-sm text-red-300">
                      {authError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isAuthing}
                    className="h-14 w-full rounded-full bg-[#C9E265] font-[family-name:var(--font-instrument)] text-base font-semibold text-[#1C1B1F] transition hover:brightness-95 disabled:opacity-60"
                  >
                    {isAuthing
                      ? "Please wait…"
                      : emailMode === "signup"
                        ? "Create my account"
                        : "Continue with email"}
                  </button>
                </form>

                <p className="mt-4 text-center font-[family-name:var(--font-instrument)] text-sm text-white/60">
                  {emailMode === "signin" ? "New here?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={toggleEmailMode}
                    className="font-semibold text-white transition hover:underline"
                  >
                    {emailMode === "signin" ? "Create an account" : "Log in"}
                  </button>
                </p>
              </>
            )}
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
