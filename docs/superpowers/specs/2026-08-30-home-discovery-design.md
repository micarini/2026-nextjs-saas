# Home Discovery & Navigation Redesign — Design Spec

Date: 2026-08-30
Status: Approved by user, ready for implementation planning.

## Context

Extends the book-catalog sub-project (`docs/superpowers/specs/2026-08-28-book-catalog-design.md`). The dashboard home (`/dashboard`) currently shows only a greeting and a "Go to my library" button; the actual shelf-browsing lives at `/dashboard/books`. The user wants shelves visible immediately on entering the app, which — after discussion — turned into a broader nav/home redesign pulling forward a slice of two previously-deferred sub-projects (dashboard metrics, and a taste of curated discovery) without building them in full.

## Decisions

- **Home absorbs Library.** `/dashboard/books` is removed as a separate route. `/dashboard` becomes the single screen for both curated discovery and full-catalog browsing (status filter + genre shelves, unchanged from the current `/dashboard/books` implementation, just relocated).
- **Bottom nav drops to 3 icons:** Home, Stats, Profile. No separate Library icon (merged into Home). No Add FAB in the nav — "Add Books" stays as an in-page button (already existed at the bottom of the shelf list). No "More" icon — the admin link that lived there moves into Profile; the "coming soon" messaging moves into a new `/dashboard/stats` placeholder page (that route is created now as a stub; its real content — reading metrics, genre distribution charts, yearly goal — is still deferred, unbuilt in this pass).
- **Home screen search bar** (top of `/dashboard`) searches the external book APIs to add a new book — it's a GET-form entry point into the existing `/dashboard/books/new` add flow (`?q=` pre-fills and auto-runs the search there), not a filter over the user's own library.
- **New curated shelves on Home**, in order:
  1. **Continue reading** — user's own books with `status: "reading"`. No new data source.
  2. **Want to read** — user's own books with `status: "to_read"`. No new data source.
  3. **Most popular this week** — sourced from the **Open Library Trending API** (`openlibrary.org/trending/weekly.json`), free, no API key, platform-wide loan activity — explicitly NOT derived from this app's own users, per the user's requirement.
  4. **New releases** — sourced from the **NYT Books API** (`api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json`), needs a free API key (`NYT_BOOKS_API_KEY` env var, already provisioned and verified live by the user). Acknowledged proxy: NYT's lists are bestseller lists, not a literal "published this week" feed — accepted as the best available free option.
  5. **Recommendations** — empty placeholder ("Coming soon — personalized picks based on your reading history"). This is sub-project 4 (the AI librarian bot), still fully deferred; no CTA/link built yet.
- Below the curated shelves: the existing status-filter chips + genre-grouped shelves of the user's full catalog (moved verbatim from `/dashboard/books`), then the "Add Books" button.
- **"Recently added" was explicitly rejected** by the user — not built.
- **`Continue reading`/`Want to read` shelves reuse `BookShelfRow`** (they're the user's own owned books, with id/status/rating — same shape as a genre shelf). The three external/curated shelves (Popular, New Releases, Recommendations) use a new, simpler presentational component since external API results have no `id`/`status`/ownership and aren't clickable/editable — see `DiscoveryShelfRow` below.
- Both external data sources (`trending.js`, `newReleases.js`) must fail gracefully — return `[]` on any network error, non-OK response, or (for NYT) a missing API key — so a third-party outage never breaks the home page. The shelf then falls back to its `emptyMessage`.

## Component contract: `DiscoveryShelfRow`

`<DiscoveryShelfRow label books emptyMessage />` — presentational only (no `"use client"` needed): a horizontally-scrollable row of non-interactive cover cards (`{title, author, coverUrl}`), or `emptyMessage` text when `books.length === 0`. Reused for Popular, New Releases, and Recommendations (the last always passes `books={[]}`).

## `BookShelfRow` prop rename

Its `genreLabel` prop is renamed to `label` (it now also displays non-genre shelf titles like "Continue reading" — the old name was misleading). Both existing call sites (`app/u/[username]/page.js` and the former `/dashboard/books`) update accordingly.

## Navigation & route changes

- `app/dashboard/books/page.js` — **deleted**, content merges into `app/dashboard/page.js`.
- `app/dashboard/more/page.js` — **deleted**, replaced by `app/dashboard/stats/page.js` (same "coming soon" pattern, now naming stats/reading-challenges specifically; no admin link — that moves to Profile).
- `app/dashboard/profile/page.js` — gains the admin-only link to `/dashboard/users` (previously on the "More" page).
- `app/dashboard/books/new/page.js`, `app/dashboard/books/[id]/edit/page.js` — "back to library" links now point to `/dashboard`; `<BottomNav active="home" />` (both are sub-screens of the merged Home/Library experience — there's no separate "library" nav state anymore).
- `app/dashboard/books/actions.js` — `createBook`/`updateBook`/`deleteBook` redirect and revalidate `/dashboard` instead of `/dashboard/books`.
- `components/Navbar.js` (the pre-existing dark top nav, used only on `/`, `/login`, `/dashboard/users`) — drops its now-redundant `/dashboard/books` "Books" link (the existing `/dashboard` "Dashboard" link already covers it).
- `components/nav/BottomNav.js` — rebuilt with exactly 3 links (Home → `/dashboard`, Stats → `/dashboard/stats`, Profile → `/dashboard/profile`); `LibraryIcon`, `MoreIcon`, and the FAB are removed.

## Add-flow search prefill

`components/books/AddBookFlow.js` gains an optional `initialQuery` prop: on mount, if provided, it pre-fills the query input and automatically runs the same search the manual "Search" button triggers (extracting the shared search logic into a reusable function so both the effect and the form submit call it). `app/dashboard/books/new/page.js` reads `searchParams.q` and passes it through as `initialQuery`.

## Out of scope (unchanged from the book-catalog spec, still deferred)

- Real Stats page content (metrics, genre distribution charts, yearly reading-challenge progress) — `/dashboard/stats` is a stub only.
- The AI librarian bot / recommendation survey — the Recommendations shelf stays empty.
- Any interaction on the Popular/New Releases cards (tap-to-add, linking into the add flow) — they're display-only in this pass.

## Error handling

- `getTrendingBooks`/`getNewReleases` never throw — network failure, non-OK response, malformed JSON, or (NYT) a missing `NYT_BOOKS_API_KEY` all resolve to `[]`, and the shelf shows `emptyMessage` instead of crashing the page.
- Everything else (ownership checks, auth redirects, 404s) is unchanged from the book-catalog spec — this pass only relocates existing protected UI and adds two new read-only, non-authenticated external fetches.

## Testing

Same approach as the book-catalog sub-project: no automated test framework: `npm run lint` plus a manual walkthrough (already partially verified live for both new external APIs during this design session — Open Library trending and the NYT Books API both returned real data with the user's own key).
