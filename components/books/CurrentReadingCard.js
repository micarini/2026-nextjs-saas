import Link from "next/link";

export default function CurrentReadingCard({ book }) {
  if (!book) {
    return (
      <section className="rounded-3xl border border-[#e7dfcf] bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b806d]">
          Currently reading
        </p>

        <h2 className="mt-4 font-serif text-2xl text-[#2c3025]">
          You&apos;re not reading anything yet.
        </h2>

        <Link
          href="/dashboard/books/new"
          className="mt-5 inline-flex rounded-full bg-[#4f6549] px-5 py-3 text-sm font-medium text-white"
        >
          Find a book
        </Link>
      </section>
    );
  }

  const progress =
    book.totalPages > 0
      ? Math.min(
          100,
          Math.round((book.currentPage / book.totalPages) * 100)
        )
      : 0;

  return (
    <section className="rounded-3xl border border-[#e7dfcf] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7566]">
        Currently reading
      </p>

      <div className="mt-5 flex gap-4">
        <div className="w-28 shrink-0 overflow-hidden rounded-xl bg-[#e9e5da] shadow-md">
          <div className="aspect-[0.68]">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="font-serif text-2xl leading-tight text-[#2c3025]">
            {book.title}
          </h2>

          <p className="mt-1 text-sm text-[#7d7a70]">
            {book.author}
          </p>

          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between text-xs text-[#77766d]">
              <span>
                Page {book.currentPage || 0} of {book.totalPages || "?"}
              </span>

              <span>{progress}%</span>
            </div>

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ece9e1]">
              <div
                className="h-full rounded-full bg-[#4f6549]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <Link
        href={`/dashboard/books/${book.id}/edit`}
        className="mt-5 flex w-full items-center justify-center rounded-full bg-[#4f6549] py-3 text-sm font-medium text-white transition hover:bg-[#40553b]"
      >
        Update progress
      </Link>
    </section>
  );
}