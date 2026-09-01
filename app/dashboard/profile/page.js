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
    <main className="min-h-screen bg-[#f7f5f0] pb-28 text-[#2c3025]">
      <div className="mx-auto w-full max-w-3xl px-5 pt-8">
        {/* =====================================
            HEADER
        ====================================== */}

        <header className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#77766d]">
              Your reading space
            </p>

            <h1 className="mt-1 font-serif text-3xl text-[#2c3025]">
              Profile
            </h1>
          </div>

          <Link
            href="/dashboard"
            aria-label="Back to home"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e7e3da] bg-white text-[#55584e] transition hover:bg-[#f0eee8]"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
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

        <section className="mt-8 rounded-3xl border border-[#e7dfcf] bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}

            <div className="h-24 w-24 overflow-hidden rounded-full bg-[#dedbd1] ring-4 ring-[#f0eee7]">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-3xl text-[#59634f]">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="mt-4 font-serif text-3xl text-[#2c3025]">
              {displayName}
            </h2>

            {username ? (
              <Link
                href={`/u/${username}`}
                className="mt-1 text-sm text-[#6f765f] hover:underline"
              >
                @{username}
              </Link>
            ) : (
              <p className="mt-1 text-sm text-[#99958c]">
                Choose a username to create your public profile.
              </p>
            )}

            {user.email ? (
              <p className="mt-3 text-xs text-[#99958c]">
                {user.email}
              </p>
            ) : null}
          </div>

          {/* Public profile */}

          {username ? (
            <Link
              href={`/u/${username}`}
              className="mt-6 flex items-center justify-between rounded-2xl bg-[#f0eee7] px-4 py-4 transition hover:bg-[#e9e6dc]"
            >
              <div>
                <p className="text-sm font-medium text-[#2c3025]">
                  Public profile
                </p>

                <p className="mt-1 text-xs text-[#858178]">
                  See how other people see your profile.
                </p>
              </div>

              <span className="text-lg text-[#6f765f]">
                →
              </span>
            </Link>
          ) : null}
        </section>

        {/* =====================================
            READING STATS
        ====================================== */}

        <section className="mt-6">
          <ProfileStats books={books} />
        </section>

        {/* =====================================
            PROFILE SETTINGS
        ====================================== */}

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="font-serif text-2xl text-[#2c3025]">
              My profile
            </h2>

            <p className="mt-1 text-sm text-[#77766d]">
              Manage how people find you.
            </p>
          </div>

          <div className="rounded-3xl border border-[#e7dfcf] bg-white p-5 shadow-sm">
            <UsernameForm
              action={saveUsername}
              currentUsername={profile?.username}
            />

            {username ? (
              <div className="mt-5 border-t border-[#eeeae1] pt-4">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#99958c]">
                  Public profile
                </p>

                <Link
                  href={`/u/${username}`}
                  className="mt-2 block text-sm text-[#59634f] hover:underline"
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

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="font-serif text-2xl text-[#2c3025]">
              Account
            </h2>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[#e7dfcf] bg-white shadow-sm">
            {/* Email */}

            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-[#2c3025]">
                  Email
                </p>

                <p className="mt-1 text-xs text-[#858178]">
                  {user.email || "No email available"}
                </p>
              </div>

              <span className="text-xs text-[#aaa69d]">
                Account
              </span>
            </div>

            {/* Provider */}

            <div className="border-t border-[#eeeae1] px-5 py-4">
              <p className="text-sm font-medium text-[#2c3025]">
                Sign-in method
              </p>

              <p className="mt-1 text-xs capitalize text-[#858178]">
                {profile?.provider || "Email"}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================
            ADMIN
        ====================================== */}

        {isAdmin ? (
          <section className="mt-8">
            <Link
              href="/dashboard/users"
              className="flex items-center justify-between rounded-3xl border border-[#e7dfcf] bg-white px-5 py-4 shadow-sm transition hover:bg-[#f8f6f1]"
            >
              <div>
                <p className="text-sm font-medium text-[#2c3025]">
                  Admin dashboard
                </p>

                <p className="mt-1 text-xs text-[#858178]">
                  Manage application users.
                </p>
              </div>

              <span className="text-lg text-[#6f765f]">
                →
              </span>
            </Link>
          </section>
        ) : null}

        {/* =====================================
            LOG OUT
        ====================================== */}

        <section className="mt-8">
          <form action={logout}>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded-2xl border border-[#e7dfcf] bg-white text-sm font-medium text-[#9a4f43] transition hover:bg-[#fbf4f1]"
            >
              Log out
            </button>
          </form>
        </section>

        {/* Small footer spacing */}

        <p className="pb-4 pt-8 text-center text-xs text-[#aaa69d]">
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