import Link from "next/link";
import { redirect } from "next/navigation";

import BottomNav from "@/components/nav/BottomNav";
import LibraryShelf from "@/components/books/LibraryShelf";
import { listUserBooks } from "@/lib/books/books";
import { getCurrentUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

function prettyGenre(value) {
  if (!value) return "Other";

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function makeGenreShelves(books) {
  const groups = books.reduce((acc, book) => {
    const genre = book.genre || "other";

    acc[genre] = acc[genre] || [];
    acc[genre].push(book);

    return acc;
  }, {});

  return Object.entries(groups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 4)
    .map(([genre, genreBooks]) => ({
      key: `genre-${genre}`,
      label: prettyGenre(genre),
      meta: "Genre shelf",
      books: genreBooks,
    }));
}

export default async function LibraryPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const books = await listUserBooks(user.uid);

  const reading = books.filter(
    (book) => book.status === "reading"
  );

  const toRead = books.filter(
    (book) =>
      book.status === "to_read" ||
      book.status === "want_to_read"
  );

  const finished = books.filter(
    (book) =>
      book.status === "read" ||
      book.status === "finished"
  );

  const fiveStars = books.filter(
    (book) => book.rating === 5
  );

  const recent = [...books]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0) -
        new Date(a.updatedAt || a.createdAt || 0)
    )
    .slice(0, 12);

  const shelves = [
    {
      key: "reading",
      label: "Currently reading",
      meta: "Books in progress",
      books: reading,
    },
    {
      key: "to-read",
      label: "Want to read",
      meta: "Your reading queue",
      books: toRead,
    },
    {
      key: "five-stars",
      label: "Five stars",
      meta: "Your favourites",
      books: fiveStars,
    },
    {
      key: "finished",
      label: "Finished",
      meta: "Books you completed",
      books: finished,
    },

    ...makeGenreShelves(books),

    {
      key: "recent",
      label: "Recently touched",
      meta: "Latest additions & updates",
      books: recent,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f3ee] pb-28 text-[#34343b]">

      {/* HERO */}
      <header className="relative overflow-hidden bg-[#36366f] px-5 pb-8 pt-9 text-white">

        <div className="absolute -left-16 top-8 h-48 w-48 rounded-full bg-[#7778ba]/20 blur-3xl" />

        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[#222353]/50 blur-3xl" />

        <div className="relative mx-auto max-w-5xl">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/55">
                My Bookshelf
              </p>

              <h1 className="mt-2 text-[36px] font-semibold leading-none tracking-[-0.03em] sm:text-[44px]">
                Shelve it your way.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                Your library arranged like a real shelf —
                by reading status, rating and the genres
                you collect most.
              </p>

            </div>

            <Link
              href="/dashboard/books/new"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c8e75b] text-2xl font-light text-[#34343b] shadow-sm transition hover:scale-105"
              aria-label="Add a book"
            >
              +
            </Link>

          </div>

          {/* STATS */}
          <div className="mt-7 grid grid-cols-4 overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.06] backdrop-blur-sm">

            {[
              [books.length, "Total"],
              [reading.length, "Reading"],
              [toRead.length, "To read"],
              [fiveStars.length, "5 stars"],
            ].map(([value, label], index) => (

              <div
                key={label}
                className={`px-2 py-3 text-center ${
                  index
                    ? "border-l border-white/10"
                    : ""
                }`}
              >

                <p className="text-lg font-semibold sm:text-xl">
                  {value}
                </p>

                <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-white/45 sm:text-[9px]">
                  {label}
                </p>

              </div>

            ))}

          </div>

        </div>

      </header>

      {/* SHELVES */}
      <div className="mx-auto max-w-5xl px-5 py-6">

        {books.length === 0 ? (

          <section className="rounded-[28px] border border-[#deddd7] bg-[#f7f7f4] p-8 text-center shadow-sm">

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7d7b76]">
              Empty library
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-[#34343b]">
              Your shelves are waiting.
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#858178]">
              Add your first book and this page will
              automatically organize it into the right
              shelves.
            </p>

            <Link
              href="/dashboard/books/new"
              className="mt-5 inline-flex rounded-full bg-[#36366f] px-6 py-3 text-sm font-medium text-white"
            >
              Add your first book
            </Link>

          </section>

        ) : (

          <div className="grid gap-4 md:grid-cols-2">

            {shelves.map((shelf) => (

              <LibraryShelf
                key={shelf.key}
                label={shelf.label}
                meta={shelf.meta}
                books={shelf.books}
              />

            ))}

          </div>

        )}

      </div>

      <BottomNav active="library" />

    </main>
  );
}