import Link from "next/link";

export default function SelectSearchResultForm({ result, className, children }) {
  const params = new URLSearchParams(
    Object.entries({
      title: result.title,
      author: result.author,
      description: result.description,
      coverUrl: result.coverUrl,
      // Same key the recommendations bot already uses, so the preview
      // page can resolve a real genre instead of its placeholder.
      genres: (result.genres || []).join(", "),
      pages: result.totalPages,
      rating: result.averageRating,
      ratingsCount: result.ratingsCount,
      isbn: result.isbn,
    }).filter(([, value]) => value)
  );

  return (
    <Link
      href={`/dashboard/books/preview?${params.toString()}`}
      className={className}
    >
      {children}
    </Link>
  );
}
