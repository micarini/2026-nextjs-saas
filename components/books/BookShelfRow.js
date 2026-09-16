import Link from "next/link";

import RatingStars from "@/components/books/RatingStars";
import StatusBadge from "@/components/books/StatusBadge";


const defaultHrefFor = (
  book
) =>
  `/dashboard/books/${book.id}/edit`;


function ArrowIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}


export default function BookShelfRow({
  label,
  books,
  hrefFor = defaultHrefFor,
  titleHref = null,
}) {
  return (
    <section className="mb-8">

      <div className="mb-3 flex items-center justify-between gap-3">

        {titleHref ? (
          <Link
            href={titleHref}
            className="
              group
              inline-flex
              items-center
              gap-1
              text-[15px]
              font-semibold
              text-[#20180f]
            "
          >
            {label}

            <span
              className="
                translate-x-0
                text-[#a89a7f]
                transition
                group-hover:translate-x-1
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


        <span className="shrink-0 text-[11px] text-[#a89a7f]">
          {books.length} book
          {books.length === 1
            ? ""
            : "s"}
        </span>

      </div>


      <div className="flex gap-3 overflow-x-auto pb-2">

        {books.map(
          (book) => (
            <Link
              key={book.id}
              href={
                hrefFor(book)
              }
              className="w-[92px] shrink-0"
            >

              <div
                className="
                  relative
                  aspect-[0.68]
                  overflow-hidden
                  rounded-md
                  bg-[#ebe3d0]
                  shadow-[0_8px_18px_rgba(0,0,0,0.15)]
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


                <StatusBadge
                  status={
                    book.status
                  }
                  currentPage={
                    book.currentPage
                  }
                  totalPages={
                    book.totalPages
                  }
                  className="absolute left-1.5 top-1.5"
                />

              </div>


              <p className="mt-1.5 line-clamp-2 text-[13px] leading-tight text-[#20180f]">
                {book.title}
              </p>


              <p className="text-[11px] text-[#a89a7f]">
                {book.author}
              </p>


              <RatingStars
                rating={
                  book.rating
                }
              />

            </Link>
          )
        )}

      </div>

    </section>
  );
}