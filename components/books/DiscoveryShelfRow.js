export default function DiscoveryShelfRow({ label, books, emptyMessage }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[15px] font-semibold text-[#20180f]">{label}</h2>

      {books.length === 0 ? (
        <p className="text-sm text-[#a89a7f]">{emptyMessage}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {books.map((book, index) => (
            <div key={`${book.title}-${index}`} className="w-[92px] shrink-0">
              <div className="aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0] shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-tight text-[#20180f]">
                {book.title}
              </p>
              <p className="text-[11px] text-[#a89a7f]">{book.author}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
