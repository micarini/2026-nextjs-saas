import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";

import { getTrendingBooks } from "@/lib/discovery/trending";
import { getNewReleases } from "@/lib/discovery/newReleases";

import CurrentReadingCard from "@/components/books/CurrentReadingCard";
import BookShelfRow from "@/components/books/BookShelfRow";
import DiscoveryShelfRow from "@/components/books/DiscoveryShelfRow";

import ReadingGoalCard from "@/components/dashboard/ReadingGoalCard";
import MotivationCard from "@/components/dashboard/MotivationCard";

import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Obtener el usuario actual
  const user = await getCurrentUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect("/login");
  }

  // Cargar todos los datos en paralelo
  const [books, trending, newReleases] = await Promise.all([
    listUserBooks(user.uid),
    getTrendingBooks(),
    getNewReleases(),
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
              accentColor="#e8a15c"
            />
          </div>

          {/* New releases */}

          <div>
            <DiscoveryShelfRow
              label="New releases"
              books={newReleases}
              emptyMessage="Couldn't load new releases right now."
              accentColor="#c96a4a"
            />
          </div>
        </section>
      </div>

      {/* Navegación inferior */}
      <BottomNav active="home" />
    </main>
  );
}