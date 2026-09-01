export default function ProfileStats({ books = [] }) {
  const totalBooks = books.length;

  const readingBooks = books.filter(
    (book) => book.status === "reading"
  ).length;

  const finishedBooks = books.filter(
    (book) => book.status === "read"
  ).length;

  const totalPagesRead = books
    .filter((book) => book.status === "read")
    .reduce(
      (total, book) => total + (book.totalPages || 0),
      0
    );

  return (
    <section className="rounded-3xl border border-[#e7dfcf] bg-[#f0eee7] p-5">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f765f]">
          Your reading journey
        </p>

        <h2 className="mt-2 font-serif text-2xl text-[#2c3025]">
          Keep turning the pages.
        </h2>
      </div>

      {/* Main stats */}

      <div className="grid grid-cols-3 divide-x divide-[#dcd8ce]">
        <Stat
          value={totalBooks}
          label="Books"
        />

        <Stat
          value={finishedBooks}
          label="Finished"
        />

        <Stat
          value={readingBooks}
          label="Reading"
        />
      </div>

      {/* Pages */}

      <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/70 px-4 py-4">
        <div>
          <p className="text-sm font-medium text-[#2c3025]">
            Pages read
          </p>

          <p className="mt-1 text-xs text-[#858178]">
            Across your finished books
          </p>
        </div>

        <p className="font-serif text-2xl text-[#59634f]">
          {totalPagesRead.toLocaleString()}
        </p>
      </div>
    </section>
  );
}

function Stat({ value, label }) {
  return (
    <div className="px-2 text-center">
      <p className="font-serif text-3xl text-[#2c3025]">
        {value}
      </p>

      <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-[#858178]">
        {label}
      </p>
    </div>
  );
}