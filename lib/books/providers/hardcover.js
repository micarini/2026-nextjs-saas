// Primary book search provider — see `searchBookCovers` in ../search.js,
// which tries this first and only falls back to Google Books/Open Library
// when Hardcover has nothing (no token, a failed request, or no results
// all just mean "fall back", never an error).
//
// Requires HARDCOVER_API_TOKEN (a read-only "search the catalog" token
// from hardcover.app account settings).

const HARDCOVER_URL = "https://api.hardcover.app/v1/graphql";

const SEARCH_QUERY = `
  query Search($query: String!) {
    search(query: $query, query_type: "Book", per_page: 8, sort: "users_count:desc") {
      error
      results
    }
  }
`;

export async function searchHardcover(query) {
  const trimmed = String(query || "").trim();
  const token = process.env.HARDCOVER_API_TOKEN;

  if (!trimmed || !token) {
    return [];
  }

  let response;

  try {
    response = await fetch(HARDCOVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: { query: trimmed },
      }),
      cache: "no-store",
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

  const search = data?.data?.search;

  if (!search || search.error) {
    return [];
  }

  const hits = search.results?.hits || [];

  return hits
    .map((hit) => {
      const doc = hit.document || {};

      // Only useful to us if it actually has a cover — that's the one
      // thing this provider exists to supply.
      if (!doc.title || !doc.image?.url) {
        return null;
      }

      return {
        title: doc.title,
        author: (doc.author_names || []).join(", "),
        description: doc.description || "",
        averageRating: typeof doc.rating === "number" ? doc.rating : null,
        ratingsCount: typeof doc.ratings_count === "number" ? doc.ratings_count : null,
        coverUrl: doc.image.url,
        isbn: (doc.isbns || [])[0] || "",
        totalPages: typeof doc.pages === "number" ? doc.pages : null,
        publishedDate: doc.release_year ? String(doc.release_year) : "",
        source: "hardcover",
      };
    })
    .filter(Boolean);
}
