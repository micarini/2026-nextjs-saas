"use client";

import { useState, useTransition } from "react";

export default function PersonalRatingStars({ currentRating, action }) {
  const [rating, setRating] = useState(currentRating || 0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function pick(value) {
    const previous = rating;
    const next = value === rating ? 0 : value;
    setRating(next);
    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("rating", next || "");
        await action(formData);
      } catch (err) {
        setError(err.message || "Could not save your rating.");
        setRating(previous);
      }
    });
  }

  return (
    <div className="mt-6 text-center">
      <p className="text-sm font-semibold text-gray-500">Rate this book</p>

      <div className="mt-2 flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => pick(n)}
            disabled={isPending}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            className="text-3xl leading-none disabled:opacity-60"
          >
            <span className={n <= rating ? "text-amber-400" : "text-gray-300"}>★</span>
          </button>
        ))}
      </div>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
