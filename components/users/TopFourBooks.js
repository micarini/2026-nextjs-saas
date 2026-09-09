"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";

export default function TopFourBooks({
  books,
  initialTopFour,
  action,
}) {
  const [selectedIds, setSelectedIds] = useState(
    initialTopFour || [],
  );

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedBooks = useMemo(() => {
    return selectedIds
      .map((id) =>
        books.find((book) => book.id === id),
      )
      .filter(Boolean);
  }, [selectedIds, books]);

  const availableBooks = useMemo(() => {
    const searchTerm = search.toLowerCase().trim();

    return books.filter((book) => {
      const alreadySelected = selectedIds.includes(
        book.id,
      );

      if (alreadySelected) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      return (
        book.title
          .toLowerCase()
          .includes(searchTerm) ||
        book.author
          .toLowerCase()
          .includes(searchTerm)
      );
    });
  }, [books, search, selectedIds]);

  function updateTopFour(newIds) {
    setSelectedIds(newIds);

    startTransition(async () => {
      try {
        await action(newIds);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function addBook(bookId) {
    if (selectedIds.length >= 4) {
      return;
    }

    const newIds = [...selectedIds, bookId];

    updateTopFour(newIds);

    setSearch("");

    if (newIds.length >= 4) {
      setIsOpen(false);
    }
  }

  function removeBook(bookId) {
    const newIds = selectedIds.filter(
      (id) => id !== bookId,
    );

    updateTopFour(newIds);
  }

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3">

        {/* LIBROS SELECCIONADOS */}

        {selectedBooks.map((book, index) => (
          <div
            key={book.id}
            className="group relative aspect-[0.72]"
          >
            <Link
              href={`/dashboard/books/${book.id}`}
              className="block h-full w-full overflow-hidden rounded-[18px] bg-[#d8d8d3]"
            >
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-end bg-[#36366f] p-3">
                  <p className="text-sm font-medium text-white">
                    {book.title}
                  </p>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-12">
                <p className="line-clamp-2 text-xs font-medium text-white">
                  {book.title}
                </p>
              </div>
            </Link>

            {/* NÚMERO */}

            <div className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-xs font-semibold text-white backdrop-blur-sm">
              {index + 1}
            </div>

            {/* ELIMINAR */}

            <button
              type="button"
              onClick={() => removeBook(book.id)}
              disabled={isPending}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-[#4a4a55] shadow-md transition hover:scale-110 disabled:opacity-50"
              aria-label={`Remove ${book.title}`}
            >
              ×
            </button>
          </div>
        ))}

        {/* ESPACIOS VACÍOS */}

        {Array.from({
          length: Math.max(
            0,
            4 - selectedBooks.length,
          ),
        }).map((_, index) => (
          <button
            key={`empty-${index}`}
            type="button"
            onClick={() => setIsOpen(true)}
            disabled={isPending}
            className="group flex aspect-[0.72] flex-col items-center justify-center rounded-[18px] border-2 border-dashed border-[#c9c8c2] bg-[#efeee9] transition hover:border-[#36366f] hover:bg-[#e8e7e1] disabled:opacity-50"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-3xl font-light text-[#36366f] shadow-sm transition group-hover:scale-110">
              +
            </div>

            <span className="mt-3 text-xs font-medium text-[#777780]">
              Add a book
            </span>
          </button>
        ))}

      </div>

      {/* TEXTO */}

      <p className="mt-4 text-center text-xs text-[#85858c]">
        {selectedBooks.length}/4 favorite books selected
      </p>

      {/* MODAL */}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center">

          <div className="w-full max-w-xl rounded-t-[32px] bg-[#f7f7f5] p-6 shadow-2xl sm:rounded-[32px]">

            {/* HEADER */}

            <div className="flex items-start justify-between">

              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#777780]">
                  My Top Four
                </p>

                <h3 className="mt-2 text-2xl font-semibold text-[#34343b]">
                  Choose a favorite book
                </h3>

                <p className="mt-1 text-sm text-[#85858c]">
                  Select a book from your library.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e7e1] text-xl text-[#55555f] transition hover:bg-[#ddddda]"
              >
                ×
              </button>

            </div>

            {/* BUSCADOR */}

            <div className="mt-6">

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search your books..."
                className="h-12 w-full rounded-2xl border border-[#deddd7] bg-white px-4 text-sm text-[#34343b] outline-none transition placeholder:text-[#aaaab0] focus:border-[#36366f]"
              />

            </div>

            {/* LISTA DE LIBROS */}

            <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pb-4">

              {availableBooks.length > 0 ? (
                availableBooks.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    onClick={() => addBook(book.id)}
                    disabled={isPending}
                    className="flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-[#ebeae5] disabled:opacity-50"
                  >

                    {/* COVER */}

                    <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#dddcd7]">

                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center p-1 text-center text-[8px] text-[#777780]">
                          {book.title}
                        </div>
                      )}

                    </div>

                    {/* INFO */}

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-base font-semibold text-[#34343b]">
                        {book.title}
                      </p>

                      <p className="mt-1 truncate text-sm text-[#85858c]">
                        {book.author}
                      </p>

                      {book.rating ? (
                        <p className="mt-1 text-xs text-[#d4a42c]">
                          {"★".repeat(book.rating)}
                        </p>
                      ) : null}

                    </div>

                    {/* PLUS */}

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#36366f] text-xl text-white">
                      +
                    </div>

                  </button>
                ))
              ) : (
                <div className="py-10 text-center">

                  <p className="text-sm text-[#85858c]">
                    No books found.
                  </p>

                  {books.length === 0 && (
                    <Link
                      href="/dashboard/books/new"
                      className="mt-4 inline-flex rounded-full bg-[#36366f] px-5 py-3 text-sm font-medium text-white"
                    >
                      Add your first book
                    </Link>
                  )}

                </div>
              )}

            </div>

          </div>

        </div>
      )}
    </>
  );
}