export default function DiscoveryShelfRow({
  label,
  books = [],
  emptyMessage,
  accentColor = "#e8a15c",
}) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-[#20180f]">{label}</h2>

        {books.length > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#a89a7f]">
              {books.length} book{books.length === 1 ? "" : "s"}
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cfc4ac" strokeWidth="2.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#20180f" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        ) : null}
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-[#a89a7f]">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="relative inline-flex items-end pb-9 pt-2">
            <div
              className="absolute inset-x-2 bottom-6 h-[34px] rounded-md"
              style={{ backgroundColor: accentColor, boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.08)", zIndex: 0 }}
            >
              <span className="absolute left-2.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/70" />
              <span className="absolute right-2.5 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/70" />
            </div>

            {books.map((book, index) => (
              <div
                key={`${book.title}-${index}`}
                className="relative w-[82px] shrink-0"
                style={{
                  marginLeft: index === 0 ? 0 : "-24px",
                  transform: `rotate(${index % 2 === 0 ? -2 : 1.5}deg)`,
                  zIndex: index + 1,
                }}
              >
                <div className="aspect-[0.68] overflow-hidden rounded-[4px] bg-[#ebe3d0] shadow-[0_10px_18px_rgba(0,0,0,0.22)]">
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
