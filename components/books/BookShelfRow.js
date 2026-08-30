import Link from "next/link";
import RatingStars from "@/components/books/RatingStars";
import StatusBadge from "@/components/books/StatusBadge";

const defaultHrefFor = (book) => `/dashboard/books/${book.id}/edit`;

export default function BookShelfRow({ label, books, hrefFor = defaultHrefFor }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-[#20180f]">{label}</h2>
        <span className="text-[11px] text-[#a89a7f]">
          {books.length} book{books.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {books.map((book) => (
          <Link key={book.id} href={hrefFor(book)} className="w-[92px] shrink-0">
            <div className="relative aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0] shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
              ) : null}
              <StatusBadge
                status={book.status}
                currentPage={book.currentPage}
                totalPages={book.totalPages}
                className="absolute left-1.5 top-1.5"
              />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-tight text-[#20180f]">
              {book.title}
            </p>
            <p className="text-[11px] text-[#a89a7f]">{book.author}</p>
            <RatingStars rating={book.rating} />
          </Link>
        ))}
      </div>
    </section>
  );
}
