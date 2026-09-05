import Link from "next/link";

export default function CurrentReadingCard({ book }) {
  // ============================================================================
  // EMPTY STATE: Si no pasas ningún libro, muestra la tarjeta de "Find a book"
  // ============================================================================
  if (!book) {
    return (
      <section className="rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Currently reading
        </p>

        <h2 className="mt-3 text-xl font-extrabold text-gray-900">
          You&apos;re not reading anything yet.
        </h2>

        <Link
          href="/dashboard/books/new"
          className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#322F7A] text-base font-extrabold text-white shadow-[0_8px_20px_rgba(50,47,122,0.3)] transition-all hover:scale-[1.02] hover:bg-[#3d3993]"
        >
          Find a book
        </Link>
      </section>
    );
  }

  // ============================================================================
  // CURRENT BOOK: Calcula el progreso y muestra el libro actual
  // ============================================================================
  const progress =
    book.totalPages > 0
      ? Math.min(
          100,
          Math.round((book.currentPage / book.totalPages) * 100)
        )
      : 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      {/* Fondo sutil con gradiente (Opcional para que destaque como en tus referencias) */}
      <div className="absolute right-0 top-0 -z-10 h-40 w-40 rounded-bl-full bg-gradient-to-bl from-[#EDEBF7]/70 to-transparent blur-2xl" />

      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
        Continue Reading
      </p>

      <div className="mt-5 flex gap-5">
        {/* PORTADA */}
        <div className="w-24 shrink-0 overflow-hidden rounded-2xl bg-gray-100 border border-gray-100 shadow-sm">
          <div className="aspect-[0.68]">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full bg-gray-100" />
            )}
          </div>
        </div>

        {/* INFO Y PROGRESO */}
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="text-xl font-extrabold leading-tight text-gray-900 line-clamp-2">
            {book.title}
          </h2>

          <p className="mt-1 text-sm font-medium text-gray-500 line-clamp-1">
            {book.author}
          </p>

          <div className="mt-auto pt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-bold text-gray-600">
              <span>
                Page {book.currentPage || 0} of {book.totalPages || "?"}
              </span>
              <span>{progress}%</span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-gray-200/60 shadow-inner">
              <div
                className="h-full rounded-full bg-[#322F7A]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <Link
        href={`/dashboard/books/${book.id}`}
        className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-[#322F7A] text-base font-extrabold text-white shadow-[0_4px_14px_rgba(50,47,122,0.4)] transition-all hover:scale-[1.02] hover:bg-[#3d3993]"
      >
        Update progress
      </Link>
    </section>
  );
}