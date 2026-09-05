import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { listUserBooks } from "@/lib/books/books";

import { logout } from "@/app/dashboard/actions";

import BottomNav from "@/components/nav/BottomNav";
import UsernameForm from "@/components/users/UsernameForm";
import ProfileStats from "@/components/users/ProfileStats";

import { saveUsername } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, books] = await Promise.all([
    getCurrentUserProfile(user),
    listUserBooks(user.uid),
  ]);

  const isAdmin = profile?.user_type === "admin";

  const displayName =
    user.displayName ||
    user.email?.split("@")[0] ||
    "Reader";

  const firstName =
    displayName.split(" ")[0] || "Reader";

  const username = profile?.username || null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAFAFA] pb-28 text-gray-900">
      {/* =====================================
          DECORATIVE BACKGROUND
      ====================================== */}
      <div className="absolute right-0 top-0 -z-10 h-80 w-80 bg-gradient-to-bl from-purple-200/40 via-pink-100/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 left-0 -z-10 h-72 w-72 bg-gradient-to-tr from-[#322F7A]/15 to-[#EDEBF7]/40 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-10">
        {/* =====================================
            HEADER
        ====================================== */}

        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Your reading space
            </p>

            <h1 className="mt-1 text-3xl font-extrabold text-gray-900">
              Profile
            </h1>
          </div>

          <Link
            href="/dashboard"
            aria-label="Back to home"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </Link>
        </header>

        {/* =====================================
            PROFILE HEADER
        ====================================== */}

        <section className="mt-8 rounded-[2rem] border border-gray-50 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}

            <div className="h-24 w-24 overflow-hidden rounded-full bg-gray-200 ring-4 ring-white shadow-md">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-gray-500">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
              {displayName}
            </h2>

            {username ? (
              <Link
                href={`/u/${username}`}
                className="mt-1 text-sm font-bold text-[#322F7A] transition-colors hover:text-[#3d3993] hover:underline"
              >
                @{username}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-gray-400">
                Choose a username to create your public profile.
              </p>
            )}

            {user.email ? (
              <p className="mt-3 rounded-full bg-gray-50 px-4 py-1 text-xs font-bold text-gray-500 border border-gray-100">
                {user.email}
              </p>
            ) : null}
          </div>

          {/* Public profile */}

          {username ? (
            <Link
              href={`/u/${username}`}
              className="mt-8 flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 transition-all hover:border-gray-200 hover:bg-gray-100/80 shadow-sm"
            >
              <div>
                <p className="text-sm font-extrabold text-gray-900">
                  Public profile
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  See how other people see your profile.
                </p>
              </div>

              <span className="text-xl font-bold text-gray-300">
                ›
              </span>
            </Link>
          ) : null}
        </section>

        {/* =====================================
            READING STATS
        ====================================== */}

        <section className="mt-8">
          <ProfileStats books={books} />
        </section>

        {/* =====================================
            PROFILE SETTINGS
        ====================================== */}

        <section className="mt-10">
          <div className="mb-4 ml-1">
            <h2 className="text-xl font-extrabold text-gray-900">
              My profile
            </h2>

            <p className="mt-1 text-sm font-medium text-gray-500">
              Manage how people find you.
            </p>
          </div>

          <div className="rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <UsernameForm
              action={saveUsername}
              currentUsername={profile?.username}
            />

            {username ? (
              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Public link
                </p>

                <Link
                  href={`/u/${username}`}
                  className="mt-2 block text-sm font-bold text-gray-900 transition-colors hover:text-[#322F7A]"
                >
                  /u/{username}
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        {/* =====================================
            ACCOUNT
        ====================================== */}

        <section className="mt-10">
          <div className="mb-4 ml-1">
            <h2 className="text-xl font-extrabold text-gray-900">
              Account
            </h2>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-gray-50 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            {/* Email */}

            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="text-sm font-extrabold text-gray-900">
                  Email
                </p>

                <p className="mt-1 text-xs font-medium text-gray-500">
                  {user.email || "No email available"}
                </p>
              </div>

              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                Protected
              </span>
            </div>

            {/* Provider */}

            <div className="border-t border-gray-50 px-6 py-5 bg-gray-50/50">
              <p className="text-sm font-extrabold text-gray-900">
                Sign-in method
              </p>

              <p className="mt-1 text-xs font-bold capitalize text-gray-500">
                {profile?.provider || "Email"}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================
            ADMIN
        ====================================== */}

        {isAdmin ? (
          <section className="mt-10">
            <Link
              href="/dashboard/users"
              className="flex items-center justify-between rounded-[2rem] border border-[#322F7A]/15 bg-[#EDEBF7]/50 px-6 py-5 shadow-sm transition-all hover:bg-[#EDEBF7]"
            >
              <div>
                <p className="text-sm font-extrabold text-[#322F7A]">
                  Admin dashboard
                </p>

                <p className="mt-1 text-xs font-medium text-[#322F7A]/70">
                  Manage application users.
                </p>
              </div>

              <span className="text-xl font-bold text-[#322F7A]/50">
                ›
              </span>
            </Link>
          </section>
        ) : null}

        {/* =====================================
            LOG OUT
        ====================================== */}

        <section className="mt-10">
          <form action={logout}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center rounded-full bg-red-50 text-base font-extrabold text-red-600 transition-all hover:bg-red-100 hover:scale-[1.02]"
            >
              Log out
            </button>
          </form>
        </section>

        {/* Small footer spacing */}

        <p className="pb-6 pt-10 text-center text-xs font-bold text-gray-400">
          Your reading journey, one page at a time.
        </p>
      </div>

      {/* =====================================
          BOTTOM NAV
      ====================================== */}

      <BottomNav active="profile" />
    </main>
  );
}