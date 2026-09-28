"use client";

import { useState } from "react";

function clampRating(value) {
  return Math.max(0, Math.min(5, Math.round(value * 4) / 4));
}

export default function StarRatingInput({
  value = 0,
  onChange,
  disabled = false,
  size = "text-3xl",
}) {
  const [editing, setEditing] = useState(false);
  const rating = Number(value) || 0;

  function adjust(amount) {
    onChange?.(clampRating(rating + amount));
  }

  return (
    <div className="flex flex-col items-center gap-2" role="radiogroup" aria-label="Rating">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.max(0, Math.min(1, rating - star + 1));

          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(star)}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              aria-checked={rating === star}
              role="radio"
              className={`leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${size}`}
            >
              <span
                aria-hidden="true"
                className="text-transparent"
                style={{
                  backgroundImage: `linear-gradient(90deg, #fbbf24 ${fill * 100}%, #d1d5db ${fill * 100}%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                ★
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setEditing((open) => !open)}
          disabled={disabled}
          aria-label={editing ? "Hide rating adjustment" : "Adjust rating"}
          aria-expanded={editing}
          className="ml-2 rounded-lg p-2 text-base text-[#6f6b62] transition hover:bg-[#f3f0e9] hover:text-[#322F7A] disabled:opacity-60"
        >
          ✎
        </button>
      </div>

      {editing ? (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-[#f7f5f0] px-3 py-2 text-xs font-bold text-[#322F7A]">
          <button type="button" onClick={() => adjust(-0.5)} disabled={disabled || rating <= 0} className="rounded-lg bg-white px-2 py-1 shadow-sm disabled:opacity-40">− ½</button>
          <button type="button" onClick={() => adjust(-0.25)} disabled={disabled || rating <= 0} className="rounded-lg bg-white px-2 py-1 shadow-sm disabled:opacity-40">− ¼</button>
          <span className="min-w-16 text-center text-[#20180f]">{rating || 0} / 5</span>
          <button type="button" onClick={() => adjust(0.25)} disabled={disabled || rating >= 5} className="rounded-lg bg-white px-2 py-1 shadow-sm disabled:opacity-40">+ ¼</button>
          <button type="button" onClick={() => adjust(0.5)} disabled={disabled || rating >= 5} className="rounded-lg bg-white px-2 py-1 shadow-sm disabled:opacity-40">+ ½</button>
        </div>
      ) : null}
    </div>
  );
}
