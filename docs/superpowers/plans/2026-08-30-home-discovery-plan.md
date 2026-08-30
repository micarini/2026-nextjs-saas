# Home Discovery & Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `/dashboard/books` into `/dashboard`, add a search-to-add bar and five curated discovery shelves (Continue reading, Want to read, Most popular this week, New releases, Recommendations) to the home screen, and simplify the bottom nav to 3 icons (Home, Stats, Profile).

**Architecture:** Two new read-only, key-optional external data fetchers (`lib/discovery/*`) feed a new presentational shelf component; the existing `BookShelfRow`/genre-shelf/status-filter block moves from `/dashboard/books` into `/dashboard` unchanged; every route, redirect, and nav link that pointed at `/dashboard/books` is repointed to `/dashboard`.

**Tech Stack:** Next.js 16 App Router, React 19, native `fetch` to the Open Library Trending API and the NYT Books API. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-30-home-discovery-design.md` (extends `docs/superpowers/specs/2026-08-28-book-catalog-design.md`)

## Global Constraints

- Mobile-first, entire UI/copy in English, no automated test framework — every task verifies with `npm run lint` and/or a manual walkthrough, never a written test file.
- Palette unchanged: background `#f6f1e7`, text `#20180f`, accent `#c96a1f`, muted `#a89a7f`, surface `#fffdf9`, borders `#e7dfcf`/`#eee3ce`, headings `font-serif`.
- `lib/discovery/trending.js` and `lib/discovery/newReleases.js` must NEVER throw — any network error, non-OK response, malformed JSON, or (NYT only) a missing API key resolves to `[]`.
- "Most popular this week" must be sourced from Open Library's own trending data, never from this app's own users' activity.
- "Recently added" is explicitly out of scope — do not build it.
- Out of scope, unchanged from the prior spec: real Stats page content, the AI librarian bot, and any click/tap interaction on the Popular/New Releases cards.

---

## File Structure

```
lib/discovery/
  trending.js      (Open Library Trending API)
  newReleases.js   (NYT Books API)

components/books/
  DiscoveryShelfRow.js   (new — external, non-clickable shelf)
  BookShelfRow.js         (MODIFY — genreLabel prop renamed to label)
  AddBookFlow.js          (MODIFY — initialQuery prop)

components/nav/
  BottomNav.js     (MODIFY — 3 icons: Home, Stats, Profile)

components/
  Navbar.js        (MODIFY — drop the redundant /dashboard/books link)

app/dashboard/
  page.js                    (MODIFY — full rewrite: search bar + curated shelves + moved library content)
  books/
    page.js                  (DELETE)
    new/page.js               (MODIFY — reads ?q=, back-link, BottomNav active)
    [id]/edit/page.js         (MODIFY — back-link, BottomNav active)
    actions.js                 (MODIFY — redirect/revalidatePath targets)
  more/page.js                (DELETE)
  stats/page.js                (NEW — placeholder)
  profile/page.js               (MODIFY — gains the admin link)

app/u/[username]/page.js      (MODIFY — BookShelfRow prop rename)

.env.example                   (MODIFY — document NYT_BOOKS_API_KEY)
```

---

### Task 1: Discovery data sources

**Files:**
- Create: `lib/discovery/trending.js`
- Create: `lib/discovery/newReleases.js`
- Modify: `.env.example`

**Interfaces:**
- Produces: `getTrendingBooks(limit = 8): Promise<DiscoveryBook[]>` from `lib/discovery/trending.js`; `getNewReleases(limit = 8): Promise<DiscoveryBook[]>` from `lib/discovery/newReleases.js`.
- `DiscoveryBook` shape: `{ title: string, author: string, coverUrl: string }` — no `id`, no ownership, not linked to Firestore.
- Both functions resolve to `[]` on any failure (network error, non-OK response, malformed JSON, or — for `getNewReleases` — a missing `NYT_BOOKS_API_KEY`). Never throw.

- [ ] **Step 1: Create `lib/discovery/trending.js`**

