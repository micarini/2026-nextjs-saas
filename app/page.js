import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/firebase/session";
import { listPublishedBooks } from "@/lib/books/books";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const publishedBooks = await listPublishedBooks();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />

      <section className="mx-auto flex h-auto min-h-[300px] w-full max-w-6xl flex-col justify-center border-t border-zinc-800 px-4 py-8 sm:h-[300px] sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Next.js 16 + Firebase
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl lg:leading-none">
          Track your reading life
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
          A personal reading tracker: log your books, follow your progress
          and share your public shelf.
        </p>
        <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            className="inline-flex h-11 w-full items-center justify-center border border-cyan-400 bg-cyan-400 px-5 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 sm:w-auto"
            href={user ? "/dashboard" : "/login"}
          >
            {user ? "Go to dashboard" : "Sign in"}
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl border-t border-zinc-800 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Public
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-50">
              Books shared by readers
            </h2>
          </div>
          <span className="text-sm text-zinc-500">{publishedBooks.length} total</span>
        </div>

        {publishedBooks.length === 0 ? (
          <div className="border border-zinc-800 p-6 text-sm leading-6 text-zinc-400">
            No public books yet.
          </div>
        ) : (
          <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
            {publishedBooks.map((book) => (
              <article className="min-w-0 bg-zinc-950 p-5" key={book.id}>
                {book.coverUrl ? (
                  <div className="-m-5 mb-5 border-b border-zinc-800 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={book.title}
                      className="h-44 w-full object-cover"
                      src={book.coverUrl}
                    />
                  </div>
                ) : null}
                <h3 className="mt-1 overflow-wrap-anywhere text-lg font-semibold text-zinc-100">
                  {book.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{book.author}</p>
                <Link
                  className="mt-5 inline-flex h-10 w-full items-center justify-center border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                  href={`/books/${book.id}`}
                >
                  View book
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
