import { createBook } from "@/app/dashboard/books/actions";

// Wraps a search result (from Google Books/Open Library) in a plain form
// that posts straight to createBook. This is deliberately a real form POST
// to a server action rather than a client-side <Link> navigation — a Link
// can get prefetched and mounted before the user actually clicks it, which
// made an earlier sessionStorage-handoff version of this flow flaky (the
// destination page's effect sometimes ran before the click happened). A
// form submission has no such timing window: nothing happens until the
// user actually submits it, and createBook()'s own redirect() takes it
// straight to the new book's detail page — no intermediate page is ever
// rendered.
export default function SelectSearchResultForm({ result, className, children }) {
  return (
    <form action={createBook} className={className}>
      <input type="hidden" name="title" value={result.title || ""} />
      <input type="hidden" name="author" value={result.author || ""} />
      <input type="hidden" name="description" value={result.description || ""} />
      {/* No genre in search results — parseBookForm falls back to the first genre. */}
      <input type="hidden" name="genre" value="" />
      <input type="hidden" name="status" value="to_read" />
      <input type="hidden" name="coverUrl" value={result.coverUrl || ""} />
      <input type="hidden" name="isbn" value={result.isbn || ""} />
      <input type="hidden" name="totalPages" value={result.totalPages ?? ""} />
      <input type="hidden" name="averageRating" value={result.averageRating ?? ""} />
      <input type="hidden" name="ratingsCount" value={result.ratingsCount ?? ""} />
      {children}
    </form>
  );
}
