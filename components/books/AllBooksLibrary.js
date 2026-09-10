"use client";

import { useState } from "react";

import BookSpine from "@/components/books/BookSpine";


function chunkArray(array, size) {
  const result = [];

  for (
    let i = 0;
    i < array.length;
    i += size
  ) {
    result.push(
      array.slice(i, i + size)
    );
  }

  return result;
}


function ShelfRow({
  books,
  rowIndex,
  openBookId,
  onBookToggle,
}) {
  return (
    <div className="relative">

      {/* BOOKS */}

      <div
        className="
          flex
          min-h-[215px]
          items-end
          gap-[4px]
          overflow-x-auto
          overflow-y-hidden
          px-5
          pt-7
          scrollbar-hide
          sm:px-7
          lg:px-9
        "
      >
        {books.map(
          (book, index) => (
            <BookSpine
              key={book.id}
              book={book}
              index={
                index +
                rowIndex * 6
              }
              size="large"
              isOpen={
                openBookId === book.id
              }
              onToggle={
                onBookToggle
              }
            />
          )
        )}
      </div>


      {/* ESTANTE */}

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


      <div
        className="
          mx-[5px]
          h-[12px]
          rounded-b-[7px]
          bg-[#b8af9d]
        "
      />

    </div>
  );
}


export default function AllBooksLibrary({
  books = [],
}) {
  const [openBookId, setOpenBookId] =
    useState(null);


  const rows = chunkArray(
    books,
    14
  );


  function handleBookToggle(bookId) {
    setOpenBookId((current) =>
      current === bookId
        ? null
        : bookId
    );
  }


  if (!books.length) {
    return (
      <section className="rounded-[30px] border border-[#deddd7] bg-[#f7f7f4] px-6 py-16 text-center">

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#8a877f]">
          Your bookshelf
        </p>

        <h2 className="mt-3 text-2xl font-semibold">
          No finished books yet.
        </h2>

      </section>
    );
  }


  return (
    <section>

      {/* HEADER */}

      <div className="mb-5 flex items-end justify-between gap-5">

        <div>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#77767f]">
            Complete collection
          </p>

          <h2 className="mt-1 text-[28px] font-semibold tracking-[-0.03em] text-[#34343b] sm:text-[34px]">
            All my books.
          </h2>

          <p className="mt-1 text-sm text-[#89857c]">
            Tap a spine to reveal its cover.
          </p>

        </div>


        <div className="hidden rounded-full bg-[#e5e4de] px-4 py-2 sm:block">

          <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#6e6d72]">
            {books.length} books
          </span>

        </div>

      </div>


      {/* GRAN BIBLIOTECA */}

      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          border
          border-[#dedbd2]
          bg-[#ece9e2]
          px-3
          pb-6
          pt-3
          shadow-[0_22px_60px_rgba(54,54,111,0.10)]
          sm:px-5
          lg:px-7
        "
      >

        {/* fondo */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-b
            from-white/50
            via-transparent
            to-[#d8d2c7]/40
          "
        />


        {/* glow violeta */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-64
            w-64
            rounded-full
            bg-[#6967a0]/10
            blur-3xl
          "
        />


        {/* BOOK ROWS */}

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
                openBookId={
                  openBookId
                }
                onBookToggle={
                  handleBookToggle
                }
              />
            )
          )}

        </div>

      </div>

    </section>
  );
}