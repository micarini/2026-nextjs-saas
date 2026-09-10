function Cover({ book }) {
  if (!book) {
    return (
      <div className="h-16 w-11 rounded-[4px] bg-[#e6e3dc]" />
    );
  }

  if (book.coverUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={book.coverUrl}
        alt={book.title}
        className="h-16 w-11 rounded-[4px] object-cover shadow-sm"
      />
    );
  }

  return (
    <div className="flex h-16 w-11 items-center justify-center rounded-[4px] bg-[#5f6294] px-1 text-center text-[7px] font-semibold leading-tight text-white shadow-sm">
      {book.title}
    </div>
  );
}

function BookInfo({
  book,
  label,
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">

      <Cover book={book} />

      <div className="min-w-0">

        <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[#9a9790]">
          {label}
        </p>

        <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-4 text-[#36366f]">
          {book?.title ||
            "No data"}
        </p>

        {book?.pages ? (
          <p className="mt-1 text-[10px] text-[#8d8991]">
            {book.pages}p
          </p>
        ) : null}

      </div>

    </div>
  );
}

export default function BookExtremes({
  longest,
  shortest,
}) {
  return (
    <div className="grid grid-cols-2 gap-5">

      <BookInfo
        book={longest}
        label="Longest"
      />

      <BookInfo
        book={shortest}
        label="Shortest"
      />

    </div>
  );
}