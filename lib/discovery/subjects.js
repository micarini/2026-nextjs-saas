import "server-only";
import { unstable_cache } from "next/cache";

async function fetchBooksBySubject(subject, limit) {
  let response;

  try {
    response = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=${limit}&sort=rating`,
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
  return getCachedBooksBySubject(subject, limit);
}
