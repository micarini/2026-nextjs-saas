"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { STATUSES } from "@/lib/books/statuses";

export default function StatusPill({ currentStatus, action }) {
  const [status, setStatus] = useState(currentStatus);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef(null);

  const currentLabel = STATUSES.find((entry) => entry.value === status)?.label || STATUSES[0].label;
  // "Want to read" is the default/unstarted state, so it keeps the accent
  // color as a call to action. Any other status means the user already
  // made an active choice, so the pill turns neutral/white.
  const isDefault = status === "to_read";

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pick(next) {
    setOpen(false);

    if (next === status) {
      return;
    }

    const previous = status;
    setStatus(next);
    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("status", next);
        await action(formData);
      } catch (err) {
        setError(err.message || "Could not update the status.");
        setStatus(previous);
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        className={`flex h-12 w-full overflow-hidden rounded-full transition-colors ${
          isDefault
            ? "bg-amber-400 shadow-[0_8px_20px_rgba(251,191,36,0.3)]"
            : "border border-[#e7e3da] bg-white"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          disabled={isPending}
          className="flex-1 text-center text-sm font-extrabold text-gray-900 disabled:opacity-60"
        >
          {currentLabel}
        </button>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Change status"
          disabled={isPending}
          className={`flex w-12 items-center justify-center border-l disabled:opacity-60 ${
            isDefault ? "border-black/10" : "border-[#e7e3da]"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#171717"
            strokeWidth="2.5"
            className={`transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border border-[#e7e3da] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
          {STATUSES.map((entry) => (
            <button
              key={entry.value}
              type="button"
              onClick={() => pick(entry.value)}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm font-medium transition ${
                entry.value === status ? "bg-[#f8f8fa] text-gray-900" : "text-gray-700 hover:bg-[#f8f8fa]"
              }`}
            >
              {entry.label}
              {entry.value === status ? <span>✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
