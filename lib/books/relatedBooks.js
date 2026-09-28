import "server-only";

import { unstable_cache } from "next/cache";
import { searchOpenLibrary } from "@/lib/books/providers/openLibrary";
import { getBooksBySubject } from "@/lib/discovery/subjects";

const SUBJECTS_BY_GENRE = {
  fantasy: "fantasy",
  romance: "romance",
  mystery_thriller: "mystery_and_thrillers",
  horror: "horror",
  science_fiction: "science_fiction",
  classic: "classics",
  historical: "historical_fiction",
  non_fiction: "nonfiction",
  biography: "biography",
  poetry: "poetry",
  young_adult: "young_adult_fiction",
  self_help: "self_help",
};

const GENRE_ALIASES = {
  romance: ["romance", "romantic", "love story", "contemporary romance"],
  fantasy: ["fantasy", "epic fantasy", "high fantasy"],
  mystery_thriller: ["mystery", "thriller", "crime", "detective"],
  horror: ["horror", "gothic"],
  science_fiction: ["science fiction", "sci fi", "science-fiction"],
  historical: ["historical", "historical fiction"],
  young_adult: ["young adult", "ya fiction"],
};

function normalized(value) {
  return String(value || "").trim().toLowerCase();
}

function seedFrom(value) {
  return Array.from(normalized(value)).reduce(
    (seed, character) => ((seed * 31) + character.charCodeAt(0)) >>> 0,
    7,
  );
}

function randomizeForBook(books, seedValue) {
  let seed = seedFrom(seedValue);
  const shuffled = [...books];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

function detectGenre(genre, categories = [], shelves = []) {
  const metadata = [...categories, ...shelves].map(normalized).join(" ");

  return Object.entries(GENRE_ALIASES).find(([, aliases]) =>
    aliases.some((alias) => metadata.includes(alias)),
  )?.[0] || normalized(genre);
}

async function fetchBookSubjects(title, author) {
  const params = new URLSearchParams({
    q: `title:"${title}" author:"${author}"`,
    limit: "5",
    fields: "title,author_name,subject,subject_key",
  });

  try {
    const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const document = (data.docs || []).find(
      (entry) => normalized(entry.title) === normalized(title),
    );

    return [
      ...(Array.isArray(document?.subject) ? document.subject : []),
      ...(Array.isArray(document?.subject_key) ? document.subject_key : []),
    ];
  } catch {
    return [];
  }
}

async function fetchRelatedBooks(title, author, genre, categories = [], shelves = []) {
  const subjects = await fetchBookSubjects(title, author);
  const detectedGenre = detectGenre(genre, [...categories, ...subjects], shelves);
  const subject = SUBJECTS_BY_GENRE[detectedGenre] || detectedGenre;
  const [authorBooks, similarBooks] = await Promise.all([
    searchOpenLibrary(`author:"${author}"`),
    getBooksBySubject(subject, 16),
  ]);
  const currentTitle = normalized(title);
  const authorKey = normalized(author);

  const byTitle = (books) =>
    books.filter((book) => {
      const bookTitle = normalized(book.title);
      return bookTitle && bookTitle !== currentTitle;
    });

  const sameAuthor = byTitle(authorBooks)
    .filter((book) => normalized(book.author).includes(authorKey))
    .slice(0, 16);
  const authorTitles = new Set(sameAuthor.map((book) => normalized(book.title)));
  const bookSeed = `${title}|${author}|${detectedGenre}`;
  const randomizedAuthor = randomizeForBook(sameAuthor, `${bookSeed}|author`);
  const similar = randomizeForBook(byTitle(similarBooks)
    .filter((book) => !authorTitles.has(normalized(book.title)))
    .filter((book) => !randomizedAuthor.some(
      (authorBook) => normalized(authorBook.title) === normalized(book.title),
    )), `${bookSeed}|similar`).slice(0, 8);

  return {
    sameAuthor: randomizedAuthor.slice(0, 8),
    similar,
  };
}

const getCachedRelatedBooks = unstable_cache(
  fetchRelatedBooks,
  ["related-books-v3"],
  { revalidate: 60 * 60 * 24 },
);

export async function getRelatedBooks({ title, author, genre, categories, shelves }) {
  if (!title || !author || !genre) {
    return { sameAuthor: [], similar: [] };
  }

  try {
    return await getCachedRelatedBooks(
      String(title),
      String(author),
      String(genre),
      Array.isArray(categories) ? categories.join("|") : "",
      Array.isArray(shelves) ? shelves.join("|") : "",
    );
  } catch {
    return { sameAuthor: [], similar: [] };
  }
}
