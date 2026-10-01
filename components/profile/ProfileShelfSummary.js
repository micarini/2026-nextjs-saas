"use client";

import Link from "next/link";
import { useState } from "react";

function BookList({ books }) {
  if (!books.length) {
    return (
      <p className="mt-4 rounded-2xl bg-[#f1f0eb] p-4 text-sm text-[#85858c]">
        No books in this shelf yet.
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {books.map((book) => (
        <Link
          key={book.id}
          href={`/dashboard/books/${book.id}`}
          className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#deddd7] bg-white p-3 transition hover:border-[#36366f]/30 hover:bg-[#fbfbf9]"
        >
          <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-[#e6e4dd]">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#34343b]">
              {book.title}
            </p>
            <p className="mt-0.5 truncate text-xs text-[#85858c]">
              {book.author || "Unknown author"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function ProfileShelfSummary({
  books = [],
  wantToReadBooks = [],
}) {
  const [selectedShelf, setSelectedShelf] = useState(null);
  const selectedBooks =
    selectedShelf === "library" ? books : wantToReadBooks;

  return (
    <section className="mt-4">
      <div className="grid grid-cols-2 gap-4 lg:max-w-md">
        <button
          type="button"
          onClick={() =>
            setSelectedShelf((value) =>
              value === "library" ? null : "library"
            )
          }
          aria-expanded={selectedShelf === "library"}
          className={`rounded-[25px] border p-5 text-left transition ${
            selectedShelf === "library"
              ? "border-[#36366f] bg-[#e9e8f2]"
              : "border-[#deddd7] bg-white hover:border-[#36366f]/30"
          }`}
        >
          <p className="text-sm text-[#85858c]">Library</p>
          <p className="mt-2 text-3xl font-semibold text-[#36366f]">
            {books.length}
          </p>
          <p className="mt-1 text-xs text-[#85858c]">tap to see your books</p>
        </button>

        <button
          type="button"
          onClick={() =>
            setSelectedShelf((value) =>
              value === "to-read" ? null : "to-read"
            )
          }
          aria-expanded={selectedShelf === "to-read"}
          className={`rounded-[25px] border p-5 text-left transition ${
            selectedShelf === "to-read"
              ? "border-[#8ba83e] bg-[#f1f6d9]"
              : "border-[#deddd7] bg-white hover:border-[#8ba83e]/50"
          }`}
        >
          <p className="text-sm text-[#85858c]">To read</p>
          <p className="mt-2 text-3xl font-semibold text-[#64752b]">
            {wantToReadBooks.length}
          </p>
          <p className="mt-1 text-xs text-[#85858c]">tap to see your books</p>
        </button>
      </div>

      {selectedShelf ? (
        <div className="mt-5 rounded-3xl border border-[#deddd7] bg-[#f7f7f5] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#74747b]">
              {selectedShelf === "library" ? "Your library" : "To read next"}
            </p>
            <button
              type="button"
              onClick={() => setSelectedShelf(null)}
              className="text-xs font-semibold text-[#36366f]"
            >
              Close
            </button>
          </div>
          <BookList books={selectedBooks} />
        </div>
      ) : null}
    </section>
  );
}
