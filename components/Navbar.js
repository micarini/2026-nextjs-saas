"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/dashboard/actions";

function isActivePath(pathname, href) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, onClick, pathname }) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      className={`block border px-3 py-2 text-sm font-medium transition ${
        active
          ? "border-zinc-700 bg-zinc-900 text-zinc-100"
          : "border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-100"
      }`}
      href={href}
      onClick={onClick}
    >
      {label}
    </Link>
  );
}

export default function Navbar({ actions, profile, user }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const userType = profile?.user_type || "user";
  const isAdmin = userType === "admin";
  const links = [
    { href: "/", label: "Home" },
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/books", label: "Books" },
        ]
      : []),
    ...(isAdmin ? [{ href: "/dashboard/users", label: "Usuarios" }] : []),
  ];

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-3">
          <Link
            className="min-w-0 overflow-wrap-anywhere text-sm font-semibold uppercase tracking-[0.14em] text-zinc-100"
            href="/"
            onClick={closeMenu}
          >
            SaaS Starter
          </Link>

          <div className="hidden min-w-0 flex-1 items-center justify-between gap-4 md:flex">
            <div className="ml-4 flex min-w-0 flex-wrap items-center gap-1">
              {links.map((link) => (
                <NavLink
                  href={link.href}
                  key={link.href}
                  label={link.label}
                  pathname={pathname}
                />
              ))}
            </div>

            <div className="flex min-w-0 items-center justify-end gap-3">
              {actions}
              {user ? (
                <>
                  <span className="min-w-0 max-w-64 overflow-wrap-anywhere text-right text-sm text-zinc-500">
                    {user.email || "Sin email"} ({userType})
                  </span>
                  <form action={logout}>
                    <button
                      className="h-10 border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
                      type="submit"
                    >
                      Cerrar sesion
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  className="inline-flex h-10 items-center justify-center border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300"
                  href="/login"
                >
                  Login
                </Link>
              )}
            </div>
          </div>

          <button
            aria-controls="mobile-menu"
            aria-expanded={isOpen}
            className="grid size-10 place-items-center border border-zinc-700 bg-transparent text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 md:hidden"
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            <span className="sr-only">Abrir menu</span>
            <span className="grid gap-1.5">
              <span className="block h-px w-5 bg-zinc-100" />
              <span className="block h-px w-5 bg-zinc-100" />
              <span className="block h-px w-5 bg-zinc-100" />
            </span>
          </button>
        </div>

        <div
          className={`grid gap-3 overflow-hidden transition-[grid-template-rows,padding] duration-200 md:hidden ${
            isOpen ? "grid-rows-[1fr] pb-4" : "grid-rows-[0fr] pb-0"
          }`}
          id="mobile-menu"
        >
          <div className="min-h-0 overflow-hidden">
            <div className="grid gap-1 border-t border-zinc-800 pt-3">
              {links.map((link) => (
                <NavLink
                  href={link.href}
                  key={link.href}
                  label={link.label}
                  onClick={closeMenu}
                  pathname={pathname}
                />
              ))}
            </div>

            <div className="mt-3 grid min-w-0 gap-3 border-t border-zinc-800 pt-3">
              {actions}
              {user ? (
                <span className="overflow-wrap-anywhere text-sm text-zinc-500">
                  {user.email || "Sin email"} ({userType})
                </span>
              ) : null}
            </div>

          {user ? (
            <form action={logout} className="mt-3">
              <button
                className="h-10 w-full border border-zinc-700 bg-transparent px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
                type="submit"
              >
                Cerrar sesion
              </button>
            </form>
          ) : (
            <Link
              className="mt-3 inline-flex h-10 w-full items-center justify-center border border-cyan-400 bg-cyan-400 px-4 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300"
              href="/login"
              onClick={closeMenu}
            >
              Login
            </Link>
          )}
        </div>
        </div>
      </div>
    </nav>
  );
}
