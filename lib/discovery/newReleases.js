const DEFAULT_LIST = "hardcover-fiction";

export async function getNewReleases(limit = 8) {
  const apiKey = process.env.NYT_BOOKS_API_KEY;

  if (!apiKey) {
    return [];
  }

  let response;

  try {
    response = await fetch(
      `https://api.nytimes.com/svc/books/v3/lists/current/${DEFAULT_LIST}.json?api-key=${apiKey}`,
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
