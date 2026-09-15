import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { listUserBooks } from "@/lib/books/books";
import TopFourBooks from "@/components/users/TopFourBooks";
import { logout } from "@/app/dashboard/actions";
import { saveTopFour } from "./actions";

import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

/* =========================================
   ACHIEVEMENT CARD
========================================= */

function Achievement({ emoji, title, description, unlocked = true }) {
  return (
    <div
      className={`min-w-[145px] flex-1 rounded-[22px] border p-4 text-center ${
        unlocked
          ? "border-[#dedcd5] bg-[#f7f7f4]"
          : "border-[#e8e8e4] bg-[#f2f2ef] opacity-50"
      }`}
    >
      <div className="text-3xl">{emoji}</div>

      <p className="mt-3 text-sm font-semibold text-[#34343b]">
        {title}
      </p>

      <p className="mt-1 text-xs text-[#85858c]">
        {description}
      </p>
    </div>
  );
}

/* =========================================
   MAIN PAGE
========================================= */

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const [profile, books] = await Promise.all([
    getCurrentUserProfile(user),
    listUserBooks(user.uid),
  ]);

  /* =========================================
     USER DATA
  ========================================= */

  const displayName =
    user.displayName ||
    profile?.displayName ||
    user.email?.split("@")[0] ||
    "Reader";

  const username =
    profile?.username ||
    displayName.toLowerCase().replace(/\s+/g, "");

  const firstLetter = displayName.charAt(0).toUpperCase();

  /* =========================================
     BOOK DATA
  ========================================= */

  const readingBooks = books.filter(
    (book) => book.status === "reading"
  );

  const finishedBooks = books.filter(
    (book) => book.status === "finished"
  );

  const wantToReadBooks = books.filter(
    (book) =>
      book.status === "to_read" ||
      book.status === "want_to_read"
  );

  /*
    TOP FOUR:

    Primero toma los libros mejor puntuados.
    Si no hay suficientes, completa con los
    demás libros del usuario.
  */

  const topFourIds = profile?.topFour || [];

  /* =========================================
     READING STREAK

     Como tu base actual no tiene todavía una
     colección de actividad diaria, calculamos
     una versión inicial basada en fechas.
  ========================================= */

  const booksWithDates = books.filter(
    (book) => book.updatedAt || book.finishDate || book.startDate
  );

  const readingStreak =
    booksWithDates.length > 0
      ? Math.min(booksWithDates.length, 12)
      : 0;

  /* =========================================
     PINNED QUOTE

     Utilizamos una descripción de uno de los
     libros si existe.
  ========================================= */

  const quoteBook =
    finishedBooks.find((book) => book.description) ||
    books.find((book) => book.description) ||
    null;

  const pinnedQuote = quoteBook?.description
    ? `"${quoteBook.description
        .split(".")[0]
        .slice(0, 120)}"`
    : `"A reader lives a thousand lives before he dies."`;

  /* =========================================
     ACHIEVEMENTS
  ========================================= */

  const shelfStarter = books.length >= 5;

  const onStreak = readingStreak >= 7;

  const starReader = books.filter(
    (book) => book.rating === 5
  ).length >= 5;

  const nightOwl = books.some((book) => {
    if (!book.updatedAt) return false;

    const hour = new Date(book.updatedAt).getHours();

    return hour >= 0 && hour <= 5;
  });

  return (
    <main className="min-h-screen bg-[#f4f3ee] pb-28 text-[#34343b]">

      {/* =====================================
          PROFILE HEADER
      ====================================== */}

      <section className="relative overflow-hidden bg-[#36366f] px-6 pb-9 pt-10">

        {/* Decorative gradients */}

        <div className="absolute -left-20 top-20 h-60 w-60 rounded-full bg-[#5557a0]/20 blur-3xl" />

        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-[#24255c]/40 blur-3xl" />


        <div className="relative mx-auto max-w-6xl">

          {/* Avatar + identity — stacked/centered on mobile, a single
              row (avatar left, everything else right) from lg: up. */}

          <div className="mt-4 flex flex-col items-center text-center lg:mt-0 lg:flex-row lg:items-center lg:gap-7 lg:text-left">

            <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d7ef6b] to-[#9fca3c] text-3xl font-medium text-[#303066] shadow-lg lg:h-27 lg:w-27">

              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                firstLetter
              )}

            </div>


            <div>

              {/* Name */}

              <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-white lg:mt-0 lg:text-[32px]">
                {displayName}
              </h1>


              {/* Public URL */}

              <p className="mt-1 font-mono text-xs tracking-[0.12em] text-white/50">
                quire.app/{username}
              </p>


              {/* Buttons */}

              <div className="mt-6 flex gap-3 lg:mt-5">

                <Link
                  href={`/u/${username}`}
                  className="rounded-full bg-[#f5f4f0] px-6 py-2.5 text-base font-medium text-[#39394a] shadow-sm transition hover:scale-[1.02]"
                >
                  Public Shelf
                </Link>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          CONTENT
      ====================================== */}

      <div className="mx-auto max-w-6xl px-6">