```js
export async function getTrendingBooks(limit = 8) {
  let response;

  try {
    response = await fetch(`https://openlibrary.org/trending/weekly.json?limit=${limit}`);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  let data;

  try {
    data = await response.json();
  } catch {
    return [];
  }

  return (data.works || [])
    .slice(0, limit)
    .map((work) => ({
      title: work.title || "",
      author: (work.author_name || []).join(", "),
      coverUrl: work.cover_i
        ? `https://covers.openlibrary.org/b/id/${work.cover_i}-M.jpg`
        : "",
    }))
    .filter((book) => book.title);
}
```

- [ ] **Step 2: Create `lib/discovery/newReleases.js`**

```js
const DEFAULT_LIST = "hardcover-fiction";

export async function getNewReleases(limit = 8) {
  const apiKey = process.env.NYT_BOOKS_API_KEY;

  if (!apiKey) {
    return [];
  }

  let response;

  try {
    response = await fetch(
      `https://api.nytimes.com/svc/books/v3/lists/current/${DEFAULT_LIST}.json?api-key=${apiKey}`,
    );
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  let data;

  try {
    data = await response.json();
  } catch {
    return [];
  }

  const books = data.results?.books || [];

  return books
    .slice(0, limit)
    .map((book) => ({
      title: book.title || "",
      author: book.author || "",
      coverUrl: book.book_image || "",
    }))
    .filter((book) => book.title);
}
```

- [ ] **Step 3: Document the new env var in `.env.example`**

Append to the end of `.env.example`:

```bash

# NYT Books API
# Se obtiene registrando una app gratuita en developer.nytimes.com con el producto "Books API" habilitado.
# Se usa para el estante "New releases" de la home. Si falta, el estante muestra su mensaje vacio (no rompe la app).
NYT_BOOKS_API_KEY=
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: no errors mentioning either new file.

- [ ] **Step 5: Commit**

```bash
git add lib/discovery/trending.js lib/discovery/newReleases.js .env.example
git commit -m "feat: add Open Library trending and NYT bestsellers discovery sources"
```

---

### Task 2: DiscoveryShelfRow component

**Files:**
- Create: `components/books/DiscoveryShelfRow.js`

**Interfaces:**
- Consumes: nothing from other tasks (pure presentational component, no imports beyond React/JSX).
- Produces: `<DiscoveryShelfRow label books emptyMessage />` — `books` is `DiscoveryBook[]` (from Task 1's shape). No `"use client"` needed.

- [ ] **Step 1: Create `components/books/DiscoveryShelfRow.js`**

```jsx
export default function DiscoveryShelfRow({ label, books, emptyMessage }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[15px] font-semibold text-[#20180f]">{label}</h2>

      {books.length === 0 ? (
        <p className="text-sm text-[#a89a7f]">{emptyMessage}</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {books.map((book, index) => (
            <div key={`${book.title}-${index}`} className="w-[92px] shrink-0">
              <div className="aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0] shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
                {book.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-tight text-[#20180f]">
                {book.title}
              </p>
              <p className="text-[11px] text-[#a89a7f]">{book.author}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `components/books/DiscoveryShelfRow.js`.

- [ ] **Step 3: Commit**

```bash
git add components/books/DiscoveryShelfRow.js
git commit -m "feat: add DiscoveryShelfRow for external, non-clickable book shelves"
```

---

### Task 3: Rename BookShelfRow's `genreLabel` prop to `label`

**Files:**
- Modify: `components/books/BookShelfRow.js`
- Modify: `app/u/[username]/page.js`

**Interfaces:**
- Produces: `<BookShelfRow label books hrefFor />` (was `genreLabel`) — this is the ONLY change to `BookShelfRow`'s contract; `hrefFor`'s default and behavior are unchanged.
- The prop is renamed because Task 6 will reuse `BookShelfRow` for non-genre shelves ("Continue reading", "Want to read"), so the old genre-specific name is misleading.

- [ ] **Step 1: Rename the prop in `components/books/BookShelfRow.js`**

Change the function signature and its one usage:

```jsx
export default function BookShelfRow({ label, books, hrefFor = defaultHrefFor }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-[#20180f]">{label}</h2>
```

(Only the destructured parameter name and the one place it was referenced as `{genreLabel}` change — everything else in the file stays the same.)

- [ ] **Step 2: Update the call site in `app/u/[username]/page.js`**

Change:

```jsx
<BookShelfRow
  key={shelf.genre}
  genreLabel={shelf.label}
  books={shelf.books}
  hrefFor={(book) => `/books/${book.id}`}
/>
```

to:

```jsx
<BookShelfRow
  key={shelf.genre}
  label={shelf.label}
  books={shelf.books}
  hrefFor={(book) => `/books/${book.id}`}
/>
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors. (Task 6, later, updates the other call site — the one currently in `app/dashboard/books/page.js` — as part of moving that content into `app/dashboard/page.js`; that file is not touched here.)

- [ ] **Step 4: Commit**

```bash
git add components/books/BookShelfRow.js app/u/[username]/page.js
git commit -m "refactor: rename BookShelfRow's genreLabel prop to label"
```

---

### Task 4: Add-flow search prefill (`initialQuery`)

**Files:**
- Modify: `components/books/AddBookFlow.js`
- Modify: `app/dashboard/books/new/page.js`

**Interfaces:**
- Produces: `<AddBookFlow initialQuery />` — `initialQuery` is optional; when provided, the component pre-fills the search input and automatically runs the same search the "Search" button triggers, on mount only.
- `app/dashboard/books/new/page.js` reads `searchParams.q` and passes it through.

- [ ] **Step 1: Extract a reusable `runSearch` function and add `initialQuery` support in `components/books/AddBookFlow.js`**

Replace the whole file with:

```jsx
"use client";

import { useEffect, useState, useTransition } from "react";
import BookForm from "@/components/books/BookForm";
import BookSearchResults from "@/components/books/BookSearchResults";
import { searchBooksAction } from "@/app/dashboard/books/new/actions";
import { createBook } from "@/app/dashboard/books/actions";

export default function AddBookFlow({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("search");
  const [isPending, startTransition] = useTransition();

  function runSearch(term) {
    setError("");

    startTransition(async () => {
      try {
        const found = await searchBooksAction(term);
        setResults(found);
        setSearched(true);
      } catch (err) {
        setError(err.message || "Search failed.");
      }
    });
  }

  useEffect(() => {
    if (initialQuery.trim()) {
      runSearch(initialQuery);
    }
    // Only ever auto-run once, for the query the page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    runSearch(query);
  }

  if (mode === "form") {
    return (
      <BookForm action={createBook} initialValues={selected || {}} submitLabel="Add to library" />
    );
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="h-11 flex-1 rounded-md border border-[#e7dfcf] bg-white px-3 outline-none focus:border-[#c96a1f]"
          placeholder="Search by title, author, or ISBN"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="h-11 rounded-md bg-[#20180f] px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <BookSearchResults
        results={results}
        onSelect={(result) => {
          setSelected(result);
          setMode("form");
        }}
      />

      {searched && results.length === 0 && !isPending ? (
        <p className="text-sm text-[#a89a7f]">No matches found.</p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setMode("form");
        }}
        className="text-sm font-semibold text-[#c96a1f] underline"
      >
        Add manually instead
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Update `app/dashboard/books/new/page.js`** to read `?q=` and fix the back-link/nav state

```jsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import AddBookFlow from "@/components/books/AddBookFlow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function NewBookPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { q } = await searchParams;

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]" style={{ colorScheme: "light" }}>
      <div className="px-5 pt-8">
        <Link href="/dashboard" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold">Add a book</h1>
      </div>

      <div className="px-5 py-6">
        <AddBookFlow initialQuery={q || ""} />
      </div>

      <BottomNav active="home" />
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning either file.

- [ ] **Step 4: Manual check** (no automated tests in this project)

Run `npm run dev`, visit `/dashboard/books/new?q=circe` while signed in.
Expected: the search input shows "circe" pre-filled and results appear automatically without clicking "Search".

- [ ] **Step 5: Commit**

```bash
git add components/books/AddBookFlow.js app/dashboard/books/new/page.js
git commit -m "feat: support a prefilled, auto-run search query in the add-book flow"
```

---

### Task 5: Rebuild BottomNav with 3 icons

**Files:**
- Modify: `components/nav/BottomNav.js`

**Interfaces:**
- Produces: `<BottomNav active="home"|"stats"|"profile" />` — same optional-`active`-with-pathname-fallback contract as before, but the value set shrinks from 5 states to 3, and the rendered links shrink from 5 to 3 (no Library icon, no Add FAB, no More icon).

- [ ] **Step 1: Replace `components/nav/BottomNav.js` entirely**

```jsx
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
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `components/nav/BottomNav.js`. (Other files that pass `active="library"`, `active="add"`, or `active="more"` will still lint clean — those are just plain string props — but they're fixed in Tasks 6-8 so the app behaves correctly.)

- [ ] **Step 3: Commit**

```bash
git add components/nav/BottomNav.js
git commit -m "refactor: simplify bottom nav to Home, Stats, Profile"
```

---

### Task 6: Merge Library into the Home page, delete the old route

**Files:**
- Modify (full rewrite): `app/dashboard/page.js`
- Delete: `app/dashboard/books/page.js`

**Interfaces:**
- Consumes: `listUserBooks` (existing), `GENRES`/`STATUSES` (existing), `getTrendingBooks`/`getNewReleases` (Task 1), `BookShelfRow` with its renamed `label` prop (Task 3), `DiscoveryShelfRow` (Task 2), `BottomNav` (Task 5).
- Produces: nothing new for other tasks to consume — this is the final assembly of the home screen.

- [ ] **Step 1: Delete the old library route**

```bash
rm app/dashboard/books/page.js
```

- [ ] **Step 2: Replace `app/dashboard/page.js` entirely**

```jsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";
import { getTrendingBooks } from "@/lib/discovery/trending";
import { getNewReleases } from "@/lib/discovery/newReleases";
import BookShelfRow from "@/components/books/BookShelfRow";
import DiscoveryShelfRow from "@/components/books/DiscoveryShelfRow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { status: statusFilter } = await searchParams;

  const [books, trending, newReleases] = await Promise.all([
    listUserBooks(user.uid),
    getTrendingBooks(),
    getNewReleases(),
  ]);

  const continueReading = books.filter((book) => book.status === "reading");
  const wantToRead = books.filter((book) => book.status === "to_read");

  const filteredBooks = statusFilter
    ? books.filter((book) => book.status === statusFilter)
    : books;

  const genreShelves = GENRES.map((genre) => ({
    genre: genre.value,
    label: genre.label,
    books: filteredBooks.filter((book) => book.genre === genre.value),
  })).filter((shelf) => shelf.books.length > 0);

  const chipClass = (isActive) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] ${
      isActive ? "bg-[#20180f] text-white" : "border border-[#e7dfcf] bg-white text-[#6b5f4a]"
    }`;

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]" style={{ colorScheme: "light" }}>
      <div className="px-5 pb-2 pt-8">
        <p className="font-serif text-[15px] text-[#6b5f4a]">My Favourite</p>
        <h1 className="font-serif text-[40px] font-bold leading-none">BOOKS</h1>
      </div>

      <form action="/dashboard/books/new" method="GET" className="px-5 pb-6">
        <div className="flex h-12 items-center gap-2 rounded-full border border-[#e7dfcf] bg-white px-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a89a7f" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            name="q"
            placeholder="Search to add a book..."
            className="flex-1 bg-transparent text-sm text-[#20180f] outline-none placeholder:text-[#a89a7f]"
          />
        </div>
      </form>

      <div className="px-5">
        {continueReading.length > 0 ? (
          <BookShelfRow label="Continue reading" books={continueReading} />
        ) : null}

        {wantToRead.length > 0 ? (
          <BookShelfRow label="Want to read" books={wantToRead} />
        ) : null}

        <DiscoveryShelfRow
          label="Most popular this week"
          books={trending}
          emptyMessage="Couldn't load trending books right now."
        />

        <DiscoveryShelfRow
          label="New releases"
          books={newReleases}
          emptyMessage="Couldn't load new releases right now."
        />

        <DiscoveryShelfRow
          label="Recommendations"
          books={[]}
          emptyMessage="Coming soon — personalized picks based on your reading history."
        />
      </div>

      <div className="mt-2 border-t border-[#e7dfcf] px-5 pb-5 pt-6">
        <h2 className="mb-4 font-serif text-2xl font-bold">Your library</h2>

        <div className="flex gap-2 overflow-x-auto">
          <Link href="/dashboard" className={chipClass(!statusFilter)}>
            All
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status.value}
              href={`/dashboard?status=${status.value}`}
              className={chipClass(statusFilter === status.value)}
            >
              {status.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="px-5">
        {genreShelves.length === 0 ? (
          <div className="mt-4 rounded-lg border border-[#e7dfcf] bg-white p-6 text-center text-sm text-[#6b5f4a]">
            No books yet. Search above or add one manually to start your library.
          </div>
        ) : (
          genreShelves.map((shelf) => (
            <BookShelfRow key={shelf.genre} label={shelf.label} books={shelf.books} />
          ))
        )}
      </div>

      <div className="px-5 pb-4">
        <Link
          href="/dashboard/books/new"
          className="block rounded-full bg-[#20180f] py-3.5 text-center text-sm font-semibold text-white"
        >
          Add Books
        </Link>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: 0 errors. There will be no more references anywhere in the app to a route literally named `/dashboard/books` for browsing (only `/dashboard/books/new` and `/dashboard/books/[id]/edit`, which still exist) — Tasks 7 finishes cleaning up the remaining redirect/link targets that still say `/dashboard/books` expecting the old list page.

- [ ] **Step 4: Commit**

```bash
git add -A app/dashboard/page.js app/dashboard/books/page.js
git commit -m "feat: merge the library view into the home screen with curated discovery shelves"
```

---

### Task 7: Repoint remaining `/dashboard/books` references to `/dashboard`

**Files:**
- Modify: `app/dashboard/books/actions.js`
- Modify: `app/dashboard/books/[id]/edit/page.js`
- Modify: `components/Navbar.js`

**Interfaces:** none new — this task only fixes stale links/redirects/revalidation targets left over from before Task 6 deleted the list page they used to point at.

- [ ] **Step 1: Fix the three redirect/revalidate pairs in `app/dashboard/books/actions.js`**

In `createBook`, `updateBook`, and `deleteBook`, change every occurrence of:

```js
  revalidatePath("/dashboard/books");
```
to:
```js
  revalidatePath("/dashboard");
```

and every occurrence of:
```js
  redirect("/dashboard/books");
```
to:
```js
  redirect("/dashboard");
```

(Leave `addNote`/`deleteNote`'s `revalidatePath("/dashboard/books/[id]/edit", "page")` calls untouched — that route still exists.)

- [ ] **Step 2: Fix the back-link and nav state in `app/dashboard/books/[id]/edit/page.js`**

Change:
```jsx
        <Link href="/dashboard/books" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
```
to:
```jsx
        <Link href="/dashboard" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
```

And change:
```jsx
      <BottomNav active="library" />
```
to:
```jsx
      <BottomNav active="home" />
```

- [ ] **Step 3: Remove the redundant "Books" link in `components/Navbar.js`**

Find this block inside the `links` array definition:

```js
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/books", label: "Books" },
        ]
      : []),
