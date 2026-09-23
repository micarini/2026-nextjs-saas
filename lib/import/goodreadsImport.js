// Server side of the Goodreads import. Receives already-parsed rows (see
// goodreadsCsv.js) in small batches, fills in cover/description/genres from
// Google Books (falling back to Open Library), and writes them into the same
// `books` collection the rest of the app uses.
//
// Performance note: createUserBook() re-reads the whole library for every
// single book it adds, which for a 500-book import would mean hundreds of
// thousands of Firestore reads. Here the library is read ONCE per batch and
// matched in memory with the same isSameBook() rules.

import { FieldValue } from "firebase-admin/firestore";

import {
  createStableDocumentId,
  getBookIdentity,
  isSameBook,
} from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "books";
const CONCURRENCY = 4;

/* =========================================================
   GÉNERO
   Mapeamos categorías de Google Books / subjects de Open
   Library / estantes de Goodreads a los géneros de la app.
========================================================= */

const GENRE_RULES = [
  ["young_adult", /young adult|juvenile|\bya\b|teen/],
  ["mystery_thriller", /mystery|thriller|suspense|crime|detective|noir|policial/],
  ["horror", /horror|terror|ghost|supernatural thriller/],
  ["science_fiction", /science fiction|sci-fi|scifi|dystopia|space opera|cyberpunk|ciencia ficci/],
  ["fantasy", /fantasy|fantas[ií]a|magic|dragons|fairy/],
  ["romance", /romance|romantic|love stor/],
  ["historical", /historical fiction|historical|novela hist/],
  ["classic", /classic|cl[aá]sico/],
  ["poetry", /poetry|poems|poes[ií]a/],
  ["biography", /biography|autobiography|memoir|biograf/],
  ["self_help", /self-help|self help|personal growth|autoayuda/],
  ["non_fiction", /nonfiction|non-fiction|history|psychology|philosophy|science|business|essays|ensayo|politic|economics|social science/],
];

export function guessGenre(signals = []) {
  const text = signals.join(" | ").toLowerCase();

  for (const [genre, pattern] of GENRE_RULES) {
    if (pattern.test(text)) {
      return genre;
    }
  }

  return null;
}

