import Link from "next/link";


const spineWidths = [
  34,
  29,
  41,
  31,
  36,
  27,
  38,
  33,
  43,
  30,
  35,
  39,
  28,
  36,
];


const spineHeights = [
  144,
  164,
  136,
  172,
  151,
  160,
  141,
  177,
  156,
  168,
  145,
  174,
  150,
  162,
];


function chunkArray(array, size) {
  const result = [];

  for (let i = 0; i < array.length; i += size) {
    result.push(
      array.slice(i, i + size)
    );
  }

  return result;
}


function BigBookSpine({
  book,
  index,
}) {

  const width =
    spineWidths[index % spineWidths.length];

  const height =
    spineHeights[index % spineHeights.length];


  return (
    <Link
      href={`/dashboard/books/${book.id}`}
      title={`${book.title}${
        book.author
          ? ` — ${book.author}`
          : ""
      }`}
      className="
        group
        relative
        shrink-0
        origin-bottom
        transition
        duration-300
        hover:-translate-y-2
        hover:scale-[1.03]
        focus-visible:-translate-y-2
        focus-visible:outline-none
      "
      style={{
        width,
        height,
      }}
    >

      {/* BOOK */}

      <div
        className="
          absolute
          inset-0
          overflow-hidden
          rounded-[5px_5px_2px_2px]
          border
          border-black/10
          bg-[#d7d3c9]
          shadow-[3px_5px_10px_rgba(28,25,45,0.2)]
        "
      >

        {book.coverUrl ? (

          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}

            <img
              src={book.coverUrl}
              alt={book.title || "Book"}
              loading="lazy"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                transition
                duration-500
                group-hover:scale-110
              "
            />

          </>

        ) : (

          <div className="absolute inset-0 bg-gradient-to-b from-[#6665a0] via-[#47477c] to-[#30305e]" />

        )}


        {/* spine shading */}

        <div
          className="
            absolute
            inset-0
            bg-gradient-to-r
            from-black/30
            via-transparent
            to-white/15
          "
        />


        {/* top shine */}

        <div className="absolute left-[3px] top-1 bottom-1 w-px bg-white/20" />


        {/* TITLE */}

        <div className="absolute inset-y-3 left-[7px] flex items-center">

          <span
            className="
              max-h-full
              overflow-hidden
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-white
              drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]
            "
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
            }}
          >
            {book.title}
          </span>

        </div>


        {/* BOOK BOTTOM */}

        <div className="absolute inset-x-0 bottom-0 h-[4px] border-t border-white/15 bg-black/10" />

      </div>

    </Link>
  );
}


function ShelfRow({
  books,
  rowIndex,
}) {

  return (
    <div className="relative">

      {/* BOOK AREA */}

      <div
        className="
          flex
          min-h-[195px]
          items-end
          gap-[4px]
          overflow-x-auto
          overflow-y-hidden
          px-5
          pt-6
          scrollbar-hide
          sm:px-7
          lg:px-9
        "
      >

        {books.map((book, index) => (

          <BigBookSpine
            key={book.id}
            book={book}
            index={
              index +
              rowIndex * 7
            }
          />

        ))}

      </div>


      {/* SHELF TOP */}

      <div
        className="
          relative
          z-10
          h-[14px]
          rounded-[5px]
          bg-[#c9c1b1]
          shadow-[0_4px_0_#aaa18f,0_10px_18px_rgba(45,40,61,0.17)]
        "
      >

        <div className="absolute inset-x-2 top-[2px] h-[2px] rounded-full bg-white/45" />

      </div>


      {/* SHELF FRONT */}

      <div
        className="
          mx-[5px]
          h-[12px]
          rounded-b-[7px]
          bg-[#b8af9d]
          shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]
        "
      />

    </div>
  );
}


export default function AllBooksLibrary({
  books = [],
}) {

  /*
    Número de libros por fila.

    Podés subirlo a 16 o 18
    si querés estantes todavía
    más llenos en desktop.
  */

  const rows = chunkArray(
    books,
    14
  );


  if (books.length === 0) {

    return (
      <section
        className="
          rounded-[30px]
          border
          border-[#deddd7]
          bg-[#f7f7f4]
          px-6
          py-16
          text-center
        "
      >

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a877f]">
          Your bookshelf
        </p>


        <h2 className="mt-3 text-2xl font-semibold">
          No finished books yet.
        </h2>


        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#858178]">
          Books will appear here when you finish reading them.
        </p>

      </section>
    );
  }


  return (
    <section>

      {/* ALL HEADER */}

      <div className="mb-5 flex items-end justify-between gap-5">

        <div>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#77767f]">
            Complete collection
          </p>


          <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[#34343b] sm:text-[34px]">
            All my books.
          </h2>


          <p className="mt-1 text-sm text-[#89857c]">
            Every book you&apos;ve finished, together on one shelf.
          </p>

        </div>


        <div className="hidden shrink-0 rounded-full bg-[#e5e4de] px-4 py-2 sm:block">

          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#6e6d72]">
            {books.length} books
          </span>

        </div>

      </div>


      {/* BIG BOOKCASE */}

      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-[#dedbd2]
          bg-[#ece9e2]
          px-3
          pb-5
          pt-1
          shadow-[0_22px_60px_rgba(54,54,111,0.10)]
          sm:px-5
          lg:px-7
        "
      >

        {/* BACKGROUND */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-b
            from-white/40
            via-transparent
            to-[#d9d4c9]/40
          "
        />


        {/* subtle app decoration */}

        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-[#7272ad]/10 blur-3xl" />

        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-56 rounded-full bg-[#c8e75b]/10 blur-3xl" />


        {/* SHELF ROWS */}

        <div className="relative">

          {rows.map(
            (
              rowBooks,
              rowIndex
            ) => (

              <ShelfRow
                key={rowIndex}
                books={rowBooks}
                rowIndex={rowIndex}
              />

            )
          )}

        </div>

      </div>

    </section>
  );
}