```

Replace with:

```js
    ...(user
      ? [{ href: "/dashboard", label: "Dashboard" }]
      : []),
```

(`/dashboard` now IS the library, so the separate link is redundant.)

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: 0 errors.

Run: `grep -rn '"/dashboard/books"' app components lib --include="*.js"`
Expected: only matches inside path segments like `/dashboard/books/new` or `/dashboard/books/${...}/edit` or `/dashboard/books/[id]/edit` — no bare `"/dashboard/books"` string left as a link/redirect target to the deleted list page.

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/books/actions.js app/dashboard/books/[id]/edit/page.js components/Navbar.js
git commit -m "fix: repoint remaining /dashboard/books links and redirects to /dashboard"
```

---

### Task 8: Stats placeholder page, remove "More"

**Files:**
- Create: `app/dashboard/stats/page.js`
- Delete: `app/dashboard/more/page.js`

**Interfaces:**
- Consumes: `getCurrentUser` (existing), `BottomNav` (Task 5).

- [ ] **Step 1: Delete the old "More" page**

```bash
rm app/dashboard/more/page.js
```

- [ ] **Step 2: Create `app/dashboard/stats/page.js`**

```jsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-10 text-[#20180f]" style={{ colorScheme: "light" }}>
      <h1 className="font-serif text-3xl font-bold">Stats</h1>

      <div className="mt-6 rounded-md border border-[#e7dfcf] bg-white p-4">
        <p className="text-sm font-semibold">Coming soon</p>
        <p className="mt-1 text-sm text-[#a89a7f]">
          Reading stats, genre breakdowns, and your yearly reading challenge are on their way.
        </p>
      </div>

      <BottomNav active="stats" />
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning either file.

- [ ] **Step 4: Commit**

```bash
git add -A app/dashboard/stats/page.js app/dashboard/more/page.js
git commit -m "feat: add the Stats placeholder page, replacing More"
```

---

### Task 9: Move the admin link into Profile

**Files:**
- Modify: `app/dashboard/profile/page.js`

**Interfaces:**
- Consumes: `getCurrentUserProfile` (already imported in this file).

- [ ] **Step 1: Add the admin-only link**

In `app/dashboard/profile/page.js`, after fetching `profile`, compute `isAdmin` and render the link between the username section and the logout form:

```jsx
  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";
