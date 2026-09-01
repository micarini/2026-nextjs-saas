import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 text-sm text-zinc-500 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div className="min-w-0">
          <p className="font-semibold uppercase tracking-[0.14em] text-zinc-300">
            SaaS Starter
          </p>
          <p className="mt-2 max-w-2xl leading-6">
            Starter para aplicaciones SaaS con Next.js, Firebase
            Authentication, Firestore y rutas protegidas.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-zinc-600">
            Next.js + Firebase
          </p>
        </div> 

        <nav
          aria-label="Links secundarios"
          className="flex flex-wrap gap-2 md:justify-end"
        >
          <Link
            className="border border-zinc-800 px-3 py-2 font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100"
            href="/"
          >
            Home
          </Link>
          <Link
            className="border border-zinc-800 px-3 py-2 font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100"
            href="/dashboard"
          >
            Dashboard
          </Link>
          <Link
            className="border border-zinc-800 px-3 py-2 font-medium text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100"
            href="/login"
          >
            Login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