{/* Currently Reading + My Top Four: two book-showcase cards, side by
    side from lg: up instead of stacked full-width. */}
<div className="mt-5 grid gap-8 lg:grid-cols-2 lg:items-start">

{readingBooks.length > 0 && (
  <section>
    <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
      Currently Reading
    </p>

    <div className="mt-5">
      {readingBooks.slice(0, 1).map((book) => (
        <Link
          key={book.id}
          href={`/dashboard/books/${book.id}/edit`}
          className="group flex gap-4"
        >
          <div className="h-32 w-22 shrink-0 overflow-hidden rounded-xl bg-[#e4e2dc]">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-[#74747b]">
                No cover
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="text-lg font-semibold leading-tight text-[#242426]">
              {book.title}
            </p>

            <p className="mt-1 text-sm text-[#74747b]">
              {book.author}
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[#74747b]">
                <span>Currently reading</span>
                <span>→</span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#deddd7]">
                <div className="h-full w-1/3 rounded-full bg-[#6b8f71]" />
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  </section>
)}

        {/* =====================================
            MY TOP FOUR
        ====================================== */}

        <section>
  <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
    My Top Four
  </p>

  <TopFourBooks
    books={books}
    initialTopFour={topFourIds}
    action={saveTopFour}
  />
</section>

</div>


        {/* =====================================
            PINNED QUOTE
        ====================================== */}

        <section className="mt-4 rounded-[28px] border border-[#c8c8d7] bg-[#e6e5f0] p-6 shadow-sm">

          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#66667c]">
            Pinned Quote
          </p>


          <blockquote className="mt-5 text-[25px] font-medium leading-[1.25] tracking-tight text-[#353653]">
            {pinnedQuote}
          </blockquote>


          <p className="mt-4 text-sm text-[#69697d]">
            — {quoteBook?.title || "Anonymous reader"}
          </p>

        </section>


        {/* =====================================
            ACHIEVEMENTS
        ====================================== */}

        <section className="mt-4 overflow-hidden rounded-[28px] border border-[#deddd7] bg-[#f7f7f5] p-6 shadow-sm">

          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
            Achievements
          </p>


          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">

            <Achievement
              emoji="📚"
              title="Shelf starter"
              description={
                shelfStarter
                  ? "First 5 books"
                  : `${books.length}/5 books`
              }
              unlocked={shelfStarter}
            />


            <Achievement
              emoji="🔥"
              title="On a streak"
              description={`${readingStreak} days`}
              unlocked={onStreak}
            />


            <Achievement
              emoji="⭐"
              title="Star reader"
              description="5 five-star books"
              unlocked={starReader}
            />


            <Achievement
              emoji="🌙"
              title="Night owl"
              description="Read past midnight"
              unlocked={nightOwl}
            />

          </div>

        </section>


        {/* =====================================
            READING SUMMARY
        ====================================== */}

        <section className="mt-4 grid grid-cols-2 gap-4 lg:max-w-md">

          <div className="rounded-[25px] border border-[#deddd7] bg-white p-5">

            <p className="text-sm text-[#85858c]">
              Library
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {books.length}
            </p>

            <p className="mt-1 text-xs text-[#85858c]">
              total books
            </p>

          </div>


          <div className="rounded-[25px] border border-[#deddd7] bg-white p-5">

            <p className="text-sm text-[#85858c]">
              To read
            </p>

            <p className="mt-2 text-3xl font-semibold">
              {wantToReadBooks.length}
            </p>

            <p className="mt-1 text-xs text-[#85858c]">
              waiting for you
            </p>

          </div>

        </section>


        <Link
          href="/dashboard/import"
          className="mt-4 flex items-center justify-between rounded-[25px] border border-[#deddd7] bg-white p-5 transition hover:bg-[#fbfbf9]"
        >
          <div>
            <p className="text-sm font-semibold">
              Import from Goodreads
            </p>
            <p className="mt-1 text-xs text-[#85858c]">
              Shelves, ratings and reviews from your CSV export
            </p>
          </div>
          <span className="text-lg text-[#85858c]">→</span>
        </Link>

        <section className="mt-6">
  <form action={logout}>
    <button
      type="submit"
      className="flex h-14 w-full items-center justify-center rounded-full bg-[#eee6e4] text-base font-semibold text-[#a34d45] transition hover:bg-[#e6d8d5]"
    >
      Log out
    </button>
  </form>
</section>

        <div className="h-10" />

      </div>


      {/* =====================================
          BOTTOM NAV
      ====================================== */}

      <BottomNav active="profile" />

    </main>
  );
}