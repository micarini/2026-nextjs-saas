import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";

import BookRecommendationBot from "@/components/recommendations/BookRecommendationBot";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";


function normalizeGenre(value) {
  if (!value) return null;

  return String(value)
    .trim()
    .toLowerCase();
}


function getFavoriteGenres(books) {
  const genreMap = new Map();

  books.forEach((book) => {
    let genres = [];

    if (Array.isArray(book.genres)) {
      genres = book.genres;
    } else if (Array.isArray(book.genre)) {
      genres = book.genre;
    } else if (book.genre) {
      genres = String(book.genre).split(",");
    }

    genres.forEach((genre) => {
      const normalized =
        normalizeGenre(genre);

      if (!normalized) return;

      genreMap.set(
        normalized,
        (genreMap.get(normalized) || 0) + 1
      );
    });
  });

  return [...genreMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
}


export default async function RecommendationsPage() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const books =
    await listUserBooks(user.uid);

  const favoriteGenres =
    getFavoriteGenres(books);

  const existingTitles =
    books
      .map((book) => book.title)
      .filter(Boolean);

  return (
    <main className="min-h-[100dvh] bg-[#171719] pb-28 text-white">

      <BookRecommendationBot
        favoriteGenres={favoriteGenres}
        existingTitles={existingTitles}
      />

      <BottomNav />

    </main>
  );
}