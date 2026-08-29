import { searchGoogleBooks } from "@/lib/books/providers/googleBooks";
import { searchOpenLibrary } from "@/lib/books/providers/openLibrary";

export async function searchBookCovers(query) {
  const googleResults = await searchGoogleBooks(query);

  if (googleResults.length > 0) {
    return googleResults;
  }

  return searchOpenLibrary(query);
}
