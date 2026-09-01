import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-violet-100 bg-white">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 text-lg shadow-md shadow-purple-200">
                📚
              </div>

              <span className="text-lg font-bold text-zinc-900">
                Bookly
              </span>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-500">
              Your personal space to discover books, track your reading and
              build a library that feels completely yours.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 transition hover:bg-violet-50 hover:text-violet-700"
            >
              Home
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 transition hover:bg-violet-50 hover:text-violet-700"
            >
              My library
            </Link>

            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-medium text-zinc-500 transition hover:bg-violet-50 hover:text-violet-700"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-zinc-100 pt-6">
          <p className="text-xs text-zinc-400">
            © {new Date().getFullYear()} Bookly. Made for people who love
            books.
          </p>
        </div>
      </div>
    </footer>
  );
}