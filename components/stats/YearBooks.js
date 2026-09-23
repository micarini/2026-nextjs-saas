import Link from "next/link";

export default function YearBooks({ books = [], year }) {
  return (
    <section className="rounded-[26px] border border-[#dedbd2] bg-[#fffefa] p-5 shadow-[0_10px_30px_rgba(54,54,111,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c8991]">
            Challenge
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#36366f]">
            Books read in {year}
          </h2>
        </div>
        <span className="text-sm font-semibold text-[#8c8991]">{books.length}</span>
      </div>

      {books.length ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {books.map((book) => (
            <Link
              key={book.id}
              href={`/dashboard/books/${book.id}`}
              className="flex min-w-0 gap-2 rounded-xl p-2 transition hover:bg-[#f4f2fa]"
            >
              <div className="h-14 w-9 shrink-0 overflow-hidden rounded bg-[#ebe3d0]">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-semibold text-[#36366f]">{book.title}</p>
                <p className="mt-1 text-[10px] text-[#8c8991]">{book.pages} pages</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-[#8c8991]">No books finished this year yet.</p>
      )}
    </section>
  );
}
