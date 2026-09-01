import Link from "next/link";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

import { getCurrentUser } from "@/lib/firebase/session";
import { listPublishedBooks } from "@/lib/books/books";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  const profile = user
    ? await getCurrentUserProfile(user)
    : null;

  const publishedBooks = await listPublishedBooks();

  return (
    <main className="min-h-screen overflow-hidden bg-[#fafaff] text-zinc-900">
      <Navbar user={user} profile={profile} />

      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="relative">
        {/* BACKGROUND BLOBS */}

        <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl" />

        <div className="absolute right-[-10rem] top-0 h-[30rem] w-[30rem] rounded-full bg-violet-300/40 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-16 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* EYEBROW */}

            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-xs font-bold text-violet-700 shadow-sm backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-pink-500" />

              YOUR PERSONAL READING SPACE
            </div>

            {/* TITLE */}

            <h1 className="mt-7 text-5xl font-bold leading-[0.95] tracking-tight text-zinc-900 sm:text-6xl lg:text-8xl">
              Your reading life,
              <span className="block bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                beautifully organized.
              </span>
            </h1>

            {/* DESCRIPTION */}

            <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-zinc-500 sm:text-lg sm:leading-8">
              Track every book you read, discover your next obsession and build
              a reading library that tells your story.
            </p>

            {/* CTA */}

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 px-7 text-sm font-bold text-white shadow-xl shadow-purple-300/40 transition hover:-translate-y-1 hover:shadow-2xl"
              >
                {user ? "Go to my library" : "Start your reading journey"}

                <span className="text-lg">→</span>
              </Link>

              <a
                href="#features"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-zinc-200 bg-white px-7 text-sm font-bold text-zinc-700 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:text-violet-700"
              >
                Explore Bookly
              </a>
            </div>

            {/* MINI STATS */}

            <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-3 text-left">
              <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
                <span className="text-xl">📚</span>

                <p className="mt-3 text-lg font-bold text-zinc-900">
                  Track
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Every book you read
                </p>
              </div>

              <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
                <span className="text-xl">📊</span>

                <p className="mt-3 text-lg font-bold text-zinc-900">
                  Discover
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Your reading habits
                </p>
              </div>

              <div className="rounded-2xl border border-white bg-white/70 p-4 shadow-sm backdrop-blur">
                <span className="text-xl">✨</span>

                <p className="mt-3 text-lg font-bold text-zinc-900">
                  Make it yours
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Create your own lists
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURE PREVIEW
      ====================================================== */}

      <section
        id="features"
        className="relative mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-16"
      >
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* BIG CARD */}

          <div className="relative min-h-[430px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-500 p-6 shadow-2xl shadow-purple-300/30 sm:p-10">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/20 blur-2xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                  Your personal library
                </div>

                <h2 className="mt-6 max-w-md text-4xl font-bold leading-tight text-white">
                  Every chapter of your reading journey, in one place.
                </h2>
              </div>

              {/* FAKE BOOK CARDS */}

              <div className="mt-10 flex gap-4 overflow-hidden">
                <div className="w-36 shrink-0 rotate-[-4deg] rounded-2xl bg-pink-300 p-3 shadow-2xl">
                  <div className="aspect-[0.65] rounded-xl bg-gradient-to-br from-pink-500 to-rose-700 p-4">
                    <div className="flex h-full items-end">
                      <span className="text-lg font-bold leading-tight text-white">
                        THE
                        <br />
                        SUMMER
                        <br />
                        BOOK
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-36 shrink-0 translate-y-8 rounded-2xl bg-yellow-200 p-3 shadow-2xl">
                  <div className="aspect-[0.65] rounded-xl bg-gradient-to-br from-orange-400 to-yellow-300 p-4">
                    <div className="flex h-full items-end">
                      <span className="text-lg font-bold leading-tight text-orange-950">
                        STORIES
                        <br />
                        WE KEEP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-36 shrink-0 rotate-[4deg] rounded-2xl bg-sky-200 p-3 shadow-2xl">
                  <div className="aspect-[0.65] rounded-xl bg-gradient-to-br from-sky-500 to-indigo-700 p-4">
                    <div className="flex h-full items-end">
                      <span className="text-lg font-bold leading-tight text-white">
                        BLUE
                        <br />
                        HORIZONS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDE CARDS */}

          <div className="grid gap-5">
            <div className="rounded-[2.5rem] bg-pink-100 p-7">
              <span className="text-4xl">📖</span>

              <h3 className="mt-6 text-2xl font-bold text-zinc-900">
                Track your progress.
              </h3>

              <p className="mt-3 leading-7 text-zinc-600">
                From the first page to the final chapter, keep every reading
                moment organized.
              </p>
            </div>

            <div className="rounded-[2.5rem] bg-sky-100 p-7">
              <span className="text-4xl">💜</span>

              <h3 className="mt-6 text-2xl font-bold text-zinc-900">
                Build your own lists.
              </h3>

              <p className="mt-3 leading-7 text-zinc-600">
                Favorites, comfort reads, books that broke your heart and
                everything in between.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-pink-500">
            Everything you need
          </p>

          <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Made for people who genuinely love books.
          </h2>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
              🔖
            </div>

            <h3 className="mt-6 text-xl font-bold text-zinc-900">
              Your complete library
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Keep everything you&apos;ve read, want to read or are currently
              reading in one beautiful place.
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-2xl">
              📈
            </div>

            <h3 className="mt-6 text-xl font-bold text-zinc-900">
              Reading insights
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              See your progress, favorite genres, ratings and discover patterns
              in your reading habits.
            </p>
          </article>

          <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-zinc-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-2xl">
              ✨
            </div>

            <h3 className="mt-6 text-xl font-bold text-zinc-900">
              Discover something new
            </h3>

            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Explore books and find your next obsession without leaving your
              reading space.
            </p>
          </article>
        </div>
      </section>

      {/* =====================================================
          COMMUNITY / PUBLIC BOOKS
      ====================================================== */}

      <section
        id="community"
        className="bg-gradient-to-b from-violet-50 to-pink-50 py-20"
      >
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-600">
                Community
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight text-zinc-900">
                Books readers are sharing.
              </h2>

              <p className="mt-4 leading-7 text-zinc-500">
                Discover what other readers have recently added to their
                shelves.
              </p>
            </div>

            <div className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-violet-700 shadow-sm">
              {publishedBooks.length}{" "}
              {publishedBooks.length === 1
                ? "book shared"
                : "books shared"}
            </div>
          </div>

          {/* EMPTY STATE */}

          {publishedBooks.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-dashed border-violet-200 bg-white/70 p-10 text-center">
              <span className="text-5xl">📚</span>

              <h3 className="mt-5 text-xl font-bold text-zinc-900">
                The community shelf is just getting started.
              </h3>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
                Be one of the first readers to share a book with the community.
              </p>

              <Link
                href={user ? "/dashboard/books/new" : "/login"}
                className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700"
              >
                Add a book
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {publishedBooks.slice(0, 8).map((book) => (
                <article
                  key={book.id}
                  className="group overflow-hidden rounded-[2rem] bg-white p-3 shadow-sm ring-1 ring-white transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <Link href={`/books/${book.id}`}>
                    <div className="relative aspect-[0.7] overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-violet-100 to-pink-100">
                      {book.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.coverUrl}
                          alt={book.title}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-5xl">
                          📖
                        </div>
                      )}
                    </div>

                    <div className="p-3 pb-2">
                      <h3 className="line-clamp-2 text-base font-bold text-zinc-900">
                        {book.title}
                      </h3>

                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {book.author || "Unknown author"}
                      </p>

                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-violet-600">
                        View book

                        <span className="transition group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="relative overflow-hidden rounded-[3rem] bg-zinc-950 px-7 py-16 text-center sm:px-12 lg:py-24">
          <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-violet-900/80 via-transparent to-pink-900/70" />

          <div className="relative mx-auto max-w-2xl">
            <span className="text-5xl">📚</span>

            <h2 className="mt-7 text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Your next chapter starts here.
            </h2>

            <p className="mt-5 text-base leading-7 text-zinc-300">
              Create your personal reading space and start building a library
              that&apos;s completely yours.
            </p>

            <Link
              href={user ? "/dashboard" : "/login"}
              className="mt-8 inline-flex h-14 items-center justify-center rounded-2xl bg-white px-7 text-sm font-bold text-violet-700 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
            >
              {user ? "Go to my library →" : "Get started for free →"}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}