import Link from "next/link";

function Shelf({ title, books }) {
  if (!books.length) {
    return null;
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-[#20180f]">{title}</h2>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-3">
        {books.map((book, index) => {
          const params = new URLSearchParams(
            Object.entries({
              title: book.title,
              author: book.author,
              coverUrl: book.coverUrl,
              description: book.description,
              pages: book.pageCount,
              rating: book.rating,
            }).filter(([, value]) => value)
          );

          const content = (
            <>
              <div className="aspect-[0.68] overflow-hidden rounded-xl bg-[#ebe3d0] shadow-sm">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm font-semibold text-[#20180f]">{book.title}</p>
              <p className="mt-1 line-clamp-1 text-xs text-[#77766d]">{book.author}</p>
            </>
          );

          return (
            <Link
              key={`${book.title}-${index}`}
              href={`/dashboard/books/preview?${params.toString()}`}
              className="w-28 shrink-0 transition hover:-translate-y-1"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function RelatedBooksSection({ sameAuthor, similar }) {
  if (!sameAuthor.length && !similar.length) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-[#e7e3da] pt-8">
      <Shelf title="More books by this author" books={sameAuthor} />
      <Shelf title="Readers also enjoyed" books={similar} />
      <p className="mt-2 text-[11px] text-[#a09c8f]">
        Recommendations from Open Library.
      </p>
    </div>
  );
}
