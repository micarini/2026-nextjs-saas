import "server-only";
import { unstable_cache } from "next/cache";

async function fetchBooksBySubject(subject, limit) {
  // Throws on failure rather than returning [] — see the comment in
  // lib/discovery/trending.js for why that matters for unstable_cache.
  let response;

  try {
    response = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=${limit}&sort=rating`,
      { signal: AbortSignal.timeout(6000) },
    );
  } catch (err) {
    // See lib/discovery/trending.js — a timed-out fetch throws a
    // DOMException with a getter-only `.message`, so re-wrap as a plain Error.
    throw new Error(`Open Library subjects request failed: ${err?.name || "network error"}`);
  }

  if (!response.ok) {
    throw new Error(`Open Library subjects request failed: ${response.status}`);
  }

  const data = await response.json();

  return (data.works || [])
    .slice(0, limit)
    .map((work) => ({
      title: work.title || "",
      author: (work.authors || []).map((author) => author.name).join(", "),
      coverUrl: work.cover_id
        ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
        : "",
    }))
    .filter((book) => book.title);
}

// Same reasoning as lib/discovery/trending.js: force-dynamic on /dashboard
// disables per-fetch caching, so unstable_cache wraps the whole result
// instead. Arguments (subject, limit) are folded into the cache key
// automatically, so each genre gets its own cache entry.
const getCachedBooksBySubject = unstable_cache(fetchBooksBySubject, ["books-by-subject"], {
  revalidate: 3600,
});

export async function getBooksBySubject(subject, limit = 16) {
  try {
    return await getCachedBooksBySubject(subject, limit);
  } catch {
    return [];
  }
}
