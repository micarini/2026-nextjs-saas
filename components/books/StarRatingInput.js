"use client";

import { useRef } from "react";

function clampRating(value) {
  return Math.max(0, Math.min(5, Math.round(value * 2) / 2));
}

export default function StarRatingInput({
  value = 0,
  onChange,
  disabled = false,
  size = "text-5xl",
}) {
  const dragging = useRef(false);
  const rating = clampRating(Number(value) || 0);

  function setFromPointer(event, star) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const isHalf = event.clientX - bounds.left < bounds.width / 2;
    onChange?.(isHalf ? star - 0.5 : star);
  }

  function stopDragging() {
    dragging.current = false;
  }

  return (
    <div
      className="flex items-center justify-center gap-1"
      role="radiogroup"
      aria-label="Rating"
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, rating - star + 1));

        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onPointerDown={(event) => {
              event.preventDefault();
              dragging.current = true;
              setFromPointer(event, star);
            }}
            onPointerEnter={(event) => {
              if (dragging.current) {
                setFromPointer(event, star);
              }
            }}
            aria-label={`Rate ${star - 0.5} or ${star} stars`}
            aria-checked={rating === star || rating === star - 0.5}
            role="radio"
            className={`select-none leading-none transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60 ${size}`}
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
    </div>
  );
}