```

and add, right before the `<form action={logout} ...>` block:

```jsx
      {isAdmin ? (
        <a
          href="/dashboard/users"
          className="mt-8 block rounded-md border border-[#e7dfcf] bg-white p-4 text-sm font-semibold text-[#20180f]"
        >
          Admin: manage users →
        </a>
      ) : null}
```

Use a plain `<a>` tag (not `next/link`'s `Link`) since `/dashboard/users` is one of the pre-existing dark-theme admin pages outside this light-theme reading-tracker section — a plain anchor is consistent with how this codebase already treats that boundary elsewhere (no special reason to prefetch it), and it avoids adding a new import to this file. Adjust the logout form's top margin from `mt-8` to `mt-4` if `isAdmin` is true, so spacing stays consistent when both blocks render — use your judgment on exact spacing, it's not load-bearing.

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `app/dashboard/profile/page.js`.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/profile/page.js
git commit -m "feat: move the admin users link into Profile"
```

---

### Task 10: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Confirm `NYT_BOOKS_API_KEY` is set**

Run: `grep -q '^NYT_BOOKS_API_KEY=.\+' .env && echo present || echo missing`
Expected: `present` (the user already registered and added this key earlier in the session). If `missing`, the New Releases shelf will just show its empty message — not a blocker, but worth confirming before the walkthrough.

