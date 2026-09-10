"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function LibraryIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19V6" />
      <path d="M9 19V4" />
      <path d="M14 19V7" />
      <path d="M19 19V5" />
      <path d="M3 19h18" />
    </svg>
  );
}

function FocusIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function StatsIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
    </svg>
  );
}

function ProfileIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0116 0v1" />
    </svg>
  );
}

function deriveActive(pathname) {

  if (pathname.startsWith("/dashboard/library")) {
    return "library";
  }

  if (pathname.startsWith("/dashboard/stats")) {
    return "stats";
  }

  if (pathname.startsWith("/dashboard/profile")) {
    return "profile";
  }

  if (pathname.startsWith("/dashboard/read")) {
    return "read";
  }

  return "home";
}

export default function BottomNav({ active }) {

  const pathname = usePathname();

  const current =
    active || deriveActive(pathname);

  const activeColor = "#20180f";

  const inactiveColor = "#a89a7f";

  return (
    <nav
      className="
        fixed
        inset-x-0
        bottom-0
        z-40
        flex
        items-center
        justify-around
        border-t
        border-[#eee3ce]
        bg-[#fffdf9]
        px-2
        pb-6
        pt-3
      "
    >

      {/* HOME */}
      <Link
        href="/dashboard"
        aria-label="Home"
      >
        <HomeIcon
          color={
            current === "home"
              ? activeColor
              : inactiveColor
          }
        />
      </Link>

      {/* LIBRARY */}
      <Link
        href="/dashboard/library"
        aria-label="Library"
      >
        <LibraryIcon
          color={
            current === "library"
              ? activeColor
              : inactiveColor
          }
        />
      </Link>

      {/* FOCUS */}
      <Link
        href="/dashboard/read"
        aria-label="Focus mode"
      >
        <FocusIcon
          color={
            current === "read"
              ? activeColor
              : inactiveColor
          }
        />
      </Link>

      {/* STATS */}
      <Link
        href="/dashboard/stats"
        aria-label="Stats"
      >
        <StatsIcon
          color={
            current === "stats"
              ? activeColor
              : inactiveColor
          }
        />
      </Link>

      {/* PROFILE */}
      <Link
        href="/dashboard/profile"
        aria-label="Profile"
      >
        <ProfileIcon
          color={
            current === "profile"
              ? activeColor
              : inactiveColor
          }
        />
      </Link>

    </nav>
  );
}