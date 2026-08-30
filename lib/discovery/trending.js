import "server-only";
import { unstable_cache } from "next/cache";

async function fetchTrendingBooks(limit) {
  let response;

  try {
    response = await fetch(`https://openlibrary.org/trending/weekly.json?limit=${limit}`, {
      signal: AbortSignal.timeout(3000),
    });
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

  return (data.works || [])
    .slice(0, limit)
    .map((work) => ({
      title: work.title || "",
      author: (work.author_name || []).join(", "),
      coverUrl: work.cover_i
        ? `https://covers.openlibrary.org/b/id/${work.cover_i}-M.jpg`
        : "",
    }))
    .filter((book) => book.title);
}

// force-dynamic on /dashboard sets fetchCache to force-no-store for every
// fetch() call made during the render, so per-fetch `next.revalidate` is
// ignored there. unstable_cache wraps the whole function result in Next's
// Data Cache instead, independent of the route's dynamic setting.
const getCachedTrendingBooks = unstable_cache(fetchTrendingBooks, ["trending-books"], {
  revalidate: 3600,
});

export async function getTrendingBooks(limit = 8) {
  return getCachedTrendingBooks(limit);
}
