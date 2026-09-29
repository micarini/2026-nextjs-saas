import Link from "next/link";

export default function BookSearchResults({ results }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {results.map((result, index) => (
        <Link
          key={`${result.source}-${result.isbn || result.title}-${index}`}
          href={`/dashboard/books/preview?${new URLSearchParams(
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
          ).toString()}`}
          className="block w-full text-left"
        >
          <div className="relative aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0]">
            {result.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.coverUrl}
                alt={result.title}
                className="h-full w-full object-cover"
              />
            ) : null}

            {result.recommended && result.editionCount > 1 ? (
              <span className="absolute left-1 top-1 rounded-full bg-[#322F7A] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                Most popular
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-tight text-[#20180f]">
            {result.title}
          </p>
          <p className="text-[11px] text-[#a89a7f]">
            {result.author}
            {!result.recommended && result.editionYear ? ` · ${result.editionYear} edition` : ""}
          </p>
        </Link>
      ))}
    </div>
  );
}
