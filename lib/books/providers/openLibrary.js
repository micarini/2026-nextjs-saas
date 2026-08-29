export async function searchOpenLibrary(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    fields: "title,author_name,cover_i,isbn",
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

  return (data.docs || [])
    .map((doc) => ({
      title: doc.title || "",
      author: (doc.author_name || []).join(", "),
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : "",
      isbn: (doc.isbn || [])[0] || "",
      source: "open_library",
    }))
    .filter((result) => result.title);
}
