import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { listUserBooks } from "@/lib/books/books";

import { getTrendingBooks } from "@/lib/discovery/trending";
import { getNewReleases } from "@/lib/discovery/newReleases";
import { getBooksBySubject } from "@/lib/discovery/subjects";
import { tasteTagsFor } from "@/lib/books/tasteTags";

import CurrentReadingCard from "@/components/books/CurrentReadingCard";
import BookShelfRow from "@/components/books/BookShelfRow";
import DiscoveryShelfRow from "@/components/books/DiscoveryShelfRow";

import ReadingGoalCard from "@/components/dashboard/ReadingGoalCard";
import MotivationCard from "@/components/dashboard/MotivationCard";

import BottomNav from "@/components/nav/BottomNav";
import HomeSearchBar from "@/components/books/HomeSearchBar";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Obtener el usuario actual
  const user = await getCurrentUser();

  // Si no hay usuario, redirigir al login
  if (!user) {
    redirect("/login");
  }

  // Si todavía no completó el onboarding, mandarlo ahí primero
  const profile = await getCurrentUserProfile(user);

  if (!profile?.onboardingCompletedAt) {
    redirect("/");
  }

  // Los shelves de género se arman con lo que eligió en el onboarding
  // ("What do you reach for?") — si no eligió nada, cae a un set por defecto.
  const genreTags = tasteTagsFor(profile.genres);

  // Cargar todos los datos en paralelo
  const [books, trending, newReleases, genreShelves] = await Promise.all([
    listUserBooks(user.uid),
    getTrendingBooks(16),
    getNewReleases(16),
    Promise.all(genreTags.map((tag) => getBooksBySubject(tag.subject, 16))),
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
            goal={profile.yearlyGoal || 20}
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
              accentColor="rgba(201, 226, 101, 0.85)"
            />
          </div>

          {/* New releases */}

          <div className="mb-10">
            <DiscoveryShelfRow
              label="New releases"
              books={newReleases}
              emptyMessage="Couldn't load new releases right now."
              accentColor="rgba(108, 99, 255, 0.8)"
            />
          </div>

          {/* Géneros elegidos en el onboarding */}

          {genreTags.map((tag, index) => (
            <div key={tag.subject} className="mb-10 last:mb-0">
              <DiscoveryShelfRow
                label={tag.label}
                books={genreShelves[index]}
                emptyMessage={`Couldn't load ${tag.label.toLowerCase()} books right now.`}
                accentColor={tag.accentColor}
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