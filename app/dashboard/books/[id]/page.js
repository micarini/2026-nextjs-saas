import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createBook } from "@/app/dashboard/books/actions";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserBook, isSameBook, listUserBooks } from "@/lib/books/books";
import { getBookMetadata } from "@/lib/books/bookMetadata";
import { listBookNotes } from "@/lib/books/notes";
import { genreLabel } from "@/lib/books/genres";
import { getRelatedBooks } from "@/lib/books/relatedBooks";
import BookCompletionFlow from "@/components/books/BookCompletionFlow";
import PersonalRatingStars from "@/components/books/PersonalRatingStars";
import BookDatesEditor from "@/components/books/BookDatesEditor";
import NotesList from "@/components/books/NotesList";
import RelatedBooksSection from "@/components/books/RelatedBooksSection";
import BottomNav from "@/components/nav/BottomNav";
import {
  changeBookStatus,
  changeBookRating,
  changeBookProgress,
  changeBookDates,
  deleteBook,
  addNote,
  deleteNote,
} from "../actions";
import { STATUSES } from "@/lib/books/statuses";
import { matchGenre } from "@/lib/books/genreMatch";

export const dynamic = "force-dynamic";

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeBookValue(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function PreviewBookDetail({ params }) {
  const title = firstValue(params?.title) || "Recommended book";
  const author = firstValue(params?.author) || "Unknown author";
  const coverUrl = firstValue(params?.coverUrl) || "";
  const description = firstValue(params?.description) || "";
  const genres = firstValue(params?.genres) || "";
  const pages = firstValue(params?.pages) || "";
  const rating = firstValue(params?.rating) || "";
  const ratingsCount = firstValue(params?.ratingsCount) || "";
  const isbn = firstValue(params?.isbn) || "";
  // Empty when none of the provider's tags map onto our genre list —
  // better to save the book with no genre than to label everything with
  // whichever genre happens to sit first in genres.js.
  const genre = matchGenre(genres) || "";
  const relatedBooks = await getRelatedBooks({
    title,
    author,
    genre,
    categories: genres.split(",").filter(Boolean),
    shelves: [],
  });

  return (
    <main className="min-h-screen bg-[#F8F8FA] pb-28 text-[#2c3025]">
      <div className="lg:mx-auto lg:flex lg:max-w-5xl lg:items-start lg:gap-10 lg:px-6 lg:pt-10">
        <div className="relative bg-gradient-to-b from-[#eae7fb] to-[#F8F8FA] px-5 pb-10 pt-6 lg:w-72 lg:shrink-0 lg:rounded-[28px] lg:pb-14">
          <div className="flex items-center">
            <Link href="/dashboard/library" aria-label="Back" className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm">
              ←
            </Link>
          </div>
          <div className="mx-auto mt-8 w-40 lg:mt-10 lg:w-56">
            <div className="aspect-[0.68] overflow-hidden rounded-xl bg-[#e9e5da] shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt={title} className="h-full w-full object-cover" />
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto -mt-6 max-w-md rounded-t-3xl bg-white px-6 pb-8 pt-8 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] lg:mx-0 lg:mt-0 lg:max-w-xl lg:flex-1 lg:rounded-[28px] lg:pt-10 lg:shadow-[0_20px_50px_rgba(44,48,37,0.06)]">
          <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-[#322F7A]">Book preview</p>
          <h1 className="mt-2 text-center text-2xl font-bold text-[#20180f]">{title}</h1>
          <p className="mt-1 text-center text-sm text-[#77766d]">by {author}</p>

          {rating ? (
            <p className="mt-4 text-center text-sm text-[#77766d]">
              ★ {rating} / 5{ratingsCount ? ` (${ratingsCount})` : ""}
            </p>
          ) : null}

          <div className="mt-6 grid grid-cols-2 divide-x divide-[#e7e3da] rounded-2xl bg-[#f8f8fa] py-4">
            <div className="text-center">
              <p className="text-xs text-[#a09c8f]">Genre</p>
              <p className="mt-1 text-sm font-semibold text-[#20180f]">{genres.split(",")[0]?.trim() || "—"}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-[#a09c8f]">Pages</p>
              <p className="mt-1 text-sm font-semibold text-[#20180f]">{pages ? `${pages} pages` : "—"}</p>
            </div>
          </div>

          {description ? <p className="mt-6 text-sm leading-relaxed text-[#4b473f]">{description}</p> : null}

          <details className="mt-4">
            <summary className="cursor-pointer list-none rounded-xl bg-[#322F7A] py-3 text-center text-sm font-bold text-white transition hover:bg-[#403b99]">
              Add book
            </summary>
            <form action={createBook} className="mt-3 space-y-4 rounded-2xl border border-[#e7e3da] bg-[#faf9f6] p-4">
              <input type="hidden" name="title" value={title} />
              <input type="hidden" name="author" value={author} />
              <input type="hidden" name="description" value={description} />
              <input type="hidden" name="genre" value={genre} />
              {/* The provider's own tags, kept alongside the canonical
                  genre so stats can still say something useful about a
                  book whose tags didn't map onto our list. */}
              <input type="hidden" name="genres" value={genres} />
              <input type="hidden" name="coverUrl" value={coverUrl} />
              <input type="hidden" name="totalPages" value={pages} />
              <input type="hidden" name="averageRating" value={rating} />
              <input type="hidden" name="ratingsCount" value={ratingsCount} />
              <input type="hidden" name="isbn" value={isbn} />
              <label className="block text-sm font-semibold text-[#4b473f]" htmlFor="preview-status">Choose a status</label>
              <select id="preview-status" name="status" defaultValue="to_read" className="h-12 w-full rounded-xl border border-[#dedbd2] bg-white px-3 text-sm text-[#2c3025]">
                {STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
              </select>
              <button type="submit" className="h-12 w-full rounded-xl bg-[#20180f] text-sm font-bold text-white transition hover:bg-[#35291d]">
                Add to library
              </button>
            </form>
          </details>

          <div className="mt-8 rounded-2xl border border-[#e7e3da] bg-[#faf9f6] px-4 py-4">
            <h2 className="text-sm font-bold text-[#20180f]">Notes</h2>
            <p className="mt-2 text-sm leading-6 text-[#a09c8f]">
              Add this book to your library to write notes and comments.
            </p>
          </div>

          <RelatedBooksSection
            sameAuthor={relatedBooks.sameAuthor}
            similar={relatedBooks.similar}
          />
        </div>
      </div>
      <BottomNav active="home" />
    </main>
  );
}

export default async function BookDetailPage({ params, searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const { id } = await params;

  if (id === "preview") {
    const previewParams = await searchParams;
      const previewBook = {
        title: firstValue(previewParams?.title),
        author: firstValue(previewParams?.author),
        isbn: firstValue(previewParams?.isbn),
        coverUrl: firstValue(previewParams?.coverUrl),
      };
      const previewIsbn = String(firstValue(previewParams?.isbn) || "")
        .replace(/[^0-9X]/gi, "")
        .toUpperCase();
      const existingBooks = await listUserBooks(user.uid);
      const existingBook =
        (previewIsbn &&
          existingBooks.find(
            (candidate) =>
              String(candidate.isbn || "")
                .replace(/[^0-9X]/gi, "")
                .toUpperCase() === previewIsbn &&
              normalizeBookValue(candidate.title) === normalizeBookValue(previewBook.title)
          )) ||
        existingBooks.find((candidate) => isSameBook(candidate, previewBook));

    if (existingBook) {
      redirect(`/dashboard/books/${existingBook.id}`);
    }

    return <PreviewBookDetail params={previewParams} />;
  }

  const book = await getUserBook(user.uid, id);

  if (!book) {
    notFound();
  }

  const publicMetadata = book.averageRating
    ? null
    : await getBookMetadata({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
      });
  const averageRating = book.averageRating ?? publicMetadata?.averageRating;
  const ratingsCount = book.ratingsCount ?? publicMetadata?.ratingsCount;

  const notes = await listBookNotes(user.uid, id);
  const relatedBooks = await getRelatedBooks({
    title: book.title,
    author: book.author,
    genre: book.genre,
    categories: book.categories,
    shelves: book.shelves,
  });

  return (
    <main className="min-h-screen bg-[#F8F8FA] pb-28 text-[#2c3025]">
      {/* Mobile: cover panel and info card stack, unchanged. Desktop: they
          sit side by side in a wider, centered column instead of a phone-
          width card floating in the middle of the screen. */}
      <div className="lg:mx-auto lg:flex lg:max-w-5xl lg:items-start lg:gap-10 lg:px-6 lg:pt-10">
      {/* Cover panel */}
      <div className="relative bg-gradient-to-b from-[#eae7fb] to-[#F8F8FA] px-5 pb-10 pt-6 lg:w-72 lg:shrink-0 lg:rounded-[28px] lg:pb-14">
        <div className="flex items-center">
          <Link
            href="/dashboard"
            aria-label="Back"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2c3025" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        </div>

        <div className="mx-auto mt-8 w-40 lg:mt-10 lg:w-56">
          <div className="aspect-[0.68] overflow-hidden rounded-xl bg-[#e9e5da] shadow-[0_20px_40px_rgba(0,0,0,0.15)]">
            {book.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="mx-auto -mt-6 max-w-md rounded-t-3xl bg-white px-6 pb-6 pt-8 shadow-[0_-10px_30px_rgba(0,0,0,0.04)] lg:mx-0 lg:mt-0 lg:max-w-xl lg:flex-1 lg:rounded-[28px] lg:pt-10 lg:shadow-[0_20px_50px_rgba(44,48,37,0.06)]">
        <h1 className="text-center text-2xl font-bold text-[#20180f]">{book.title}</h1>
        <p className="mt-1 text-center text-sm text-[#77766d]">by {book.author}</p>

        <div className="mt-4 flex justify-center">
          {averageRating ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`text-lg ${
                    n <= Math.round(averageRating) ? "text-amber-400" : "text-[#e7e3da]"
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="ml-1 text-sm font-medium text-[#77766d]">
                {averageRating.toFixed(1)} / 5.0
                {ratingsCount ? ` (${ratingsCount})` : ""}
              </span>
            </div>
          ) : (
            <p className="text-sm text-[#a09c8f]">Not rated yet</p>
          )}
        </div>

        <div className="mt-4">
          <BookCompletionFlow
            book={book}
            statusAction={changeBookStatus.bind(null, book.id)}
            progressAction={changeBookProgress.bind(null, book.id)}
            dateAction={changeBookDates.bind(null, book.id)}
            ratingAction={changeBookRating.bind(null, book.id)}
            removeAction={deleteBook.bind(null, book.id)}
            openCompletionPrompt={book.status === "read" && !book.finishDate}
          />
        </div>

        <PersonalRatingStars
          currentRating={book.rating}
          action={changeBookRating.bind(null, book.id)}
        />

        <div className="mt-6 grid grid-cols-2 divide-x divide-[#e7e3da] rounded-2xl bg-[#f8f8fa] py-4">
          <div className="text-center">
            <p className="text-xs text-[#a09c8f]">Genre</p>
            <p className="mt-1 text-sm font-semibold text-[#20180f]">{genreLabel(book.genre)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-[#a09c8f]">Pages</p>
            <p className="mt-1 text-sm font-semibold text-[#20180f]">
              {book.totalPages ? `${book.totalPages} pages` : "—"}
            </p>
          </div>
        </div>

        <BookDatesEditor
          startDate={book.startDate}
          finishDate={book.finishDate}
          targetDate={book.targetDate}
          readingLogs={book.readingLogs}
          action={changeBookDates.bind(null, book.id)}
        />

        {book.description ? (
          <p className="mt-6 text-sm leading-relaxed text-[#4b473f]">{book.description}</p>
        ) : null}

        <div className="mt-8">
          <h2 className="text-lg font-bold text-[#20180f]">Notes</h2>
          <NotesList
            notes={notes}
            addNoteAction={addNote.bind(null, book.id)}
            deleteNoteAction={deleteNote.bind(null, book.id)}
          />
        </div>

        <RelatedBooksSection
          sameAuthor={relatedBooks.sameAuthor}
          similar={relatedBooks.similar}
        />

        <form action={deleteBook.bind(null, book.id)} className="mt-8">
          <button
            type="submit"
            className="h-11 w-full rounded-xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Delete book
          </button>
        </form>
      </div>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
