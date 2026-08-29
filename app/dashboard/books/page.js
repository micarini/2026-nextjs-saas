import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";
import BookShelfRow from "@/components/books/BookShelfRow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function BooksPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { status: statusFilter } = await searchParams;
  const books = await listUserBooks(user.uid);
  const filteredBooks = statusFilter
    ? books.filter((book) => book.status === statusFilter)
    : books;

  const shelves = GENRES.map((genre) => ({
    genre: genre.value,
    label: genre.label,
    books: filteredBooks.filter((book) => book.genre === genre.value),
  })).filter((shelf) => shelf.books.length > 0);

  const chipClass = (isActive) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] ${
      isActive ? "bg-[#20180f] text-white" : "border border-[#e7dfcf] bg-white text-[#6b5f4a]"
    }`;

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]" style={{ colorScheme: "light" }}>
      <div className="px-5 pb-2 pt-8">
        <p className="font-serif text-[15px] text-[#6b5f4a]">My Favourite</p>
        <h1 className="font-serif text-[40px] font-bold leading-none">BOOKS</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-5">
        <Link href="/dashboard/books" className={chipClass(!statusFilter)}>
          All
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status.value}
            href={`/dashboard/books?status=${status.value}`}
            className={chipClass(statusFilter === status.value)}
          >
            {status.label}
          </Link>
        ))}
      </div>

      <div className="px-5">
        {shelves.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#e7dfcf] bg-white p-6 text-center text-sm text-[#6b5f4a]">
            No books yet. Search for a title or add one manually to start your library.
          </div>
        ) : (
          shelves.map((shelf) => (
            <BookShelfRow key={shelf.genre} genreLabel={shelf.label} books={shelf.books} />
          ))
        )}
      </div>

      <div className="px-5 pb-4">
        <Link
          href="/dashboard/books/new"
          className="block rounded-full bg-[#20180f] py-3.5 text-center text-sm font-semibold text-white"
        >
          Add Books
        </Link>
      </div>

      <BottomNav active="library" />
    </main>
  );
}
