import { notFound } from "next/navigation";
import { getUserByUsername } from "@/lib/users/users";
import { listPublishedBooksByUser } from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import BookShelfRow from "@/components/books/BookShelfRow";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const books = await listPublishedBooksByUser(profile.uid);

  const shelves = GENRES.map((genre) => ({
    genre: genre.value,
    label: genre.label,
    books: books.filter((book) => book.genre === genre.value),
  })).filter((shelf) => shelf.books.length > 0);

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 py-10 text-[#20180f]">
      <div className="mx-auto max-w-md">
        <p className="text-center font-serif text-[15px] text-[#6b5f4a]">
          {profile.displayName || profile.email}
        </p>
        <h1 className="text-center font-serif text-4xl font-bold">@{profile.username}</h1>

        <div className="mt-8">
          {shelves.length === 0 ? (
            <p className="text-center text-sm text-[#a89a7f]">No public books yet.</p>
          ) : (
            shelves.map((shelf) => (
              <BookShelfRow
                key={shelf.genre}
                genreLabel={shelf.label}
                books={shelf.books}
                hrefFor={(book) => `/books/${book.id}`}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
