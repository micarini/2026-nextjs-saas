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

  // ============================================================================
  // LÓGICA DE GÉNERO SEGURO (Previene errores 500 del backend)
  // ============================================================================
  let safeGenreValue = GENRES[0]?.value || "fantasy";
  let safeGenreLabel = GENRES[0]?.label || "Fantasy";

  if (values.genre) {
    const incoming = (Array.isArray(values.genre) ? values.genre[0] : values.genre)
      .toString()
      .toLowerCase()
      .trim();
    
    // Busca si la categoría de la API coincide con nuestros géneros permitidos
    const match = GENRES.find(
      (g) => g.value.toLowerCase() === incoming || g.label.toLowerCase() === incoming
    );

    if (match) {
      safeGenreValue = match.value;
      safeGenreLabel = match.label;
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // 1. Extraemos los datos ANTES de hacer setLoading(true)
    // Si los inputs se deshabilitan primero, el FormData los ignora y se envían vacíos.
    const formData = new FormData(event.currentTarget);
    
    // 2. Red de seguridad: Forzar el género válido si por algún motivo no se capturó
    if (!formData.get("genre")) {
      formData.set("genre", safeGenreValue);
    }

    setError("");
    setLoading(true);

    try {
      await action(formData);
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

      <section className="relative overflow-hidden rounded-[2rem] bg-white p-[1px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="rounded-[1.95rem] bg-white p-5">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Your book
          </p>

          <div className="flex gap-4">
            {/* COVER */}
            <div className="w-28 shrink-0">
              <div className="aspect-[0.68] overflow-hidden rounded-2xl bg-gray-100/80 shadow-sm border border-gray-100">
                {values.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={values.coverUrl}
                    alt={values.title || "Book cover"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-3 text-center">
                    <span className="text-3xl text-gray-300">📚</span>
                  </div>
                )}
              </div>
            </div>

            {/* BOOK DETAILS */}
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <h1 className="text-xl font-extrabold leading-tight text-gray-900">
                {values.title || "Untitled book"}
              </h1>

              <p className="mt-1 text-sm font-semibold text-gray-500">
                {values.author || "Unknown author"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* Mostramos la etiqueta segura adaptada a tu BD */}
                {safeGenreLabel ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 border border-gray-200">
                    {safeGenreLabel}
                  </span>
                ) : null}

                {values.totalPages ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-100">
                    {values.totalPages} pages
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          HIDDEN BOOK DATA (Usando safeGenreValue)
      ====================================================== */}

      {!allowMetadataEditing && (
        <>
          <input type="hidden" name="title" value={values.title || ""} />
          <input type="hidden" name="author" value={values.author || ""} />
          <input type="hidden" name="genre" value={safeGenreValue} />
          <input type="hidden" name="coverUrl" value={values.coverUrl || ""} />
          <input type="hidden" name="isbn" value={values.isbn || ""} />
          <input type="hidden" name="totalPages" value={values.totalPages || ""} />
        </>
      )}

      {/* =====================================================
          MANUAL BOOK INFORMATION
      ====================================================== */}

      {allowMetadataEditing && (
        <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
          <h2 className="text-lg font-extrabold text-gray-900">Book information</h2>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Add the basic information about your book.
          </p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Title
              </span>

              <input
                name="title"
                defaultValue={values.title || ""}
                required
                disabled={loading}
                className="h-12 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-inner"
                placeholder="Book title"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Author
              </span>

              <input
                name="author"
                defaultValue={values.author || ""}
                required
                disabled={loading}
                className="h-12 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-inner"
                placeholder="Author name"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Genre
              </span>

              <select
                name="genre"
                defaultValue={safeGenreValue}
                disabled={loading}
                className="h-12 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 outline-none appearance-none focus:ring-2 focus:ring-amber-400 cursor-pointer transition-all shadow-inner"
              >
                {GENRES.map((genre) => (
                  <option key={genre.value} value={genre.value}>
                    {genre.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  Total pages
                </span>

                <input
                  name="totalPages"
                  type="number"
                  min="0"
                  defaultValue={values.totalPages || ""}
                  disabled={loading}
                  className="h-12 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-inner"
                  placeholder="0"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  ISBN
                </span>

                <input
                  name="isbn"
                  defaultValue={values.isbn || ""}
                  disabled={loading}
                  className="h-12 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-inner"
                  placeholder="ISBN"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Cover image URL
              </span>

              <input
                name="coverUrl"
                defaultValue={values.coverUrl || ""}
                disabled={loading}
                className="h-12 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-inner"
                placeholder="https://..."
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          READING STATUS
      ====================================================== */}

      <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900">
            What&apos;s your reading status?
          </h2>

          <p className="mt-1 text-sm font-medium text-gray-500">
            Choose how you want to track this book.
          </p>
        </div>

        <input type="hidden" name="status" value={status} />

        <div className="mt-6 grid grid-cols-2 gap-4">
          {/* WANT TO READ */}
          <button
            type="button"
            onClick={() => setStatus("to_read")}
            className={`rounded-3xl border p-5 text-left transition-all ${
              status === "to_read"
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/50 shadow-sm"
                : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <span className="text-2xl">🔖</span>
            <p className="mt-4 text-sm font-extrabold text-gray-900">Want to read</p>
            <p className="mt-1 text-xs font-medium text-gray-500">Save it for later</p>
          </button>

          {/* READING */}
          <button
            type="button"
            onClick={() => setStatus("reading")}
            className={`rounded-3xl border p-5 text-left transition-all ${
              status === "reading"
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/50 shadow-sm"
                : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <span className="text-2xl">📖</span>
            <p className="mt-4 text-sm font-extrabold text-gray-900">Reading</p>
            <p className="mt-1 text-xs font-medium text-gray-500">Reading it now</p>
          </button>

          {/* FINISHED */}
          <button
            type="button"
            onClick={() => setStatus("read")}
            className={`rounded-3xl border p-5 text-left transition-all ${
              status === "read"
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/50 shadow-sm"
                : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <span className="text-2xl">🎉</span>
            <p className="mt-4 text-sm font-extrabold text-gray-900">Finished</p>
            <p className="mt-1 text-xs font-medium text-gray-500">I read it all</p>
          </button>

          {/* DNF */}
          <button
            type="button"
            onClick={() => setStatus("dnf")}
            className={`rounded-3xl border p-5 text-left transition-all ${
              status === "dnf"
                ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/50 shadow-sm"
                : "border-gray-100 bg-white hover:border-amber-200 hover:bg-gray-50 hover:shadow-sm"
            }`}
          >
            <span className="text-2xl">🚫</span>
            <p className="mt-4 text-sm font-extrabold text-gray-900">DNF</p>
            <p className="mt-1 text-xs font-medium text-gray-500">Did not finish</p>
          </button>
        </div>
      </section>

      {/* =====================================================
          CONDITIONAL: WANT TO READ
      ====================================================== */}
      {status === "to_read" && (
        <section className="rounded-3xl bg-gray-50 p-6 border border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">
            Save it for later ✨
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            You can set a target date if you have one in mind.
          </p>
          <label className="mt-6 block">
            <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
              When do you want to read it?
            </span>
            <input
              name="targetDate"
              type="date"
              defaultValue={toDateInputValue(values.targetDate)}
              disabled={loading}
              className="h-12 w-full bg-white border border-gray-100 rounded-2xl px-5 text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-sm"
            />
          </label>
        </section>
      )}

      {/* =====================================================
          CONDITIONAL: CURRENTLY READING
      ====================================================== */}
      {status === "reading" && (
        <section className="rounded-3xl bg-gray-50 p-6 border border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">
            Your reading progress 📖
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Tell us where you currently are.
          </p>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Current page
              </span>
              <input
                name="currentPage"
                type="number"
                min="0"
                max={values.totalPages || undefined}
                defaultValue={values.currentPage || ""}
                disabled={loading}
                className="h-12 w-full bg-white border border-gray-100 rounded-2xl px-5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-sm"
                placeholder="0"
              />
              {values.totalPages ? (
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                    <span>{initialProgress}% complete</span>
                    <span>{values.totalPages} pages</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-gray-200/60 shadow-inner">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${initialProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                When did you start reading?
              </span>
              <input
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(values.startDate)}
                disabled={loading}
                className="h-12 w-full bg-white border border-gray-100 rounded-2xl px-5 text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-sm"
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          CONDITIONAL: FINISHED
      ====================================================== */}
      {status === "read" && (
        <section className="rounded-3xl bg-gray-50 p-6 border border-gray-100">
          <div>
            <span className="text-3xl">🎉</span>
            <h2 className="mt-3 text-xl font-extrabold text-gray-900">
              You finished this book!
            </h2>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Add the finishing date and your rating.
            </p>
          </div>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                When did you finish it?
              </span>
              <input
                name="finishDate"
                type="date"
                defaultValue={toDateInputValue(values.finishDate)}
                disabled={loading}
                className="h-12 w-full bg-white border border-gray-100 rounded-2xl px-5 text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-sm"
              />
            </label>
            <div>
              <span className="mb-3 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                How would you rate it?
              </span>
              <input type="hidden" name="rating" value={rating || ""} />
              <div className="flex gap-2 bg-white w-fit px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                {RATING_OPTIONS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="group outline-none"
                    aria-label={`${value} stars`}
                  >
                    <span
                      className={`text-3xl transition-colors drop-shadow-sm ${
                        rating >= value
                          ? "text-amber-400"
                          : "text-gray-200 group-hover:text-amber-200"
                      }`}
                    >
                      ★
                    </span>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-3 text-sm font-bold text-amber-500 ml-1">
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
        <section className="rounded-3xl bg-gray-50 p-6 border border-gray-100">
          <span className="text-3xl">📕</span>
          <h2 className="mt-3 text-xl font-extrabold text-gray-900">
            Not every book is for everyone.
          </h2>
          <p className="mt-1 text-sm font-medium text-gray-500">
            You can still keep track of where you stopped reading.
          </p>
          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Last page you read
              </span>
              <input
                name="currentPage"
                type="number"
                min="0"
                max={values.totalPages || undefined}
                defaultValue={values.currentPage || ""}
                disabled={loading}
                className="h-12 w-full bg-white border border-gray-100 rounded-2xl px-5 text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-sm"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                When did you stop reading?
              </span>
              <input
                name="finishDate"
                type="date"
                defaultValue={toDateInputValue(values.finishDate)}
                disabled={loading}
                className="h-12 w-full bg-white border border-gray-100 rounded-2xl px-5 text-gray-900 outline-none focus:ring-2 focus:ring-amber-400 transition-all shadow-sm"
              />
            </label>
          </div>
        </section>
      )}

      {/* =====================================================
          PUBLIC BOOK
      ====================================================== */}
      <label className="flex cursor-pointer items-center gap-4 rounded-3xl bg-white p-5 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:border-gray-200">
        <input
          name="published"
          type="checkbox"
          defaultChecked={Boolean(values.published)}
          disabled={loading}
          className="h-6 w-6 accent-amber-400 rounded focus:ring-amber-400 transition-all cursor-pointer"
        />
        <span>
          <span className="block text-sm font-extrabold text-gray-900">
            Share this book publicly
          </span>
          <span className="mt-1 block text-sm font-medium text-gray-500">
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
        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-500 text-gray-900 text-base font-extrabold shadow-[0_8px_20px_rgba(251,191,36,0.3)] transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 mt-8"
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
        <div className="rounded-2xl border-none bg-red-50 p-4 text-sm font-medium text-red-600 mt-4">
          {error}
        </div>
      ) : null}
    </form>
  );
}