/* =========================================================
   METADATA (Google Books → Open Library)
========================================================= */

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function sameTitle(a, b) {
  const clean = (value) =>
    String(value || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  const first = clean(a);
  const second = clean(b);

  return Boolean(first && second) && (first.startsWith(second) || second.startsWith(first));
}

async function googleBooksLookup(query) {
  const params = new URLSearchParams({ q: query, maxResults: "5", printType: "books" });

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  const data = await fetchJson(`https://www.googleapis.com/books/v1/volumes?${params}`);
  return data?.items || [];
}

function fromGoogle(item) {
  const info = item.volumeInfo || {};

  return {
    googleBooksId: item.id || "",
    description: info.description || "",
    categories: info.categories || [],
    coverUrl: (info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || "").replace(/^http:\/\//i, "https://"),
    totalPages: typeof info.pageCount === "number" ? info.pageCount : null,
    averageRating: typeof info.averageRating === "number" ? info.averageRating : null,
    ratingsCount: typeof info.ratingsCount === "number" ? info.ratingsCount : null,
  };
}

async function openLibraryLookup(book) {
  const isbn = book.isbn13 || book.isbn10;
  const params = new URLSearchParams({
    limit: "3",
    fields: "key,title,cover_i,subject,number_of_pages_median",
  });

  if (isbn) {
    params.set("isbn", isbn);
  } else {
    params.set("title", book.title);
    if (book.author) params.set("author", book.author);
  }

  const data = await fetchJson(`https://openlibrary.org/search.json?${params}`);
  const doc = (data?.docs || []).find((entry) => isbn || sameTitle(entry.title, book.title));

  if (!doc) {
    return null;
  }

  return {
    openLibraryId: doc.key || "",
    description: "",
    categories: (doc.subject || []).slice(0, 8),
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : "",
    totalPages: typeof doc.number_of_pages_median === "number" ? doc.number_of_pages_median : null,
    averageRating: null,
    ratingsCount: null,
  };
}

export async function lookupMetadata(book) {
  const isbn = book.isbn13 || book.isbn10;

  if (isbn) {
    const [item] = await googleBooksLookup(`isbn:${isbn}`);
    if (item) return fromGoogle(item);
  }

  const titleQuery = book.author
    ? `intitle:"${book.title.replace(/"/g, "")}" inauthor:"${book.author.replace(/"/g, "")}"`
    : `intitle:"${book.title.replace(/"/g, "")}"`;

  const items = await googleBooksLookup(titleQuery);
  const match =
    items.find((item) => sameTitle(item.volumeInfo?.title, book.title) && item.volumeInfo?.imageLinks) ||
    items.find((item) => sameTitle(item.volumeInfo?.title, book.title));

  if (match) {
    return fromGoogle(match);
  }

  // Google Books had nothing (or its daily quota ran out) — try Open Library.
  return openLibraryLookup(book);
}

/* =========================================================
   ESTADO
========================================================= */

const STATUS_RANK = { to_read: 1, want_to_read: 1, dnf: 2, abandoned: 2, reading: 3, read: 4, finished: 4, completed: 4 };

function rank(status) {
  return STATUS_RANK[String(status || "").toLowerCase()] || 0;
}

/* =========================================================
   HELPERS
========================================================= */

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function toDate(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function noteTexts(book, includeReviews) {
  if (!includeReviews) return [];

  return [
    book.review ? `Goodreads review:\n${book.review}` : "",
    book.privateNotes ? `Private notes (Goodreads):\n${book.privateNotes}` : "",
  ].filter(Boolean);
}

async function addNotes(docRef, texts) {
  for (const text of texts) {
    await docRef.collection("notes").add({
      text,
      page: null,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}

/* =========================================================
   IMPORT DE UN LOTE
========================================================= */

export async function importGoodreadsBatch(userId, books, { includeReviews = true } = {}) {
  const db = getDb();
  const snapshot = await db.collection(COLLECTION).where("userId", "==", userId).get();

  // Library as plain objects; new books get pushed in so duplicates inside the
  // same CSV (or the same batch) are caught too.
  const library = snapshot.docs.map((doc) => ({ id: doc.id, ref: doc.ref, ...doc.data() }));

  // Matching is done sequentially up front (fast, in memory) so two rows of
  // the same book in one batch can't both be "new"; only the network lookups
  // run in parallel afterwards.
  const plans = books.map((book) => {
    const candidate = {
      userId,
      title: book.title,
      author: book.author,
      isbn: book.isbn13 || book.isbn10,
    };

    const existing = library.find((entry) => isSameBook(candidate, entry));

    if (existing) {
      return { book, existing };
    }

    const placeholder = { ...candidate, id: `pending-${library.length}` };
    library.push(placeholder);
    return { book, placeholder };
  });

  const seenNew = new Set();

  return mapWithConcurrency(plans, CONCURRENCY, async ({ book, existing }) => {
    try {
      /* ---------- Ya estaba en la biblioteca ---------- */

      if (existing) {
        if (!existing.ref) {
          return { title: book.title, outcome: "duplicate" };
        }

        // Only fill gaps — never overwrite what the user already set in the app.
        const updates = {};

        if (existing.rating == null && book.rating) {
          updates.rating = book.rating;
        }

        if (rank(book.status) > rank(existing.status)) {
          updates.status = book.status;
        }

        if (!existing.finishDate && book.finishDate && (updates.status || existing.status) === "read") {
          updates.finishDate = toDate(book.finishDate);
        }

        if (!Object.keys(updates).length) {
          return { title: book.title, outcome: "skipped" };
        }

        await existing.ref.update({ ...updates, updatedAt: FieldValue.serverTimestamp() });
        return { title: book.title, outcome: "updated" };
      }

      /* ---------- Libro nuevo ---------- */

      const meta = (await lookupMetadata(book)) || {};
      const categories = meta.categories || [];
      const totalPages = book.totalPages || meta.totalPages || null;

      const payload = {
        userId,
        title: book.title,
        author: book.author || "",
        authors: [book.author, ...book.additionalAuthors].filter(Boolean),
        description: meta.description || "",
        genre: guessGenre([...categories, ...book.shelves]) || GENRES[0].value,
        genres: categories.slice(0, 6),
        categories: categories.slice(0, 12),
        shelves: book.shelves.slice(0, 30),
        status: book.status,
        rating: book.rating,
        averageRating: book.averageRating ?? meta.averageRating ?? null,
        ratingsCount: meta.ratingsCount ?? null,
        coverUrl: meta.coverUrl || "",
        isbn: book.isbn13 || book.isbn10 || "",
        totalPages,
        currentPage: book.status === "read" ? totalPages || 0 : 0,
        startDate: null,
        finishDate: toDate(book.finishDate),
        targetDate: null,
        published: false,
        spotifyUrl: "",
        googleBooksId: meta.googleBooksId || "",
        openLibraryId: meta.openLibraryId || "",
        importedFrom: "goodreads",
        goodreadsId: book.goodreadsId || "",
        goodreadsDateAdded: toDate(book.dateAdded),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      payload.bookKey = getBookIdentity(payload);

      const docId = createStableDocumentId(userId, payload.bookKey);

      if (seenNew.has(docId)) {
        return { title: book.title, outcome: "duplicate" };
      }

      seenNew.add(docId);

      const docRef = db.collection(COLLECTION).doc(docId);

      try {
        // create() fails if the doc already exists, so we never clobber a book.
        await docRef.create(payload);
      } catch (error) {
        if (error.code === 6 || /already exists/i.test(error.message)) {
          return { title: book.title, outcome: "skipped" };
        }
        throw error;
      }

      await addNotes(docRef, noteTexts(book, includeReviews));

      return { title: book.title, outcome: "added", missingCover: !payload.coverUrl };
    } catch (error) {
      console.error("Goodreads import failed for", book.title, error);
      return { title: book.title, outcome: "failed" };
    }
  });
}
