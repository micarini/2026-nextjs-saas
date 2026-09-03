import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";

import { getTrendingBooks } from "@/lib/discovery/trending";
import { getNewReleases } from "@/lib/discovery/newReleases";
import { getBooksBySubject } from "@/lib/discovery/subjects";

import CurrentReadingCard from "@/components/books/CurrentReadingCard";
import BookShelfRow from "@/components/books/BookShelfRow";
import DiscoveryShelfRow from "@/components/books/DiscoveryShelfRow";

import ReadingGoalCard from "@/components/dashboard/ReadingGoalCard";
import MotivationCard from "@/components/dashboard/MotivationCard";

import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

const GENRE_SHELVES = [
  { label: "Fantasy", subject: "fantasy", accentColor: "rgba(167, 139, 250, 0.65)" },
  { label: "Romance", subject: "romance", accentColor: "rgba(244, 114, 182, 0.65)" },
  { label: "Classics", subject: "classics", accentColor: "rgba(180, 140, 90, 0.65)" },
  { label: "Fiction", subject: "fiction", accentColor: "rgba(52, 211, 153, 0.65)" },
  { label: "Non-fiction", subject: "nonfiction", accentColor: "rgba(148, 163, 184, 0.65)" },
  { label: "Young Adult", subject: "young_adult_fiction", accentColor: "rgba(248, 113, 113, 0.65)" },
];

export default async function DashboardPage() {
  // Obtener el usuario actual
  const user = await getCurrentUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect("/login");
  }

  // Cargar todos los datos en paralelo
  const [books, trending, newReleases, genreShelves] = await Promise.all([
    listUserBooks(user.uid),
    getTrendingBooks(16),
    getNewReleases(16),
    Promise.all(GENRE_SHELVES.map((genre) => getBooksBySubject(genre.subject, 16))),
  ]);

  // Libros que el usuario está leyendo actualmente
  const continueReading = books.filter(
    (book) => book.status === "reading"
  );

  // Libros terminados
  const completedBooks = books.filter(
    (book) => book.status === "read"
  );

  // El primer libro en lectura será el destacado
  const currentBook = continueReading[0] || null;

  // Obtener solamente el primer nombre del usuario
  const userName =
    user.displayName?.split(" ")[0] ||
    user.email?.split("@")[0] ||
    "Reader";

  return (
    <main className="min-h-screen bg-[#f7f5f0] pb-28 text-[#2c3025]">
      <div className="mx-auto w-full max-w-6xl px-5 pt-8">
        {/* =========================
            SEARCH
        ========================== */}

        <form action="/dashboard/books/new" method="GET" className="mb-6">
          <div className="flex h-14 items-center gap-3 rounded-full border border-[#e7e3da] bg-white px-5 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#77766d" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>

            <input
              type="text"
              name="q"
              placeholder="Title, author or ISBN"
              aria-label="Search to add a book"
              className="flex-1 bg-transparent text-[15px] text-[#2c3025] outline-none placeholder:text-[#a09c8f]"
            />

          </div>
        </form>

        {/* =========================
            HEADER
        ========================== */}

        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[#77766d]">
              Let&apos;s keep your reading journey going.
            </p>

            <h1 className="mt-1 font-serif text-3xl leading-tight sm:text-4xl">
              Good evening, {userName}
              <span className="ml-2 text-2xl">🌿</span>
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Botón de notificaciones */}
            <button
              type="button"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7e3da] bg-white transition hover:bg-[#f0eee8]"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />

                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </button>

            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#dcd8ce] text-sm font-medium text-[#2c3025]">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={userName}
                  className="h-full w-full object-cover"
                />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </div>
          </div>
        </header>

        {/* =========================
            HERO
            MOBILE: una debajo de otra
            DESKTOP: dos columnas
        ========================== */}

        <section className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <CurrentReadingCard book={currentBook} />

          <ReadingGoalCard
            completedBooks={completedBooks.length}
            goal={20}
          />
        </section>

        {/* =========================
            CURRENTLY READING
        ========================== */}

        {continueReading.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[#2c3025]">
                Currently reading
              </h2>

              <span className="text-sm text-[#77766d]">
                {continueReading.length} book
                {continueReading.length !== 1 ? "s" : ""}
              </span>
            </div>

            <BookShelfRow
              label=""
              books={continueReading}
              showProgress
            />
          </section>
        )}

        {/* =========================
            MOTIVATIONAL CARD
        ========================== */}

        <section className="mt-8">
          <MotivationCard />
        </section>

        {/* =========================
            DISCOVER
        ========================== */}

        <section className="mt-10">
          <div className="mb-6">
            <h2 className="font-serif text-3xl text-[#2c3025]">
              Discover
            </h2>

            <p className="mt-1 text-sm text-[#77766d]">
              Find something new for your next read.
            </p>
          </div>

          {/* Trending books */}

          <div className="mb-10">
            <DiscoveryShelfRow
              label="Trending books"
              books={trending}
              emptyMessage="Couldn't load trending books right now."
              accentColor="rgba(245, 158, 11, 0.65)"
            />
          </div>

          {/* New releases */}

          <div className="mb-10">
            <DiscoveryShelfRow
              label="New releases"
              books={newReleases}
              emptyMessage="Couldn't load new releases right now."
              accentColor="rgba(96, 165, 250, 0.65)"
            />
          </div>

          {/* Popular genres */}

          {GENRE_SHELVES.map((genre, index) => (
            <div key={genre.subject} className="mb-10 last:mb-0">
              <DiscoveryShelfRow
                label={genre.label}
                books={genreShelves[index]}
                emptyMessage={`Couldn't load ${genre.label.toLowerCase()} books right now.`}
                accentColor={genre.accentColor}
              />
            </div>
          ))}
        </section>
      </div>

      {/* Navegación inferior */}
      <BottomNav active="home" />
    </main>
  );
}