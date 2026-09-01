"use client";

import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";

import { useRouter, useSearchParams } from "next/navigation";

import {
  getClientAuth,
  getGoogleProvider,
} from "@/lib/firebase/client";

async function persistSession(user) {
  const idToken = await user.getIdToken();

  const response = await fetch("/api/session/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idToken,
    }),
  });

  if (!response.ok) {
    throw new Error(
      "We couldn't create your session. Please try again.",
    );
  }
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.14c1.84-1.7 2.91-4.2 2.91-7.29Z"
      />

      <path
        fill="#34A853"
        d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.52c-.87.59-1.98.94-3.31.94-2.55 0-4.72-1.72-5.5-4.03H3.26v2.6A9.75 9.75 0 0 0 12 21.75Z"
      />

      <path
        fill="#FBBC05"
        d="M6.5 13.79A5.86 5.86 0 0 1 6.19 12c0-.62.11-1.21.31-1.79v-2.6H3.26A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.06 1.01 4.39l3.24-2.6Z"
      />

      <path
        fill="#EA4335"
        d="M12 6.18c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.83 3.29 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.74 5.36l3.24 2.6c.78-2.31 2.95-4.03 5.5-4.03Z"
      />
    </svg>
  );
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 5 8.5 8a10.8 10.8 0 0 1-2 4.2" />
        <path d="M6.2 6.2C4.1 7.7 3.5 10 3.5 12c0 3 3.5 8 8.5 8a8.8 8.8 0 0 0 3.1-.6" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="3"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextUrl =
    searchParams.get("next") || "/dashboard";

  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function finishLogin(userCredential) {
    await persistSession(userCredential.user);

    router.push(nextUrl);
    router.refresh();
  }

  async function handleEmailSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const auth = getClientAuth();

      const userCredential =
        mode === "signup"
          ? await createUserWithEmailAndPassword(
              auth,
              email,
              password,
            )
          : await signInWithEmailAndPassword(
              auth,
              email,
              password,
            );

      await finishLogin(userCredential);
    } catch (err) {
      console.error(err);

      let message =
        "Something went wrong. Please try again.";

      if (err.code === "auth/email-already-in-use") {
        message =
          "There is already an account with this email.";
      }

      if (err.code === "auth/invalid-credential") {
        message =
          "Incorrect email or password.";
      }

      if (err.code === "auth/weak-password") {
        message =
          "Your password must contain at least 6 characters.";
      }

      if (err.code === "auth/invalid-email") {
        message =
          "Please enter a valid email address.";
      }

      setError(message);
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithPopup(
        getClientAuth(),
        getGoogleProvider(),
      );

      await finishLogin(userCredential);
    } catch (err) {
      console.error(err);

      setError(
        "We couldn't sign you in with Google. Please try again.",
      );

      setLoading(false);
    }
  }

  function changeMode(newMode) {
    if (loading) {
      return;
    }

    setMode(newMode);
    setError("");
  }

  return (
    <section
      className="w-full flex flex-col gap-6"
      aria-labelledby="login-title"
    >
      {/* LOGIN / SIGNUP TABS */}

      <div className="grid grid-cols-2 rounded-full bg-gray-100/80 p-1 shadow-inner">
        <button
          type="button"
          onClick={() => changeMode("signin")}
          disabled={loading}
          className={`h-12 rounded-full text-sm font-extrabold transition-all ${
            mode === "signin"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Log in
        </button>

        <button
          type="button"
          onClick={() => changeMode("signup")}
          disabled={loading}
          className={`h-12 rounded-full text-sm font-extrabold transition-all ${
            mode === "signup"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Sign up
        </button>
      </div>


      {/* EMAIL FORM */}

      <form
        onSubmit={handleEmailSubmit}
        className="space-y-4"
      >
        {/* EMAIL */}

        <label className="block">
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            autoComplete="email"
            placeholder="you@example.com"
            disabled={loading}
            required
            className="h-14 w-full rounded-full border border-gray-100 bg-white px-6 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-amber-400 shadow-sm disabled:cursor-not-allowed"
          />
        </label>

        {/* PASSWORD */}

        <label className="block">

          <div className="relative">
            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              autoComplete={
                mode === "signup"
                  ? "new-password"
                  : "current-password"
              }
              minLength={6}
              placeholder={
                mode === "signup"
                  ? "At least 6 characters"
                  : "Your password"
              }
              disabled={loading}
              required
              className="h-14 w-full rounded-full border border-gray-100 bg-white px-6 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-amber-400 shadow-sm disabled:cursor-not-allowed"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword((value) => !value)
              }
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-700"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </label>

        {/* ERROR */}

        {error ? (
          <div
            className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium leading-6 text-red-600"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-amber-400 hover:bg-amber-500 text-gray-900 text-base font-extrabold shadow-[0_4px_14px_rgba(251,191,36,0.4)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 mt-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-900/40 border-t-gray-900" />
              Please wait...
            </>
          ) : mode === "signup" ? (
            <>
              Create my account
            </>
          ) : (
            <>
              Continue with email
            </>
          )}
        </button>
      </form>

      {/* DIVIDER */}

      <div className="flex items-center gap-4 py-2">
        <span className="h-px flex-1 bg-gray-200" />

        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Or
        </span>

        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* GOOGLE */}

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-gray-200 bg-white px-4 text-base font-bold text-gray-900 shadow-sm transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      {/* CHANGE MODE */}

      <p className="text-center text-sm font-medium text-gray-500 mt-2">
        {mode === "signin"
          ? "New here?"
          : "Already have an account?"}

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            changeMode(
              mode === "signin"
                ? "signup"
                : "signin",
            )
          }
          className="ml-1 font-extrabold text-gray-900 transition-colors hover:underline"
        >
          {mode === "signin"
            ? "Create an account"
            : "Log in"}
        </button>
      </p>
    </section>
  );
}