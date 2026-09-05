import { searchGoogleBooks } from "@/lib/books/providers/googleBooks";
import { searchOpenLibrary } from "@/lib/books/providers/openLibrary";

function normalizeKey(result) {
  return `${result.title.trim().toLowerCase()}|${result.author.trim().toLowerCase()}`;
}

function extractYear(publishedDate) {
  const match = /\d{4}/.exec(publishedDate || "");
  return match ? Number(match[0]) : null;
}

function editionScore(result) {
  // Higher wins. A cover image matters most (a result with no cover is
  // never worth showing over one that has one), then ratingsCount as a
  // stand-in for "most popular edition" — the same signal Goodreads uses
  // to pick which edition's cover is the default for a book — then how
  // recent the edition is, as the final tiebreaker.
  let score = 0;
  if (result.coverUrl) score += 1_000_000;
  score += (result.ratingsCount || 0) * 1000;
  score += extractYear(result.publishedDate) || 0;
  return score;
}

// Google Books returns one entry per *edition*, so the same title can show
// up several times (hardcover, reissue, movie tie-in...) each with its own
// cover. This groups those editions back together and ranks them, so the
// most-popular-looking one leads and the others are still reachable right
// behind it instead of scattered through the raw result order.
function rankEditions(results) {
  const groups = new Map();
  const order = [];

  for (const result of results) {
    const key = normalizeKey(result);

    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }

    groups.get(key).push(result);
  }

  const ranked = [];

  for (const key of order) {
    const editions = groups.get(key).sort((a, b) => editionScore(b) - editionScore(a));

    editions.forEach((edition, index) => {
      ranked.push({
        ...edition,
        editionYear: extractYear(edition.publishedDate),
        recommended: index === 0,
        editionCount: editions.length,
      });
    });
  }

  return ranked;
}

export async function searchBookCovers(query) {
  const googleResults = await searchGoogleBooks(query);

  if (googleResults.length > 0) {
    return rankEditions(googleResults);
  }

  // Open Library's search.json is already one result per work (not per
  // edition), so there's nothing to rank — just fill in the same shape.
  return (await searchOpenLibrary(query)).map((result) => ({
    ...result,
    editionYear: null,
    recommended: true,
    editionCount: 1,
  }));
}

// For compact spots with no room to show alternate editions (the home
// search dropdown) — one result per distinct title, always the recommended
// edition.
export function recommendedOnly(results) {
  return results.filter((result) => result.recommended);
}
