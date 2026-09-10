"use client";

import { useState } from "react";

import BookSpine from "@/components/books/BookSpine";


function EmptyShelf() {
  return (
    <div className="flex h-[120px] items-end justify-center pb-5 text-xs text-[#8a877f]">
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
  const [openBookId, setOpenBookId] =
    useState(null);


  const visibleBooks =
    books.slice(0, maxBooks);


  function handleBookToggle(bookId) {
    setOpenBookId((current) =>
      current === bookId
        ? null
        : bookId
    );
  }


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

      {/* HEADER */}

      <div className="flex items-center justify-between gap-4 px-5 pb-2 pt-4">

        <div className="min-w-0">

          <p className="truncate font-mono text-[10px] uppercase tracking-[0.18em] text-[#77767f]">
            {label}
          </p>

          {meta && (
            <p className="mt-1 text-xs text-[#9a9790]">
              {meta}
            </p>
          )}

        </div>


        <span className="rounded-full bg-[#e7e6e1] px-2.5 py-1 font-mono text-[10px] text-[#6f6e75]">
          {books.length}
        </span>

      </div>


      {/* BOOKS */}

      <div className="relative px-4 pt-2">

        {visibleBooks.length ? (

          <div
            className="
              flex
              min-h-[132px]
              items-end
              gap-[3px]
              overflow-x-auto
              overflow-y-hidden
              px-1
              pb-3
              pt-3
              scrollbar-hide
            "
          >

            {visibleBooks.map(
              (book, index) => (
                <BookSpine
                  key={book.id}
                  book={book}
                  index={index}
                  size="small"
                  isOpen={
                    openBookId ===
                    book.id
                  }
                  onToggle={
                    handleBookToggle
                  }
                />
              )
            )}

          </div>

        ) : (

          <EmptyShelf />

        )}


        {/* ESTANTE */}

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