import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";
import { getTrendingBooks } from "@/lib/discovery/trending";
import { getNewReleases } from "@/lib/discovery/newReleases";
import BookShelfRow from "@/components/books/BookShelfRow";
import DiscoveryShelfRow from "@/components/books/DiscoveryShelfRow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { status: statusFilter } = await searchParams;

  const [books, trending, newReleases] = await Promise.all([
    listUserBooks(user.uid),
    getTrendingBooks(),
    getNewReleases(),
  ]);

  const continueReading = books.filter((book) => book.status === "reading");
  const wantToRead = books.filter((book) => book.status === "to_read");

  const filteredBooks = statusFilter
    ? books.filter((book) => book.status === statusFilter)
    : books;

  const genreShelves = GENRES.map((genre) => ({
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

      <form action="/dashboard/books/new" method="GET" className="px-5 pb-6">
        <div className="flex h-12 items-center gap-2 rounded-full border border-[#e7dfcf] bg-white px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a89a7f" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Search to add a book..."
            className="flex-1 bg-transparent text-sm text-[#20180f] outline-none placeholder:text-[#a89a7f]"
          />
        </div>
      </form>

      <div className="px-5">
        {continueReading.length > 0 ? (
          <BookShelfRow label="Continue reading" books={continueReading} />
        ) : null}

        {wantToRead.length > 0 ? (
          <BookShelfRow label="Want to read" books={wantToRead} />
        ) : null}

        <DiscoveryShelfRow
          label="Most popular this week"
          books={trending}
          emptyMessage="Couldn't load trending books right now."
        />

        <DiscoveryShelfRow
          label="New releases"
          books={newReleases}
          emptyMessage="Couldn't load new releases right now."
        />

        <DiscoveryShelfRow
          label="Recommendations"
          books={[]}
          emptyMessage="Coming soon — personalized picks based on your reading history."
        />
      </div>

      <div className="mt-2 border-t border-[#e7dfcf] px-5 pb-5 pt-6">
        <h2 className="mb-4 font-serif text-2xl font-bold">Your library</h2>

        <div className="flex gap-2 overflow-x-auto">
          <Link href="/dashboard" className={chipClass(!statusFilter)}>
            All
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status.value}
              href={`/dashboard?status=${status.value}`}
              className={chipClass(statusFilter === status.value)}
            >
              {status.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-5">
        {genreShelves.length === 0 ? (
          <div className="mt-4 rounded-lg border border-[#e7dfcf] bg-white p-6 text-center text-sm text-[#6b5f4a]">
            No books yet. Search above or add one manually to start your library.
          </div>
        ) : (
          genreShelves.map((shelf) => (
            <BookShelfRow key={shelf.genre} label={shelf.label} books={shelf.books} />
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

      <BottomNav active="home" />
    </main>
  );
}
