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

function StatsIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M4 20V10" />
      <path d="M12 20V4" />
      <path d="M20 20v-7" />
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

function deriveActive(pathname) {
  if (pathname.startsWith("/dashboard/stats")) {
    return "stats";
  }

  if (pathname.startsWith("/dashboard/profile")) {
    return "profile";
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
      <Link href="/dashboard/stats" aria-label="Stats">
        <StatsIcon color={current === "stats" ? activeColor : inactiveColor} />
      </Link>
      <Link href="/dashboard/profile" aria-label="Profile">
        <ProfileIcon color={current === "profile" ? activeColor : inactiveColor} />
      </Link>
    </nav>
  );
}