- [ ] **Step 2: Run the dev server and walk the flow**

```bash
npm run dev
```

In a browser at ~375px width, signed in:
1. Land on `/dashboard` — confirm the search bar is at the top, followed by whichever of Continue reading / Want to read shelves have books, then Most popular this week (real Open Library covers), New releases (real NYT covers), and Recommendations (empty state text, no crash).
2. Scroll down — confirm the status filter chips and genre shelves (the old Library content) still work exactly as before, now living on the same page.
3. Type a title into the top search bar and submit — confirm it navigates to `/dashboard/books/new?q=<title>` and the search auto-runs there without clicking "Search" again.
4. Tap "Add Books" at the bottom — confirm it still reaches the add flow.
5. Add or edit a book — confirm it redirects back to `/dashboard` (not a 404) and the new/changed book appears in the right shelf.
6. Check the bottom nav — confirm exactly 3 icons (Home, Stats, Profile), no FAB, and each highlights correctly on its own page including `/dashboard/books/new` and `/dashboard/books/[id]/edit` (both should show Home active).
7. Tap Stats — confirm the placeholder loads, no 404 (this replaces the old `/dashboard/more`).
8. Tap Profile — confirm the admin link appears only for an admin account, and points at `/dashboard/users`.
9. Visit `/dashboard/books` directly — confirm it now 404s (the route no longer exists) rather than erroring.
10. Sign out, visit `/` — confirm the top dark navbar's "Dashboard" link still works and no longer shows a separate "Books" link.

- [ ] **Step 3: Run the full lint one more time**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 4: Final commit (only if Step 2 surfaced fixes)**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end verification"
```
