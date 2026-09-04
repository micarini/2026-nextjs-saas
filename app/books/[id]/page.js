import { notFound } from "next/navigation";
import { getPublishedBook } from "@/lib/books/books";
import { genreLabel } from "@/lib/books/genres";
import { statusLabel } from "@/lib/books/statuses";
import RatingStars from "@/components/books/RatingStars";

export const dynamic = "force-dynamic";

export default async function PublicBookPage({ params }) {
  const { id } = await params;
  const book = await getPublishedBook(id);

  if (!book) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 py-10 text-[#20180f]" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-md">
        <div className="mx-auto w-48 overflow-hidden rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt={book.title} className="w-full object-cover" />
          ) : null}
        </div>

        <h1 className="mt-6 text-center text-3xl font-bold">{book.title}</h1>
        <p className="mt-1 text-center text-[#a89a7f]">{book.author}</p>

        <div className="mt-4 flex justify-center gap-2 text-[11px]">
          <span className="rounded-full bg-white px-3 py-1">{genreLabel(book.genre)}</span>
          <span className="rounded-full bg-white px-3 py-1">{statusLabel(book.status)}</span>
        </div>

        <div className="mt-3 flex justify-center">
          <RatingStars rating={book.rating} />
        </div>
      </div>
    </main>
  );
}
