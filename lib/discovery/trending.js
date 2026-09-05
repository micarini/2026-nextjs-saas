import "server-only";
import { unstable_cache } from "next/cache";

async function fetchTrendingBooks(limit) {
  // Throws on any failure instead of swallowing it into an empty array —
  // unstable_cache only writes a cache entry when this resolves, so a
  // transient Open Library outage never gets frozen into the cache for the
  // full revalidate window. getTrendingBooks() below is where the graceful
  // "just show nothing this once" fallback actually lives.
  let response;

  try {
    response = await fetch(`https://openlibrary.org/trending/weekly.json?limit=${limit}`, {
      signal: AbortSignal.timeout(6000),
    });
  } catch (err) {
    // A timed-out fetch throws a DOMException, whose `.message` is a
    // getter-only accessor — re-wrap as a plain Error so nothing downstream
    // trips trying to mutate it.
    throw new Error(`Open Library trending request failed: ${err?.name || "network error"}`);
  }

  if (!response.ok) {
    throw new Error(`Open Library trending request failed: ${response.status}`);
  }

  const data = await response.json();

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
  try {
    return await getCachedTrendingBooks(limit);
  } catch {
    return [];
  }
}
