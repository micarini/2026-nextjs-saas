import Link from "next/link";

const spineWidths = [
  30,
  34,
  27,
  38,
  31,
  35,
  29,
  40,
  32,
  36,
];

const spineHeights = [
  92,
  102,
  86,
  108,
  96,
  104,
  89,
  112,
  98,
  106,
];

function BookSpine({ book, index }) {
  const width =
    spineWidths[index % spineWidths.length];

  const height =
    spineHeights[index % spineHeights.length];

  return (
    <Link
      href={`/dashboard/books/${book.id}`}
      title={`${book.title}${
        book.author ? ` — ${book.author}` : ""
      }`}
      aria-label={`Open ${book.title}`}
      className="
        group
        relative
        shrink-0
        transition-transform
        duration-200
        hover:-translate-y-1
        focus-visible:-translate-y-1
        focus-visible:outline-none
      "
      style={{
        width,
        height,
      }}
    >

      <div
        className="
          absolute
          inset-0
          overflow-hidden
          rounded-[5px_5px_2px_2px]
          border
          border-black/10
          bg-[#d8d6cf]
          shadow-[2px_3px_6px_rgba(37,35,51,0.16)]
        "
      >

        {book.coverUrl ? (

          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.coverUrl}
              alt=""
              loading="lazy"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                transition
                duration-200
                group-hover:scale-105
              "
            />
          </>

        ) : (

          <div className="absolute inset-0 bg-gradient-to-b from-[#4b4a83] to-[#31325f]" />

        )}

        {/* SOMBRA PARA DAR EFECTO DE LOMO */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10" />

        {/* TITULO VERTICAL */}
        <div className="absolute inset-y-2 left-1 flex items-center">

          <span
            className="
              max-h-full
              overflow-hidden
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.08em]
              text-white
              drop-shadow-[0_1px_2px_rgba(0,0,0,0.75)]
            "
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            {book.title}
          </span>

        </div>

      </div>

    </Link>
  );
}

function EmptyShelf() {
  return (
    <div className="flex h-[112px] items-end justify-center pb-5 text-center text-xs text-[#8a877f]">
      No books on this shelf yet.
    </div>
  );
}

export default function LibraryShelf({
  label,
  books = [],
  meta,
  maxBooks = 12,
}) {

  const visibleBooks = books.slice(0, maxBooks);

  return (
    <section
      className="
        overflow-hidden
        rounded-[26px]
        border
        border-[#deddd7]
        bg-[#f7f7f4]
        shadow-[0_10px_30px_rgba(54,54,111,0.05)]
      "
    >

      {/* SHELF HEADER */}
      <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-4">

        <div className="min-w-0">

          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[#77767f]">
            {label}
          </p>

          {meta ? (
            <p className="mt-1 text-xs text-[#9a9790]">
              {meta}
            </p>
          ) : null}

        </div>

        <span className="shrink-0 rounded-full bg-[#e7e6e1] px-2.5 py-1 font-mono text-[10px] text-[#6f6e75]">
          {books.length}
        </span>

      </div>

      {/* BOOKS */}
      <div className="relative px-4 pt-2">

        {visibleBooks.length ? (

          <div
            className="
              flex
              min-h-[124px]
              items-end
              gap-[3px]
              overflow-x-auto
              px-1
              pb-3
              pt-3
              scrollbar-hide
            "
          >

            {visibleBooks.map((book, index) => (

              <BookSpine
                key={book.id}
                book={book}
                index={index}
              />

            ))}

          </div>

        ) : (

          <EmptyShelf />

        )}

        {/* MADERA / ESTANTE */}
        <div
          className="
            relative
            h-3
            rounded-full
            bg-[#cdc8bc]
            shadow-[0_3px_0_#b5afa2,0_8px_15px_rgba(44,48,37,0.15)]
          "
        >

          <div className="absolute inset-x-3 top-[2px] h-[2px] rounded-full bg-white/45" />

        </div>

        <div className="h-5" />

      </div>

    </section>
  );
}