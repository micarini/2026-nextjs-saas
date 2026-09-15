// Builds a compact "reading taste" summary from a user's library, so the
// recommendation AI knows what they loved, what they didn't, and what's
// already on their shelves. Kept deliberately small (capped lists, one line
// per book) so the prompt stays cheap even for libraries with 1000+ books.

const READ_STATUSES = new Set(["read", "finished", "completed"]);
const DNF_STATUSES = new Set(["dnf", "abandoned"]);
const TO_READ_STATUSES = new Set(["to_read", "want_to_read", "want-to-read"]);

function status(book) {
  return String(book.status || "").toLowerCase();
}

function rating(book) {
  const value = Number(book.rating);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function recency(book) {
  return new Date(book.finishDate || book.updatedAt || book.createdAt || 0).getTime() || 0;
}

function byRecent(a, b) {
  return recency(b) - recency(a);
}

function bookLine(book) {
  const stars = rating(book);
  const author = book.author ? ` — ${book.author}` : "";
  return `${book.title}${author}${stars ? ` (${stars}★)` : ""}`;
}

function favoriteGenres(books) {
  const counts = new Map();

  for (const book of books) {
    const genres = Array.isArray(book.genres) && book.genres.length
      ? book.genres
      : book.genre
        ? [book.genre]
        : [];

    // Higher-rated books weigh more in the "what they like" signal.
    const weight = rating(book) ? rating(book) / 3 : 1;

    for (const genre of genres) {
      const key = String(genre).trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + weight);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
}

export function buildTasteProfile(books = []) {
  const read = books.filter((book) => READ_STATUSES.has(status(book))).sort(byRecent);

  const loved = read
    .filter((book) => rating(book) >= 4)
    .sort((a, b) => rating(b) - rating(a) || byRecent(a, b));

  const disliked = [
    ...read.filter((book) => rating(book) && rating(book) <= 2),
    ...books.filter((book) => DNF_STATUSES.has(status(book))),
  ].sort(byRecent);

  const lovedOrDisliked = new Set([...loved, ...disliked]);
  const otherRead = read.filter((book) => !lovedOrDisliked.has(book));

  return {
    totalBooks: books.length,
    totalRead: read.length,
    loved: loved.slice(0, 40),
    disliked: disliked.slice(0, 20),
    otherRead: otherRead.slice(0, 40),
    reading: books.filter((book) => status(book) === "reading").slice(0, 10),
    toRead: books.filter((book) => TO_READ_STATUSES.has(status(book))).sort(byRecent).slice(0, 25),
    favoriteGenres: favoriteGenres(read.length ? read : books),
  };
}

function section(label, books) {
  if (!books.length) return "";
  return `${label}:\n${books.map((book) => `- ${bookLine(book)}`).join("\n")}\n\n`;
}

export function formatTasteProfile(profile) {
  if (!profile.totalBooks) {
    return "The reader's library is empty — they haven't added any books yet.";
  }

  return (
    `Library: ${profile.totalBooks} books, ${profile.totalRead} finished.\n` +
    `Favorite genres: ${profile.favoriteGenres.join(", ") || "unknown"}.\n\n` +
    section("Loved (rated 4-5★)", profile.loved) +
    section("Disliked (rated 1-2★ or did not finish)", profile.disliked) +
    section("Also read", profile.otherRead) +
    section("Currently reading", profile.reading) +
    section("Already on their want-to-read list", profile.toRead)
  ).trim();
}
