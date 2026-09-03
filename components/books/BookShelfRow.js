import Link from "next/link";
import RatingStars from "@/components/books/RatingStars";

function defaultHrefFor(book) {
  return `/dashboard/books/${book.id}`;
}

export default function BookShelfRow({
  label,
  books = [],
  hrefFor = defaultHrefFor,
  showProgress = false,
}) {
  if (!books.length) {
    return null;
  }

  return (
    <section>
      {/* El título solo aparece si enviamos una etiqueta */}
      {label ? (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-[#2c3025]">
            {label}
          </h2>

          <span className="text-xs text-[#8a877f]">
            {books.length} book{books.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      {/* Carrusel horizontal */}
      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-3 scrollbar-hide">
        {books.map((book) => {
          const progress =
            book.totalPages > 0
              ? Math.min(
                  100,
                  Math.round(
                    ((book.currentPage || 0) / book.totalPages) * 100
                  )
                )
              : 0;

          return (
            <Link
              key={book.id}
              href={hrefFor(book)}
              className="w-[135px] shrink-0"
            >
              {/* PORTADA */}
              <div className="relative aspect-[0.68] overflow-hidden rounded-2xl bg-[#e9e5da] shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4 text-center">
                    <span className="font-serif text-sm text-[#77766d]">
                      {book.title}
                    </span>
                  </div>
                )}
              </div>

              {/* INFORMACIÓN */}
              <div className="pt-3">
                {showProgress ? (
                  /* CURRENTLY READING: solo título + porcentaje */
                  <>
                    <h3 className="truncate text-sm font-medium leading-snug text-[#2c3025]">
                      {book.title}
                    </h3>

                    <p className="mt-1 text-xs font-medium text-[#8a877f]">
                      {progress}%
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-[#2c3025]">
                      {book.title}
                    </h3>

                    <p className="mt-1 truncate text-xs text-[#858178]">
                      {book.author || "Unknown author"}
                    </p>

                    {/* RATING PARA LAS DEMÁS ESTANTERÍAS */}
                    <div className="mt-2">
                      <RatingStars rating={book.rating} />
                    </div>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}