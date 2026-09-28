"use client";

import { useState, useTransition } from "react";
import StarRatingInput from "./StarRatingInput";

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

      <div className="mt-2 flex justify-center">
        <StarRatingInput value={rating} onChange={pick} disabled={isPending} />
      </div>

      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
