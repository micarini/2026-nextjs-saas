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
import HomeSearchBar from "@/components/books/HomeSearchBar";

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

  return (
    <main className="min-h-screen bg-[#F8F8FA] pb-28 text-[#2c3025]">
      <div className="mx-auto w-full max-w-6xl px-5 pt-8">
        {/* =========================
            SEARCH
        ========================== */}

        <HomeSearchBar />

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
              <h2 className="text-2xl text-[#2c3025]">
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
            <h2 className="text-3xl text-[#2c3025]">
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