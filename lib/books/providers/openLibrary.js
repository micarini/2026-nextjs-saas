async function fetchWorkDescription(workKey) {
  if (!workKey) {
    return "";
  }

  try {
    const response = await fetch(`https://openlibrary.org${workKey}.json`, {
      signal: AbortSignal.timeout(2500),
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();
    const description = data.description;

    if (typeof description === "string") {
      return description;
    }

    if (description && typeof description.value === "string") {
      return description.value;
    }

    return "";
  } catch {
    return "";
  }
}

export async function searchOpenLibrary(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    fields: "key,title,author_name,cover_i,isbn,number_of_pages_median",
  });

  let response;

  try {
    response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  const results = (data.docs || [])
    .map((doc) => ({
      title: doc.title || "",
      author: (doc.author_name || []).join(", "),
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : "",
      isbn: (doc.isbn || [])[0] || "",
      totalPages:
        typeof doc.number_of_pages_median === "number" ? doc.number_of_pages_median : null,
      source: "open_library",
      workKey: doc.key || "",
    }))
    .filter((result) => result.title);

  // Open Library's search.json never returns a description, only the work
  // key. Fetch each result's work record in parallel to fill it in — same
  // approach used for the description backfill of existing books.
  const withDescriptions = await Promise.all(
    results.map(async ({ workKey, ...result }) => ({
      ...result,
      description: await fetchWorkDescription(workKey),
    })),
  );

  return withDescriptions;
}
