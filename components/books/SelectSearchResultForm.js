import Link from "next/link";

export default function SelectSearchResultForm({ result, className, children }) {
  const params = new URLSearchParams(
    Object.entries({
      title: result.title,
      author: result.author,
      description: result.description,
      coverUrl: result.coverUrl,
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
