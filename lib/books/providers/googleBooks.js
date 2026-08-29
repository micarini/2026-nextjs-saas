export async function searchGoogleBooks(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({ q: trimmed, maxResults: "8" });
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (apiKey) {
    params.set("key", apiKey);
  }

  let response;

  try {
    response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    );
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return (data.items || [])
    .map((item) => {
      const info = item.volumeInfo || {};
      const isbnEntry = (info.industryIdentifiers || []).find(
        (entry) => entry.type === "ISBN_13" || entry.type === "ISBN_10",
      );

      return {
        title: info.title || "",
        author: (info.authors || []).join(", "),
        coverUrl: (info.imageLinks?.thumbnail || "").replace("http://", "https://"),
        isbn: isbnEntry?.identifier || "",
        source: "google_books",
      };
    })
    .filter((result) => result.title);
}
