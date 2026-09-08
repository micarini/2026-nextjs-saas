"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DEFAULT_SESSION_MINUTES = 25;
const RING_RADIUS = 108;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const MOODS = ["Absorbed", "Restless", "Slow", "Moved"];
const IDLE_DIM_MS = 30000;

function storageKey(bookId) {
  return `focus-timer-${bookId}`;
}

function loadStoredState(bookId) {
  try {
    const raw = window.localStorage.getItem(storageKey(bookId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredState(bookId, state) {
  try {
    window.localStorage.setItem(storageKey(bookId), JSON.stringify(state));
  } catch {
    // Ignore — localStorage can be unavailable (private mode, quota).
  }
}

function clearStoredState(bookId) {
  try {
    window.localStorage.removeItem(storageKey(bookId));
  } catch {
    // Ignore.
  }
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function FocusMode({
  book,
  spotifyEmbedUrl,
  hasOwnSpotifyUrl,
  beginSessionAction,
  finishSessionAction,
  setSpotifyUrlAction,
  addNoteAction,
}) {
  const router = useRouter();

  const [sessionMinutes, setSessionMinutes] = useState(DEFAULT_SESSION_MINUTES);
  const sessionSeconds = sessionMinutes * 60;

  const [endsAt, setEndsAt] = useState(null); // timestamp, or null while paused
  const [pausedSecondsLeft, setPausedSecondsLeft] = useState(sessionSeconds);
  const [secondsLeft, setSecondsLeft] = useState(sessionSeconds);
  const [sessionId, setSessionId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [dimmed, setDimmed] = useState(false);

  const [showCheckin, setShowCheckin] = useState(false);
  const [endPage, setEndPage] = useState(book.currentPage || 0);
  const [mood, setMood] = useState(null);
  const [checkinError, setCheckinError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [checkinSeconds, setCheckinSeconds] = useState(0);

  const [showNotePopup, setShowNotePopup] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notePage, setNotePage] = useState(book.currentPage || 0);
  const [noteError, setNoteError] = useState("");
  const [isSavingNote, startNoteTransition] = useTransition();

  const [spotifyDraft, setSpotifyDraft] = useState("");
  const [isSavingSpotify, startSpotifyTransition] = useTransition();

  const canEditDuration = sessionId === null && endsAt === null;

  // Rehydrate an in-progress timer from localStorage on mount, so a
  // refresh doesn't reset the clock. endsAt is a real timestamp, so the
  // remaining time is recomputed accurately regardless of how long the
  // page was closed.
  useEffect(() => {
    const stored = loadStoredState(book.id);

    if (stored) {
      const minutes = stored.sessionMinutes || DEFAULT_SESSION_MINUTES;
      const seconds = minutes * 60;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionMinutes(minutes);
      setSessionId(stored.sessionId || null);

      if (stored.isRunning && stored.endsAt) {
        const remaining = Math.max(0, Math.round((stored.endsAt - Date.now()) / 1000));
        setEndsAt(stored.endsAt);
        setSecondsLeft(remaining);
      } else {
        setPausedSecondsLeft(stored.pausedSecondsLeft ?? seconds);
        setSecondsLeft(stored.pausedSecondsLeft ?? seconds);
      }
    }

    setHydrated(true);
    // Only ever runs once, to read whatever was saved before this mount —
    // deliberately an effect (not lazy initial state) so the very first
    // client render still matches the server-rendered default and avoids a
    // hydration mismatch; the real values apply right after, once mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tick while running, and persist state so a refresh survives.
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    saveStoredState(book.id, {
      endsAt,
      pausedSecondsLeft,
      isRunning: endsAt !== null,
      sessionId,
      sessionMinutes,
    });

    if (endsAt === null) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining === 0) {
        setEndsAt(null);
        setCheckinSeconds(sessionSeconds);
        setShowCheckin(true);
      }
    }, 250);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, endsAt, pausedSecondsLeft, sessionId, sessionMinutes]);

  // The page's own content dims after 30s of no interaction while the
  // session is actively running — a real (if approximate) stand-in for
  // "put the phone down". A browser can't dim the device's actual
  // hardware brightness, only its own content, so that's what this does.
  const isRunning = endsAt !== null;

  useEffect(() => {
    if (!isRunning) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDimmed(false);
      return;
    }

    let timeout = setTimeout(() => setDimmed(true), IDLE_DIM_MS);

    function wake() {
      setDimmed(false);
      clearTimeout(timeout);
      timeout = setTimeout(() => setDimmed(true), IDLE_DIM_MS);
    }

    window.addEventListener("pointerdown", wake);
    window.addEventListener("keydown", wake);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [isRunning]);

  async function handleStartPause() {
    if (isRunning) {
      setPausedSecondsLeft(secondsLeft);
      setEndsAt(null);
      return;
    }

    if (!sessionId) {
      try {
        const newSessionId = await beginSessionAction();
        setSessionId(newSessionId);
      } catch {
        // Keep going even if the session couldn't be created server-side —
        // the timer itself still works, it just won't have anything to save.
      }
    }

    setEndsAt(Date.now() + secondsLeft * 1000);
  }

  function handleReset() {
    setEndsAt(null);
    setPausedSecondsLeft(sessionSeconds);
    setSecondsLeft(sessionSeconds);
  }

  function adjustDuration(delta) {
    if (!canEditDuration) {
      return;
    }

    setSessionMinutes((n) => {
      const next = Math.min(90, Math.max(5, n + delta));
      setSecondsLeft(next * 60);
      setPausedSecondsLeft(next * 60);
      return next;
    });
  }

  function handleEnd() {
    setEndsAt(null);

    if (!sessionId) {
      clearStoredState(book.id);
      router.push("/dashboard");
      return;
    }

    setCheckinSeconds(sessionSeconds - secondsLeft);
    setShowCheckin(true);
  }

  function handleSaveSession() {
    setCheckinError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("endPage", String(endPage));
        formData.set("mood", mood || "");
        formData.set("secondsElapsed", String(checkinSeconds));
        await finishSessionAction(sessionId, formData);
        clearStoredState(book.id);
        router.push("/dashboard");
      } catch (err) {
        setCheckinError(err.message || "Could not save this session.");
      }
    });
  }

  function handleSaveNote(event) {
    event.preventDefault();
    setNoteError("");

    startNoteTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("text", noteText);
        formData.set("page", String(notePage));
        await addNoteAction(formData);
        setNoteText("");
        setShowNotePopup(false);
      } catch (err) {
        setNoteError(err.message || "Could not save this note.");
      }
    });
  }

  function handleSaveSpotify(event) {
    event.preventDefault();

    startSpotifyTransition(async () => {
      const formData = new FormData();
      formData.set("spotifyUrl", spotifyDraft);
      await setSpotifyUrlAction(formData);
      router.refresh();
    });
  }

  // Lima fills in as time is spent, starting from an empty ring — not the
  // other way around, so a fresh session reads as "nothing elapsed yet"
  // instead of a solid circle that looks like a static decoration.
  const elapsed = 1 - secondsLeft / sessionSeconds;
  const dashOffset = RING_CIRCUMFERENCE * (1 - elapsed);
  const pagesThisSession = endPage - (book.currentPage || 0);
  const shortTitle = book.title.split(" ")[0];

  return (
    <main className="min-h-screen bg-[#1C1B1F] px-5 pb-32 pt-6 text-white">
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-30 bg-black transition-opacity duration-1500 ${
          dimmed ? "opacity-85" : "opacity-0"
        }`}
      />

      <div className="flex items-center">
        <Link
          href="/dashboard"
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full border border-white/15 text-white/70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <p className="flex-1 text-center font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/50">
          Focus mode
        </p>

        <div className="size-9" />
      </div>

      <div className="mt-8 flex items-center gap-3">
        <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-[#E85D4C]">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-bold">{book.title}</p>
          <p className="text-sm text-white/50">from page {book.currentPage || 0}</p>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <div className="relative flex size-[250px] items-center justify-center">
          <svg width="250" height="250" className="-rotate-90">
            <circle cx="125" cy="125" r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            <circle
              cx="125"
              cy="125"
              r={RING_RADIUS}
              fill="none"
              stroke="#C9E265"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 0.25s linear" }}
            />
          </svg>

          <span className="absolute font-mono text-6xl font-medium tabular-nums tracking-[-0.02em]">
            {formatClock(secondsLeft)}
          </span>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        {canEditDuration ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => adjustDuration(-5)}
              aria-label="Shorter session"
              className="flex size-7 items-center justify-center rounded-full border border-white/20 text-white/60"
            >
              &minus;
            </button>
            <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/50">
              {sessionMinutes} min session
            </span>
            <button
              type="button"
              onClick={() => adjustDuration(5)}
              aria-label="Longer session"
              className="flex size-7 items-center justify-center rounded-full border border-white/20 text-white/60"
            >
              +
            </button>
          </div>
        ) : (
          <span className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-white/50">
            {sessionMinutes} min session
          </span>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleReset}
          aria-label="Restart"
          className="flex size-14 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-white/30"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 1 3 6.7" />
            <path d="M3 8v5h5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleStartPause}
          className="flex h-14 min-w-[128px] items-center justify-center rounded-full bg-[#C9E265] px-8 text-base font-bold text-[#1C1B1F] transition hover:brightness-95"
        >
          {isRunning ? "Pause" : "Start"}
        </button>

        <button
          type="button"
          onClick={handleEnd}
          className="flex size-14 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-white/60 transition hover:border-white/30"
        >
          End
        </button>
      </div>

      <div className="mt-12">
        <div className="overflow-hidden rounded-2xl">
          <iframe
            title="Spotify player"
            src={spotifyEmbedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>

        {!hasOwnSpotifyUrl ? (
          <form onSubmit={handleSaveSpotify} className="mt-3 flex items-center gap-2">
            <p className="shrink-0 text-xs text-white/40">Playing a default relaxing playlist —</p>
            <input
              type="url"
              value={spotifyDraft}
              onChange={(event) => setSpotifyDraft(event.target.value)}
              placeholder="paste your own Spotify link"
              className="h-8 min-w-0 flex-1 rounded-lg border border-white/15 bg-transparent px-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-[#C9E265]"
            />
            <button
              type="submit"
              disabled={isSavingSpotify || !spotifyDraft}
              className="shrink-0 rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              {isSavingSpotify ? "..." : "Link"}
            </button>
          </form>
        ) : null}

        <p className="mt-4 text-center text-xs text-white/40">
          Dims after 30s idle — tap anywhere to wake it.
        </p>
      </div>

      {showCheckin ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#FAFBF5] p-6 text-[#1C1B1F]">
            <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#77766d]">
              Session complete
            </p>

            <h3 className="mt-1 text-2xl font-bold tracking-[-0.02em]">
              {Math.round(checkinSeconds / 60)} minutes with {shortTitle}.
            </h3>

            <div className="mt-5 rounded-2xl border border-[#e7e3da] p-4">
              <p className="text-center text-sm text-[#77766d]">Where did you stop?</p>
              <div className="mt-3 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setEndPage((n) => Math.max(0, n - 1))}
                  className="flex size-10 items-center justify-center rounded-full bg-[#f0eee8] text-lg"
                >
                  &minus;
                </button>
                <span className="font-mono text-4xl font-medium tabular-nums text-[#322F7A]">
                  {endPage}
                </span>
                <button
                  type="button"
                  onClick={() => setEndPage((n) => n + 1)}
                  className="flex size-10 items-center justify-center rounded-full bg-[#f0eee8] text-lg"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-center font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-[#a09c8f]">
                {pagesThisSession >= 0 ? "+" : ""}
                {pagesThisSession} pages this session
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {MOODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMood(option)}
                  className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    mood === option
                      ? "bg-[#322F7A] text-white"
                      : "border border-[#e7e3da] text-[#4b473f]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>

            {checkinError ? (
              <p className="mt-4 text-xs text-red-600">{checkinError}</p>
            ) : null}

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowNotePopup(true)}
                aria-label="Add a note"
                className="flex size-13 shrink-0 items-center justify-center rounded-full bg-[#EDEBF7] text-[#322F7A]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>

              <button
                type="button"
                onClick={handleSaveSession}
                disabled={isPending}
                className="h-13 flex-1 rounded-2xl bg-[#1C1B1F] py-3.5 text-base font-bold text-white disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save session"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showNotePopup ? (
        <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/60 px-4 pb-4">
          <form
            onSubmit={handleSaveNote}
            className="w-full max-w-sm rounded-3xl bg-[#FAFBF5] p-6 text-[#1C1B1F]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">New note</h3>
              <button
                type="button"
                onClick={() => setShowNotePopup(false)}
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full bg-[#EDEBF7] text-[#322F7A]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="What's on your mind..."
              rows={5}
              className="mt-4 w-full resize-none rounded-2xl border border-[#e7e3da] p-4 text-sm text-[#1C1B1F] outline-none placeholder:text-[#a09c8f] focus:border-[#322F7A]"
            />

            {noteError ? <p className="mt-2 text-xs text-red-600">{noteError}</p> : null}

            <div className="mt-3 flex items-center gap-3">
              <label className="flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-[#e7e3da] px-4 font-mono text-sm text-[#4b473f]">
                P.
                <input
                  type="number"
                  min="0"
                  value={notePage}
                  onChange={(event) => setNotePage(Number(event.target.value) || 0)}
                  className="w-12 bg-transparent text-center outline-none"
                />
              </label>

              <button
                type="submit"
                disabled={isSavingNote || !noteText.trim()}
                className="h-11 flex-1 rounded-full bg-[#C9E265] text-sm font-bold text-[#1C1B1F] disabled:opacity-60"
              >
                {isSavingNote ? "Saving..." : "Save note"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
