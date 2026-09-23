import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserBook } from "@/lib/books/books";
import { listBookNotes } from "@/lib/books/notes";
import { genreLabel } from "@/lib/books/genres";
import BookCompletionFlow from "@/components/books/BookCompletionFlow";
import PersonalRatingStars from "@/components/books/PersonalRatingStars";
import BookDatesEditor from "@/components/books/BookDatesEditor";
import NotesList from "@/components/books/NotesList";
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

export const dynamic = "force-dynamic";

export default async function BookDetailPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  const { id } = await params;
  const book = await getUserBook(user.uid, id);

  if (!book) {
    notFound();
  }

  const notes = await listBookNotes(user.uid, id);

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
          {book.averageRating ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`text-lg ${
                    n <= Math.round(book.averageRating) ? "text-amber-400" : "text-[#e7e3da]"
                  }`}
                >
                  ★
                </span>
              ))}
              <span className="ml-1 text-sm font-medium text-[#77766d]">
                {book.averageRating.toFixed(1)} / 5.0
                {book.ratingsCount ? ` (${book.ratingsCount})` : ""}
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
