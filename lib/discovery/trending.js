export async function getTrendingBooks(limit = 8) {
  let response;

  try {
    response = await fetch(`https://openlibrary.org/trending/weekly.json?limit=${limit}`);
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
