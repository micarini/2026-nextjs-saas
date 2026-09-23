"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STATUSES } from "@/lib/books/statuses";

export default function StatusPill({ currentStatus, action, removeAction, onCompleted }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef(null);

  const currentLabel = STATUSES.find((entry) => entry.value === status)?.label || STATUSES[0].label;

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
        if (next === "read") {
          onCompleted?.();
        }
        router.refresh();
      } catch (err) {
        setError(err.message || "Could not update the status.");
        setStatus(previous);
      }
    });
  }

  function remove() {
    setOpen(false);

    if (!removeAction) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        await removeAction();
        router.push("/dashboard/library");
      } catch (err) {
        setError(err.message || "Could not remove this book.");
      }
    });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Every status reads the same neutral way — being "Want to read" is
          not a more provisional choice than the others, so it doesn't get
          a different color treatment. */}
      <div className="flex h-12 w-full overflow-hidden rounded-full border border-[#e7e3da] bg-white transition-colors">
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
          className="flex w-12 items-center justify-center border-l border-[#e7e3da] disabled:opacity-60"
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

          {removeAction ? (
            <>
              <div className="border-t border-[#e7e3da]" />
              <button
                type="button"
                onClick={remove}
                className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                Remove from library
              </button>
            </>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="mt-2 text-center text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
