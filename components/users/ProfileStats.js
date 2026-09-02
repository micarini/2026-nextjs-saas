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
    <div className="flex flex-col gap-4">
      <div className="mb-2 ml-1">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Your reading journey
        </p>

        <h2 className="mt-1 text-xl font-extrabold text-gray-900">
          Keep turning the pages.
        </h2>
      </div>

      {/* Main stats Grid */}

      <div className="grid grid-cols-3 gap-3">
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

      {/* Pages Card */}

      <div className="mt-2 flex items-center justify-between rounded-3xl border border-amber-100/60 bg-amber-50/50 px-6 py-5 shadow-sm">
        <div>
          <p className="text-sm font-extrabold text-gray-900">
            Pages read
          </p>

          <p className="mt-1 text-xs font-medium text-gray-500">
            Across your finished books
          </p>
        </div>

        <p className="text-2xl font-extrabold text-amber-500">
          {totalPagesRead.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// Sub-componente de métricas
function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-50 bg-white p-5 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-md">
      <span className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      <span className="text-3xl font-extrabold text-gray-900">
        {value}
      </span>
      <div className="mt-3 h-1 w-8 rounded-full bg-amber-400/80"></div>
    </div>
  );
}