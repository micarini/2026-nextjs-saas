import "server-only";
import { unstable_cache } from "next/cache";

const DEFAULT_LIST = "hardcover-fiction";

async function fetchNewReleases(limit) {
  const apiKey = process.env.NYT_BOOKS_API_KEY;

  if (!apiKey) {
    return [];
  }

  let response;

  try {
    response = await fetch(
      `https://api.nytimes.com/svc/books/v3/lists/current/${DEFAULT_LIST}.json?api-key=${apiKey}`,
      { signal: AbortSignal.timeout(3000) },
    );
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  let data;

  try {
    data = await response.json();
  } catch {
    return [];
  }

  const books = data.results?.books || [];

  return books
    .slice(0, limit)
    .map((book) => ({
      title: book.title || "",
      author: book.author || "",
      coverUrl: book.book_image || "",
    }))
    .filter((book) => book.title);
}

// force-dynamic on /dashboard sets fetchCache to force-no-store for every
// fetch() call made during the render, so per-fetch `next.revalidate` is
// ignored there. unstable_cache wraps the whole function result in Next's
// Data Cache instead, independent of the route's dynamic setting.
const getCachedNewReleases = unstable_cache(fetchNewReleases, ["new-releases"], {
  revalidate: 3600,
});

export async function getNewReleases(limit = 8) {
  return getCachedNewReleases(limit);
}
