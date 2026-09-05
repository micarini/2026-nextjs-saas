import "server-only";

// Open Library's search.json groups every edition of a work under
// `edition_key` (an array of edition OLIDs) — the covers API can render any
// of them directly by OLID, no extra per-edition lookups needed. This is
// what powers "pick a different cover" both before and after a book is
// saved.
export async function getCoverOptions(title, author) {
  const query = `${title || ""} ${author || ""}`.trim();

  if (!query) {
    return [];
  }

  const params = new URLSearchParams({
    q: query,
    limit: "1",
    fields: "edition_key,first_publish_year",
  });

  let response;

  try {
    response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`, {
      signal: AbortSignal.timeout(6000),
    });
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const doc = data.docs?.[0];

  if (!doc) {
    return [];
  }

  const editionKeys = Array.from(new Set(doc.edition_key || [])).slice(0, 9);

  return editionKeys.map((olid) => ({
    olid,
    coverUrl: `https://covers.openlibrary.org/b/olid/${olid}-L.jpg`,
  }));
}
