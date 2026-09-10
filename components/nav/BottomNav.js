"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


function HomeIcon({ color }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}


function LibraryIcon({ color }) {
  return (
    <svg
      width="21"
      height="21"
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


function SparkleIcon({ color }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2.8c.7 5.1 3.1 7.5 8.2 8.2-5.1.7-7.5 3.1-8.2 8.2-.7-5.1-3.1-7.5-8.2-8.2 5.1-.7 7.5-3.1 8.2-8.2Z" />

      <path d="M19 3c.2 1.5.9 2.2 2.4 2.4-1.5.2-2.2.9-2.4 2.4-.2-1.5-.9-2.2-2.4-2.4 1.5-.2 2.2-.9 2.4-2.4Z" />
    </svg>
  );
}


function FocusIcon({ color }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}


function StatsIcon({ color }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
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
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 21v-1a8 8 0 0116 0v1" />
    </svg>
  );
}


function deriveActive(pathname) {
  if (
    pathname.startsWith(
      "/dashboard/recommendations"
    )
  ) {
    return "recommendations";
  }

  if (
    pathname.startsWith(
      "/dashboard/library"
    )
  ) {
    return "library";
  }

  if (
    pathname.startsWith(
      "/dashboard/stats"
    )
  ) {
    return "stats";
  }

  if (
    pathname.startsWith(
      "/dashboard/profile"
    )
  ) {
    return "profile";
  }

  if (
    pathname.startsWith(
      "/dashboard/read"
    )
  ) {
    return "read";
  }

  return "home";
}


function NavItem({
  href,
  active,
  children,
  label,
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="
        relative
        flex
        h-10
        min-w-[40px]
        items-center
        justify-center
        rounded-full
        transition
        active:scale-95
      "
    >
      {children}

      {active && (
        <span
          className="
            absolute
            -bottom-[8px]
            h-[3px]
            w-[3px]
            rounded-full
            bg-[#322F7A]
          "
        />
      )}
    </Link>
  );
}


export default function BottomNav({
  active,
}) {
  const pathname =
    usePathname();

  const current =
    active ||
    deriveActive(pathname);

  const activeColor =
    "#322F7A";

  const inactiveColor =
    "#A89A7F";


  return (
    <nav
      className="
        fixed
        inset-x-0
        bottom-0
        z-50
        border-t
        border-[#EEE3CE]
        bg-[#FFFDF9]/95
        px-2
        pb-[max(20px,env(safe-area-inset-bottom))]
        pt-2
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-xl
          items-center
          justify-around
        "
      >

        {/* HOME */}

        <NavItem
          href="/dashboard"
          label="Home"
          active={
            current === "home"
          }
        >
          <HomeIcon
            color={
              current === "home"
                ? activeColor
                : inactiveColor
            }
          />
        </NavItem>


        {/* LIBRARY */}

        <NavItem
          href="/dashboard/library"
          label="Library"
          active={
            current === "library"
          }
        >
          <LibraryIcon
            color={
              current === "library"
                ? activeColor
                : inactiveColor
            }
          />
        </NavItem>


        {/* BOOKBOT */}

        <Link
          href="/dashboard/recommendations"
          aria-label="Book recommendations"
          className="
            relative
            -mt-7
            flex
            h-[52px]
            w-[52px]
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#C9E265]
            shadow-[0_8px_24px_rgba(50,47,122,0.20)]
            transition
            hover:-translate-y-1
            active:scale-95
          "
        >
          <SparkleIcon
            color="#322F7A"
          />

          {current ===
            "recommendations" && (
            <span
              className="
                absolute
                -bottom-[8px]
                h-[4px]
                w-[4px]
                rounded-full
                bg-[#322F7A]
              "
            />
          )}
        </Link>


        {/* FOCUS */}

        <NavItem
          href="/dashboard/read"
          label="Focus mode"
          active={
            current === "read"
          }
        >
          <FocusIcon
            color={
              current === "read"
                ? activeColor
                : inactiveColor
            }
          />
        </NavItem>


        {/* STATS */}

        <NavItem
          href="/dashboard/stats"
          label="Stats"
          active={
            current === "stats"
          }
        >
          <StatsIcon
            color={
              current === "stats"
                ? activeColor
                : inactiveColor
            }
          />
        </NavItem>


        {/* PROFILE */}

        <NavItem
          href="/dashboard/profile"
          label="Profile"
          active={
            current === "profile"
          }
        >
          <ProfileIcon
            color={
              current === "profile"
                ? activeColor
                : inactiveColor
            }
          />
        </NavItem>

      </div>
    </nav>
  );
}