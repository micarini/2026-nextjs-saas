import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { listUserBooks } from "@/lib/books/books";
import TopFourBooks from "@/components/users/TopFourBooks";
import { logout } from "@/app/dashboard/actions";
import {
  saveUsername,
  saveTopFour,
} from "./actions";

import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

/* =========================================
   ICONS
========================================= */

function ShareIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4" />
      <path d="m15.4 6.5-6.8 4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h6" />
      <path d="M7 13h10" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

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
    redirect("/login");
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
     PAGES READ
  ========================================= */

  const pagesRead = books.reduce((total, book) => {
    if (book.status === "finished") {
      return total + (book.totalPages || 0);
    }

    return total + (book.currentPage || 0);
  }, 0);

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
     READING GOAL

     Por ahora la meta visual es de 12 libros.
     Se puede conectar después a una meta que
     configure cada usuario.
  ========================================= */

  const yearlyGoal = 12;

  const goalProgress = Math.min(
    100,
    Math.round(
      (finishedBooks.length / yearlyGoal) * 100
    )
  );

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


        <div className="relative mx-auto max-w-xl">

          {/* Top actions */}

          <div className="flex justify-end gap-5">

            <button
              className="flex items-center gap-2 text-base text-white/60 transition hover:text-white"
              type="button"
            >
              <ShareIcon />
              <span>Share</span>
            </button>


            <button
              className="flex items-center gap-2 text-base text-white/60 transition hover:text-white"
              type="button"
            >
              <CardIcon />
              <span>Card</span>
            </button>

          </div>


          {/* Avatar */}

          <div className="mt-4 flex flex-col items-center text-center">

            <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#d7ef6b] to-[#9fca3c] text-3xl font-medium text-[#303066] shadow-lg">

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


            {/* Name */}

            <h1 className="mt-4 text-[28px] font-semibold tracking-tight text-white">
              {displayName}
            </h1>


            {/* Public URL */}

            <p className="mt-1 font-mono text-xs tracking-[0.12em] text-white/50">
              quire.app/{username}
            </p>


            {/* Buttons */}

            <div className="mt-6 flex gap-3">

              <Link
                href={`/u/${username}`}
                className="rounded-full bg-[#f5f4f0] px-6 py-2.5 text-base font-medium text-[#39394a] shadow-sm transition hover:scale-[1.02]"
              >
                Public Shelf
              </Link>


              <button
                type="button"
                className="rounded-full bg-white/10 px-6 py-2.5 text-base font-medium text-white/80 backdrop-blur-sm transition hover:bg-white/20"
              >
                Readers
              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================
          CONTENT
      ====================================== */}

      <div className="mx-auto max-w-xl px-6">


        {/* =====================================
            MY TOP FOUR
        ====================================== */}

        <section className="mt-5 rounded-[28px] border border-[#deddd7] bg-[#f7f7f5] p-5 shadow-sm">
  <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
    My Top Four
  </p>

  <TopFourBooks
    books={books}
    initialTopFour={topFourIds}
    action={saveTopFour}
  />
</section>


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
            WHAT VISITORS SEE
        ====================================== */}

        <section className="mt-4 overflow-hidden rounded-[28px] border border-[#deddd7] bg-[#f7f7f5] shadow-sm">

          <div className="p-6 pb-3">

            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
              What Visitors See
            </p>

          </div>


          <div className="px-6 pb-4">


            {/* Currently reading */}

            <div className="flex items-center justify-between py-3">

              <div>
                <p className="text-lg font-medium">
                  Currently reading
                </p>

                <p className="mt-1 text-sm text-[#85858c]">
                  {readingBooks.length} book
                  {readingBooks.length !== 1 ? "s" : ""}
                </p>
              </div>


              <span className="rounded-full bg-[#c8e75b] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#45501f]">
                Shown
              </span>

            </div>


            {/* Books finished */}

            <div className="flex items-center justify-between py-3">

              <div>
                <p className="text-lg font-medium">
                  Books finished
                </p>

                <p className="mt-1 text-sm text-[#85858c]">
                  {finishedBooks.length} completed
                </p>
              </div>


              <span className="rounded-full bg-[#c8e75b] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#45501f]">
                Shown
              </span>

            </div>


            {/* Pages read */}

            <div className="flex items-center justify-between py-3">

              <div>
                <p className="text-lg font-medium">
                  Pages read
                </p>

                <p className="mt-1 text-sm text-[#85858c]">
                  {pagesRead.toLocaleString()} pages
                </p>
              </div>


              <span className="rounded-full bg-[#c8e75b] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#45501f]">
                Shown
              </span>

            </div>


            {/* Reading streak */}

            <div className="flex items-center justify-between py-3">

              <div>
                <p className="text-lg font-medium">
                  Reading streak
                </p>

                <p className="mt-1 text-sm text-[#85858c]">
                  {readingStreak} day
                  {readingStreak !== 1 ? "s" : ""}
                </p>
              </div>


              <span className="rounded-full bg-[#e1e1e8] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#777782]">
                Hidden
              </span>

            </div>


            {/* Goal progress */}

            <div className="flex items-center justify-between py-3">

              <div>
                <p className="text-lg font-medium">
                  Goal progress
                </p>

                <p className="mt-1 text-sm text-[#85858c]">
                  {finishedBooks.length} of {yearlyGoal} books ·{" "}
                  {goalProgress}%
                </p>
              </div>


              <span className="rounded-full bg-[#c8e75b] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#45501f]">
                Shown
              </span>

            </div>


            {/* Progress bar */}

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e3e3de]">

              <div
                className="h-full rounded-full bg-[#b6d94b]"
                style={{
                  width: `${goalProgress}%`,
                }}
              />

            </div>

          </div>

        </section>


        {/* =====================================
            ACHIEVEMENTS
        ====================================== */}

        <section className="mt-4 overflow-hidden rounded-[28px] border border-[#deddd7] bg-[#f7f7f5] p-6 shadow-sm">

          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
            Achievements
          </p>


          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">

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

        <section className="mt-4 grid grid-cols-2 gap-4">

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


        {/* =====================================
            VIEW PUBLIC PROFILE
        ====================================== */}

        <section className="mt-4">

          <Link
            href={`/u/${username}`}
            className="flex items-center justify-between rounded-[25px] bg-[#36366f] p-6 text-white transition hover:bg-[#41417f]"
          >

            <div>

              <p className="text-lg font-medium">
                View public shelf
              </p>

              <p className="mt-1 text-sm text-white/55">
                See your profile as a visitor.
              </p>

            </div>


            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
              <ArrowIcon />
            </div>

          </Link>

        </section>
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