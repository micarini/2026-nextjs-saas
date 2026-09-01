"use client";

import { useState } from "react";
import { GENRES } from "@/lib/books/genres";

const RATING_OPTIONS = [1, 2, 3, 4, 5];

function toDateInputValue(value) {
  return value ? value.slice(0, 10) : "";
}

function getInitialStatus(values) {
  if (values.status === "abandoned") {
    return "dnf";
  }

  return values.status || "to_read";
}

export default function BookForm({
  action,
  book,
  initialValues,
  submitLabel = "Save book",
  allowMetadataEditing = false,
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const values = book || initialValues || {};

  const [status, setStatus] = useState(getInitialStatus(values));

  const [rating, setRating] = useState(values.rating || 0);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (err) {
      setError(err.message || "Something went wrong while saving your book.");

      setLoading(false);
    }
  }

  const totalPages = values.totalPages || 0;
  const currentPage = values.currentPage || 0;

  const initialProgress =
    totalPages > 0
      ? Math.min(100, Math.round((currentPage / totalPages) * 100))
      : 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl space-y-6"
    >
      {/* =====================================================
          BOOK INFORMATION
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 p-[1px] shadow-lg shadow-purple-500/20">
        <div className="rounded-[1.95rem] bg-white p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-purple-600">
            Your book
          </p>

          <div className="flex gap-4">
            {/* COVER */}

            <div className="w-28 shrink-0">
              <div className="aspect-[0.68] overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg">
                {values.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={values.coverUrl}
                    alt={values.title || "Book cover"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center">
                    <span className="text-3xl">📚</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOOK DETAILS */}

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h1 className="font-serif text-2xl font-bold leading-tight text-zinc-900">
                {values.title || "Untitled book"}
              </h1>

              <p className="mt-2 text-sm font-medium text-zinc-500">
                {values.author || "Unknown author"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {values.genre ? (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    {values.genre}
                  </span>
                ) : null}

                {values.totalPages ? (
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700">
                    {values.totalPages} pages
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HIDDEN BOOK DATA

          Estos campos mantienen la información original
          del libro para que Firebase siga funcionando.
      ====================================================== */}

      {!allowMetadataEditing && (
        <>
          <input type="hidden" name="title" value={values.title || ""} />

          <input type="hidden" name="author" value={values.author || ""} />

          <input type="hidden" name="genre" value={values.genre || ""} />

          <input type="hidden" name="coverUrl" value={values.coverUrl || ""} />

          <input type="hidden" name="isbn" value={values.isbn || ""} />

          <input
            type="hidden"
            name="totalPages"
            value={values.totalPages || ""}
          />
        </>
      )}

      {/* =====================================================
          MANUAL BOOK INFORMATION

          Solo aparece cuando agregás un libro manualmente.
      ====================================================== */}

      {allowMetadataEditing && (
        <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900">Book information</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Add the basic information about your book.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Title
              </span>

              <input
                name="title"
                defaultValue={values.title || ""}
                required
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                placeholder="Book title"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Author
              </span>

              <input
                name="author"
                defaultValue={values.author || ""}
                required
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                placeholder="Author name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Genre
              </span>

              <select
                name="genre"
                defaultValue={values.genre || GENRES[0]?.value || ""}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
              >
                {GENRES.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-700">
                  Total pages
                </span>

                <input
                  name="totalPages"
                  type="number"
                  min="0"
                  defaultValue={values.totalPages || ""}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-zinc-700">
                  ISBN
                </span>

                <input
                  name="isbn"
                  defaultValue={values.isbn || ""}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-zinc-700">
                Cover image URL
              </span>

              <input
                name="coverUrl"
                defaultValue={values.coverUrl || ""}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition focus:border-purple-500 focus:bg-white focus:ring-4 focus:ring-purple-100"
                placeholder="https://..."
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          READING STATUS
      ====================================================== */}

      <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">
            What&apos;s your reading status?
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Choose how you want to track this book.
          </p>
        </div>

        <input type="hidden" name="status" value={status} />

        <div className="mt-5 grid grid-cols-2 gap-3">
          {/* WANT TO READ */}

          <button
            type="button"
            onClick={() => setStatus("to_read")}
            className={`rounded-2xl border p-4 text-left transition ${
              status === "to_read"
                ? "border-violet-500 bg-violet-50 ring-2 ring-violet-200"
                : "border-zinc-200 bg-white hover:border-violet-200"
            }`}
          >
            <span className="text-2xl">🔖</span>

            <p className="mt-3 text-sm font-bold text-zinc-900">Want to read</p>

            <p className="mt-1 text-xs text-zinc-500">Save it for later</p>
          </button>

          {/* READING */}

          <button
            type="button"
            onClick={() => setStatus("reading")}
            className={`rounded-2xl border p-4 text-left transition ${
              status === "reading"
                ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                : "border-zinc-200 bg-white hover:border-blue-200"
            }`}
          >
            <span className="text-2xl">📖</span>

            <p className="mt-3 text-sm font-bold text-zinc-900">Reading</p>

            <p className="mt-1 text-xs text-zinc-500">Reading it now</p>
          </button>

          {/* FINISHED */}

          <button
            type="button"
            onClick={() => setStatus("read")}
            className={`rounded-2xl border p-4 text-left transition ${
              status === "read"
                ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200"
                : "border-zinc-200 bg-white hover:border-pink-200"
            }`}
          >
            <span className="text-2xl">🎉</span>

            <p className="mt-3 text-sm font-bold text-zinc-900">Finished</p>

            <p className="mt-1 text-xs text-zinc-500">I read it all</p>
          </button>

          {/* DNF */}

          <button
            type="button"
            onClick={() => setStatus("dnf")}
            className={`rounded-2xl border p-4 text-left transition ${
              status === "dnf"
                ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                : "border-zinc-200 bg-white hover:border-orange-200"
            }`}
          >
            <span className="text-2xl">🚫</span>

            <p className="mt-3 text-sm font-bold text-zinc-900">DNF</p>

            <p className="mt-1 text-xs text-zinc-500">Did not finish</p>
          </button>
        </div>
      </section>

      {/* =====================================================
          CONDITIONAL: WANT TO READ
      ====================================================== */}

      {status === "to_read" && (
        <section className="rounded-[2rem] bg-violet-50 p-5 ring-1 ring-violet-100">
          <h2 className="text-lg font-bold text-violet-950">
            Save it for later ✨
          </h2>

          <p className="mt-1 text-sm text-violet-700">
            You can set a target date if you have one in mind.
          </p>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold text-violet-900">
              When do you want to read it?
            </span>

            <input
              name="targetDate"
              type="date"
              defaultValue={toDateInputValue(values.targetDate)}
              disabled={loading}
              className="h-12 w-full rounded-2xl border border-violet-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-violet-200"
            />
          </label>
        </section>
      )}

      {/* =====================================================
          CONDITIONAL: CURRENTLY READING
      ====================================================== */}

      {status === "reading" && (
        <section className="rounded-[2rem] bg-blue-50 p-5 ring-1 ring-blue-100">
          <h2 className="text-lg font-bold text-blue-950">
            Your reading progress 📖
          </h2>

          <p className="mt-1 text-sm text-blue-700">
            Tell us where you currently are.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-blue-900">
                Current page
              </span>

              <input
                name="currentPage"
                type="number"
                min="0"
                max={values.totalPages || undefined}
                defaultValue={values.currentPage || ""}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-blue-200"
                placeholder="0"
              />

              {values.totalPages ? (
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-medium text-blue-700">
                    <span>{initialProgress}% complete</span>

                    <span>{values.totalPages} pages</span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      style={{
                        width: `${initialProgress}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-blue-900">
                When did you start reading?
              </span>

              <input
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(values.startDate)}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-blue-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-blue-200"
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          CONDITIONAL: FINISHED
      ====================================================== */}

      {status === "read" && (
        <section className="rounded-[2rem] bg-pink-50 p-5 ring-1 ring-pink-100">
          <div>
            <span className="text-3xl">🎉</span>

            <h2 className="mt-3 text-xl font-bold text-pink-950">
              You finished this book!
            </h2>

            <p className="mt-1 text-sm text-pink-700">
              Add the finishing date and your rating.
            </p>
          </div>

          <div className="mt-5 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-pink-900">
                When did you finish it?
              </span>

              <input
                name="finishDate"
                type="date"
                defaultValue={toDateInputValue(values.finishDate)}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-pink-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-pink-200"
              />
            </label>

            <div>
              <span className="mb-3 block text-sm font-semibold text-pink-900">
                How would you rate it?
              </span>

              <input type="hidden" name="rating" value={rating || ""} />

              <div className="flex gap-2">
                {RATING_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="group"
                    aria-label={`${value} stars`}
                  >
                    <span
                      className={`text-3xl transition ${
                        rating >= value
                          ? "text-yellow-400"
                          : "text-pink-200 group-hover:text-yellow-200"
                      }`}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>

              {rating > 0 && (
                <p className="mt-2 text-sm font-medium text-pink-700">
                  {rating} out of 5 stars
                </p>
              )}
            </div>

            <input
              type="hidden"
              name="currentPage"
              value={values.totalPages || values.currentPage || ""}
            />
          </div>
        </section>
      )}

      {/* =====================================================
          CONDITIONAL: DNF
      ====================================================== */}

      {status === "dnf" && (
        <section className="rounded-[2rem] bg-orange-50 p-5 ring-1 ring-orange-100">
          <span className="text-3xl">📕</span>

          <h2 className="mt-3 text-xl font-bold text-orange-950">
            Not every book is for everyone.
          </h2>

          <p className="mt-1 text-sm text-orange-700">
            You can still keep track of where you stopped reading.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-orange-900">
                Last page you read
              </span>

              <input
                name="currentPage"
                type="number"
                min="0"
                max={values.totalPages || undefined}
                defaultValue={values.currentPage || ""}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-orange-200"
                placeholder="0"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-orange-900">
                When did you stop reading?
              </span>

              <input
                name="finishDate"
                type="date"
                defaultValue={toDateInputValue(values.finishDate)}
                disabled={loading}
                className="h-12 w-full rounded-2xl border border-orange-200 bg-white px-4 text-sm outline-none focus:ring-4 focus:ring-orange-200"
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          PUBLIC BOOK
      ====================================================== */}

      <label className="flex cursor-pointer items-start gap-4 rounded-[1.5rem] bg-zinc-900 p-5 text-white">
        <input
          name="published"
          type="checkbox"
          defaultChecked={Boolean(values.published)}
          disabled={loading}
          className="mt-1 h-5 w-5 accent-pink-500"
        />

        <span>
          <span className="block text-sm font-bold">
            Share this book publicly
          </span>

          <span className="mt-1 block text-sm leading-relaxed text-zinc-400">
            Show this reading activity on your public profile.
          </span>
        </span>
      </label>

      {/* =====================================================
          SAVE BUTTON
      ====================================================== */}

      <button
        type="submit"
        disabled={loading}
        className="flex h-14 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:scale-[1.01] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          "Saving..."
        ) : (
          <>
            {submitLabel}
            <span>→</span>
          </>
        )}
      </button>

      {/* ERROR */}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </form>
  );
}
