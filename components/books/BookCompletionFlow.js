"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CurrentPageEditor from "./CurrentPageEditor";
import StatusPill from "./StatusPill";

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}

function initialDate(value) {
  return value ? String(value).slice(0, 10) : today();
}

function CompletionPrompt({
  open,
  startDate,
  finishDate,
  targetDate,
  currentRating,
  dateAction,
  ratingAction,
  onClose,
}) {
  const router = useRouter();
  const [startedOn, setStartedOn] = useState(initialDate(startDate));
  const [date, setDate] = useState(initialDate(finishDate));
  const [rating, setRating] = useState(Number(currentRating) || 0);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return null;
  }

  function save() {
    if (!date) {
      setError("Choose the date you finished this book.");
      return;
    }

    if (!startedOn) {
      setError("Choose the date you started this book.");
      return;
    }

    if (startedOn > date) {
      setError("The start date cannot be after the finish date.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setError("Choose a rating from 1 to 5 stars.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const dates = new FormData();
        dates.set("startDate", startedOn);
        dates.set("finishDate", date);
        dates.set("targetDate", targetDate ? String(targetDate).slice(0, 10) : "");
        await dateAction(dates);

        const ratingForm = new FormData();
        ratingForm.set("rating", String(rating));
        await ratingAction(ratingForm);

        onClose();
        router.refresh();
      } catch (err) {
        setError(err.message || "Could not save the completion details.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#322F7A]">
          Book completed
        </p>
        <h2 className="mt-2 text-2xl font-extrabold text-[#20180f]">
          Save the final details
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#77766d]">
          Add the date and rating now so your reading statistics stay accurate.
        </p>

        <label className="mt-6 block text-sm font-bold text-[#20180f]">
          Started on
          <input
            type="date"
            value={startedOn}
            onChange={(event) => setStartedOn(event.target.value)}
            disabled={isPending}
            className="mt-2 h-12 w-full rounded-xl border-2 border-[#e7e3da] px-3 text-sm font-semibold outline-none focus:border-[#322F7A] disabled:opacity-60"
          />
        </label>

        <label className="mt-4 block text-sm font-bold text-[#20180f]">
          Finished on
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            disabled={isPending}
            className="mt-2 h-12 w-full rounded-xl border-2 border-[#e7e3da] px-3 text-sm font-semibold outline-none focus:border-[#322F7A] disabled:opacity-60"
          />
        </label>

        <div className="mt-5">
          <p className="text-sm font-bold text-[#20180f]">Your rating</p>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                disabled={isPending}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                className="text-3xl leading-none disabled:opacity-60"
              >
                <span className={value <= rating ? "text-amber-400" : "text-gray-300"}>★</span>
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="mt-4 text-xs text-red-600">{error}</p> : null}

        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="mt-6 h-12 w-full rounded-2xl bg-[#322F7A] text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(50,47,122,0.3)] transition hover:bg-[#3d3993] disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save completion details"}
        </button>
      </div>
    </div>
  );
}

export default function BookCompletionFlow({
  book,
  statusAction,
  progressAction,
  dateAction,
  ratingAction,
}) {
  const [promptOpen, setPromptOpen] = useState(false);

  return (
    <>
      <StatusPill
        currentStatus={book.status}
        action={statusAction}
        onCompleted={() => setPromptOpen(true)}
      />
      <CurrentPageEditor
        currentPage={book.currentPage}
        totalPages={book.totalPages}
        action={progressAction}
        onCompleted={() => setPromptOpen(true)}
      />
      <CompletionPrompt
        open={promptOpen}
        startDate={book.startDate}
        finishDate={book.finishDate}
        targetDate={book.targetDate}
        currentRating={book.rating}
        dateAction={dateAction}
        ratingAction={ratingAction}
        onClose={() => setPromptOpen(false)}
      />
    </>
  );
}
