"use client";

import Link from "next/link";
import { useRef } from "react";

import SelectSearchResultForm from "@/components/books/SelectSearchResultForm";


function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}


export default function DiscoveryShelfRow({
  label,
  books = [],
  emptyMessage,
  accentColor = "rgba(50, 47, 122, 0.8)",

  // NUEVO
  titleHref = null,
}) {
  const scrollRef =
    useRef(null);


  function scrollByAmount(
    amount
  ) {
    scrollRef.current?.scrollBy({
      left: amount,
      behavior: "smooth",
    });
  }


  return (
    <section className="mb-8">

      {/* ========================================
          HEADER
      ========================================= */}

      <div className="mb-3 flex items-center justify-between gap-3">

        {/* TITLE */}

        {titleHref ? (
          <Link
            href={titleHref}
            className="
              group
              flex
              items-center
              gap-1.5
              text-[15px]
              font-semibold
              text-[#20180f]
              transition
              hover:text-[#322F7A]
            "
          >
            <span>
              {label}
            </span>

            <span
              className="
                translate-x-0
                text-[#a89a7f]
                transition-transform
                duration-200
                group-hover:translate-x-1
                group-hover:text-[#322F7A]
              "
            >
              <ArrowIcon />
            </span>
          </Link>
        ) : (
          <h2 className="text-[15px] font-semibold text-[#20180f]">
            {label}
          </h2>
        )}


        {/* RIGHT SIDE */}

        {books.length > 0 ? (
          <div className="flex items-center gap-1">

            {/* SEE ALL */}

            {titleHref ? (
              <Link
                href={titleHref}
                className="
                  mr-2
                  hidden
                  items-center
                  gap-1
                  text-[10px]
                  font-medium
                  text-[#8b806e]
                  transition
                  hover:text-[#322F7A]
                  sm:flex
                "
              >
                See all

                <span>
                  →
                </span>
              </Link>
            ) : null}


            {/* COUNT */}

            <span className="mr-1 text-[11px] text-[#a89a7f]">
              {books.length} book
              {books.length === 1
                ? ""
                : "s"}
            </span>


            {/* LEFT */}

            <button
              type="button"
              onClick={() =>
                scrollByAmount(
                  -260
                )
              }
              aria-label="Scroll left"
              className="
                flex
                size-6
                items-center
                justify-center
                rounded-full
                text-[#cfc4ac]
                transition
                hover:text-[#20180f]
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>


            {/* RIGHT */}

            <button
              type="button"
              onClick={() =>
                scrollByAmount(
                  260
                )
              }
              aria-label="Scroll right"
              className="
                flex
                size-6
                items-center
                justify-center
                rounded-full
                text-[#20180f]
                transition
                hover:text-[#c96a1f]
              "
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

          </div>
        ) : null}

      </div>


      {/* ========================================
          EMPTY
      ========================================= */}

      {books.length === 0 ? (

        <p className="text-sm text-[#a89a7f]">
          {emptyMessage}
        </p>

      ) : (

        /* ========================================
           SHELF
        ========================================= */

        <div className="relative">

          {/* SHELF LEDGE */}

          <div
            className="
              pointer-events-none
              absolute
              inset-x-0
              -bottom-2
              h-[52px]
              rounded-md
            "
            style={{
              backgroundColor:
                accentColor,
            }}
          >
            <span className="absolute left-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/80" />

            <span className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/80" />
          </div>


          {/* COVERS */}

          <div
            ref={scrollRef}
            className="overflow-x-auto pb-2"
          >

            <div className="flex gap-1.5">

              {books.map(
                (
                  book,
                  index
                ) => (

                  <SelectSearchResultForm
                    key={`${book.title}-${index}`}
                    result={book}
                    className="w-24 shrink-0"
                  >

                    <button
                      type="submit"
                      aria-label={`Add ${book.title}`}
                      className="
                        block
                        w-full
                        text-left
                        transition
                        hover:-translate-y-0.5
                      "
                    >

                      <div
                        className="
                          aspect-[0.68]
                          overflow-hidden
                          rounded-sm
                          bg-[#ebe3d0]
                          shadow-[0_10px_18px_rgba(0,0,0,0.22)]
                        "
                      >

                        {book.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              book.coverUrl
                            }
                            alt={
                              book.title
                            }
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : null}

                      </div>

                    </button>

                  </SelectSearchResultForm>

                )
              )}

            </div>

          </div>

        </div>

      )}

    </section>
  );
}