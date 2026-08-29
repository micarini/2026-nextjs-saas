"use client";

import { useState } from "react";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";

const RATING_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function toDateInputValue(isoString) {
  return isoString ? isoString.slice(0, 10) : "";
}

const fieldClass =
  "h-11 rounded-md border border-[#e7dfcf] bg-white px-3 outline-none focus:border-[#c96a1f]";
const labelClass = "grid gap-1.5 text-sm font-medium text-[#20180f]";

export default function BookForm({ action, book, initialValues, submitLabel = "Save" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const values = book || initialValues || {};

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (err) {
      setError(err.message || "Could not save the book.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className={labelClass}>
        <span>Title</span>
        <input
          className={fieldClass}
          name="title"
          defaultValue={values.title || ""}
          disabled={loading}
          required
        />
      </label>

      <label className={labelClass}>
        <span>Author</span>
        <input
          className={fieldClass}
          name="author"
          defaultValue={values.author || ""}
          disabled={loading}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>Genre</span>
          <select
            className={fieldClass}
            name="genre"
            defaultValue={values.genre || GENRES[0].value}
            disabled={loading}
          >
            {GENRES.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <span>Status</span>
          <select
            className={fieldClass}
            name="status"
            defaultValue={values.status || "to_read"}
            disabled={loading}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        <span>Rating</span>
        <select
          className={fieldClass}
          name="rating"
          defaultValue={values.rating ?? ""}
          disabled={loading}
        >
          <option value="">No rating</option>
          {RATING_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value} ★
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>Total pages</span>
          <input
            className={fieldClass}
            name="totalPages"
            type="number"
            min="0"
            defaultValue={values.totalPages ?? ""}
            disabled={loading}
          />
        </label>

        <label className={labelClass}>
          <span>Current page</span>
          <input
            className={fieldClass}
            name="currentPage"
            type="number"
            min="0"
            defaultValue={values.currentPage ?? ""}
            disabled={loading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          <span>Start date</span>
          <input
            className={fieldClass}
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(values.startDate)}
            disabled={loading}
          />
        </label>

        <label className={labelClass}>
          <span>Finish date</span>
          <input
            className={fieldClass}
            name="finishDate"
            type="date"
            defaultValue={toDateInputValue(values.finishDate)}
            disabled={loading}
          />
        </label>

        <label className={labelClass}>
          <span>Target date</span>
          <input
            className={fieldClass}
            name="targetDate"
            type="date"
            defaultValue={toDateInputValue(values.targetDate)}
            disabled={loading}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span>ISBN (optional)</span>
        <input
          className={fieldClass}
          name="isbn"
          defaultValue={values.isbn || ""}
          disabled={loading}
        />
      </label>

      <label className={labelClass}>
        <span>Cover image URL (optional)</span>
        <input
          className={fieldClass}
          name="coverUrl"
          defaultValue={values.coverUrl || ""}
          disabled={loading}
        />
      </label>

      <label className="flex items-start gap-3 rounded-md border border-[#e7dfcf] bg-white p-3 text-sm font-medium text-[#20180f]">
        <input
          className="mt-1 size-4 accent-[#c96a1f]"
          name="published"
          type="checkbox"
          defaultChecked={Boolean(values.published)}
          disabled={loading}
        />
        <span>
          Make this book public
          <span className="mt-1 block text-sm font-normal leading-6 text-[#a89a7f]">
            Shows it at a public book page and on your public profile.
          </span>
        </span>
      </label>

      <button
        className="h-11 rounded-full bg-[#20180f] text-sm font-semibold text-white disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Saving..." : submitLabel}
      </button>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
