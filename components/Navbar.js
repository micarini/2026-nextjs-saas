"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logout } from "@/app/dashboard/actions";

export default function Navbar({ profile, user }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isDashboard = pathname?.startsWith("/dashboard");

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-violet-100 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* LOGO */}

        <Link
          href="/"
          onClick={closeMenu}
          className="flex items-center gap-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 text-xl shadow-lg shadow-purple-200">
            📚
          </div>

          <span className="text-lg font-bold tracking-tight text-zinc-900">
            Bookly
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <div className="hidden items-center gap-8 md:flex">
          {!user && (
            <>
              <a
                href="#features"
                className="text-sm font-medium text-zinc-500 transition hover:text-violet-600"
              >
                Features
              </a>

              <a
                href="#community"
                className="text-sm font-medium text-zinc-500 transition hover:text-violet-600"
              >
                Community
              </a>
            </>
          )}

          {user && !isDashboard && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-500 transition hover:text-violet-600"
            >
              My library
            </Link>
          )}
        </div>

        {/* DESKTOP ACTIONS */}

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                My library
              </Link>

              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                >
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                Log in
              </Link>

              <Link
                href="/login"
                className="rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Get started
              </Link>
            </>
          )}
        </div>

        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 transition hover:bg-zinc-50 md:hidden"
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          {isOpen ? (
            <span className="text-xl">×</span>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* MOBILE MENU */}

      {isOpen && (
        <div className="border-t border-violet-100 bg-white px-5 py-5 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {!user && (
              <>
                <a
                  href="#features"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-violet-50"
                >
                  Features
                </a>

                <a
                  href="#community"
                  onClick={closeMenu}
                  className="rounded-xl px-4 py-3 text-sm font-semibold text-zinc-600 hover:bg-violet-50"
                >
                  Community
                </a>
              </>
            )}

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={closeMenu}
                  className="rounded-xl bg-violet-50 px-4 py-3 text-center text-sm font-bold text-violet-700"
                >
                  Go to my library
                </Link>

                <form action={logout}>
                  <button
                    type="submit"
                    className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-600"
                  >
                    Log out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="mt-2 rounded-xl border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-700"
                >
                  Log in
                </Link>

                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}