"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function LibraryIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 19V5a1 1 0 011-1h4v16H5a1 1 0 01-1-1z" />
      <path d="M9 4h6v16H9z" />
      <path d="M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4V4z" />
    </svg>
  );
}

function ProfileIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a8 8 0 0116 0v1" />
    </svg>
  );
}

function MoreIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </svg>
  );
}

function deriveActive(pathname) {
  if (pathname.startsWith("/dashboard/books")) {
    return "library";
  }

  if (pathname.startsWith("/dashboard/profile")) {
    return "profile";
  }

  if (pathname.startsWith("/dashboard/more")) {
    return "more";
  }

  return "home";
}

export default function BottomNav({ active }) {
  const pathname = usePathname();
  const current = active || deriveActive(pathname);
  const activeColor = "#20180f";
  const inactiveColor = "#a89a7f";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[#eee3ce] bg-[#fffdf9] px-2 pb-6 pt-3">
      <Link href="/dashboard" aria-label="Home">
        <HomeIcon color={current === "home" ? activeColor : inactiveColor} />
      </Link>
      <Link href="/dashboard/books" aria-label="Library">
        <LibraryIcon color={current === "library" ? activeColor : inactiveColor} />
      </Link>
      <Link
        href="/dashboard/books/new"
        aria-label="Add book"
        className="-mt-4 flex size-10 items-center justify-center rounded-full bg-[#c96a1f] shadow-[0_6px_14px_rgba(201,106,31,0.4)]"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
      <Link href="/dashboard/profile" aria-label="Profile">
        <ProfileIcon color={current === "profile" ? activeColor : inactiveColor} />
      </Link>
      <Link href="/dashboard/more" aria-label="More">
        <MoreIcon color={current === "more" ? activeColor : inactiveColor} />
      </Link>
    </nav>
  );
}
