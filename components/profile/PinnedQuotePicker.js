"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Splits a book's description into quotable sentences. Descriptions are
// often padded with press-blurb fragments ("A New York Times Notable
// Book.") — too short to be a real line, so those get filtered out, but
// nothing here tries to be smarter than that: the point of showing a list
// is letting the person pick the good one themselves instead of always
// getting whichever sentence happens to come first.
function quoteOptions(description) {
  return String(description || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40 && sentence.length <= 240);
}

// Only books with at least one usable sentence can supply a quote.
export default function PinnedQuotePicker({ books, currentBookId, action }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pickedBook, setPickedBook] = useState(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const eligible = useMemo(
    () => books.filter((book) => quoteOptions(book.description).length > 0),
    [books]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();

    if (!term) {
      return eligible;
    }

    return eligible.filter(
      (book) =>
        book.title.toLowerCase().includes(term) ||
        (book.author || "").toLowerCase().includes(term)
    );
  }, [eligible, search]);

  function close() {
    setIsOpen(false);
    setPickedBook(null);
    setSearch("");
  }

  function choose(bookId, quoteText) {
    close();

    startTransition(async () => {
      try {
        await action(bookId, quoteText);
        router.refresh();
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (!eligible.length) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#66667c] underline underline-offset-2 transition hover:text-[#36366f] disabled:opacity-50"
      >
        Change
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full max-w-xl rounded-t-[32px] bg-[#f7f7f5] p-6 shadow-2xl sm:rounded-[32px]">
            {!pickedBook ? (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#777780]">
                      Pinned Quote
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#34343b]">Choose a book</h3>
                    <p className="mt-1 text-sm text-[#85858c]">
                      Next you&apos;ll pick which line to use.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8e7e1] text-xl text-[#55555f] transition hover:bg-[#ddddda]"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6">
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search your books..."
                    className="h-12 w-full rounded-2xl border border-[#deddd7] bg-white px-4 text-sm text-[#34343b] outline-none transition placeholder:text-[#aaaab0] focus:border-[#36366f]"
                  />
                </div>

                <div className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pb-4">
                  {filtered.length > 0 ? (
                    filtered.map((book) => (
                      <button
                        key={book.id}
                        type="button"
                        onClick={() => setPickedBook(book)}
                        className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition hover:bg-[#ebeae5] ${
                          book.id === currentBookId ? "bg-[#ebeae5]" : ""
                        }`}
                      >
                        <div className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[#dddcd7]">
                          {book.coverUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-[#34343b]">
                            {book.title}
                          </p>
                          <p className="mt-1 truncate text-sm text-[#85858c]">{book.author}</p>
                        </div>

                        {book.id === currentBookId ? (
                          <span className="text-[#36366f]">✓</span>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-sm text-[#85858c]">No books found.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <button
                      type="button"
                      onClick={() => setPickedBook(null)}
                      className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#777780] underline underline-offset-2"
                    >
                      ← Back to books
                    </button>
                    <h3 className="mt-2 text-2xl font-semibold text-[#34343b]">
                      Pick a line from {pickedBook.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={close}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8e7e1] text-xl text-[#55555f] transition hover:bg-[#ddddda]"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-6 max-h-[55vh] space-y-2 overflow-y-auto pb-2">
                  {quoteOptions(pickedBook.description).map((sentence, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={isPending}
                      onClick={() => choose(pickedBook.id, sentence)}
                      className="w-full rounded-2xl border border-[#deddd7] bg-white p-4 text-left text-sm leading-relaxed text-[#353653] transition hover:border-[#36366f] hover:bg-[#f2f1fc] disabled:opacity-50"
                    >
                      &ldquo;{sentence}&rdquo;
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
