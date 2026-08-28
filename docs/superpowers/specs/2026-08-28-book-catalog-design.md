# Book Catalog — Design Spec

Date: 2026-08-28
Status: Approved by user, ready for implementation planning.

## Context

The product is a personal reading-habit tracker SaaS, built on the existing
Next.js + Firebase starter (App Router, Firebase Auth, Firestore, Tailwind).
The starter's `items` entity is a placeholder meant to be replaced by the
product's real domain entity.

The full product idea decomposes into four independent sub-projects, each
with its own design → spec → plan → implementation cycle:

1. **Book catalog (this spec)** — CRUD of the user's books, the foundation
   everything else depends on.
2. **Dashboard metrics** — yearly goal progress, books read, genre
   distribution, evolution charts.
3. **Custom shelves** — user-created collections of books (distinct from the
   genre grouping built in this sub-project).
4. **AI librarian bot** — recommendations based on reading history.

This spec covers **only sub-project 1: the book catalog**.

The whole app UI (copy, labels, routes) is in **English**, and the product is
designed **mobile-first**.

## Out of scope for this sub-project

- Dashboard metrics/charts (sub-project 2).
- User-created custom shelves/collections (sub-project 3). The genre grouping
  built here (fixed genre per book, shown as "shelves" in the UI) is *not*
  the same feature — it's a fixed, system-derived grouping, not a
  user-defined collection.
- AI librarian bot (sub-project 4).
- Cloud Storage for Firebase / manual cover upload — covers come exclusively
  from the external book APIs (see below); no image upload path exists in
  this sub-project.

## Data model (Firestore)

### `books/{bookId}` — replaces `items`

```js
{
  userId: "uid",
  title: "string",
  author: "string",
  genre: "fantasy" | "romance" | "mystery_thriller" | "horror" |
         "science_fiction" | "classic" | "historical" | "non_fiction" |
         "biography" | "poetry" | "young_adult" | "self_help", // single value, fixed list
  status: "to_read" | "reading" | "read" | "abandoned",
  rating: number | null,       // 0-5, 0.5 steps; null until the user rates it
  coverUrl: "string" | null,   // external URL from Google Books or Open Library
  isbn: "string" | null,
  totalPages: number | null,
  currentPage: number | null,  // progress % = currentPage / totalPages
  startDate: timestamp | null,
  finishDate: timestamp | null,
  targetDate: timestamp | null,
  published: boolean,          // exposes the book at /books/[id]
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

Fixed genre list is a starting point and can be adjusted during
implementation without re-opening this design.

### `books/{bookId}/notes/{noteId}` — subcollection, reading journal

```js
{
  text: "string",
  page: number | null,   // optional page reference
  createdAt: serverTimestamp()
}
```

Multiple dated entries per book (chosen over a single note field), since the
user wants a journal-style history of thoughts while reading.

### `users/{uid}` — extended

Adds:
```js
{
  username: "string" | null   // unique handle for the public profile URL
}
```

### `usernames/{username}` — uniqueness reservation

```js
{ uid: "string" }
```

Firestore has no native unique constraint, so uniqueness is enforced by
writing `usernames/{username}` and `users/{uid}` together in a single
transaction when the user sets or changes their username.

## External API integration (book search & covers)

Combines two free APIs, no paid tier needed:

- **Google Books API** (primary) — search by title/author/ISBN, key-gated but
  free, 1000 req/day / 1 req/sec. Returns `imageLinks.thumbnail`.
- **Open Library** (fallback) — no key required. Search endpoint
  (`openlibrary.org/search.json`) plus Covers API
  (`covers.openlibrary.org/b/id/{cover_i}-{size}.jpg`) for the actual image.

### Add-book flow

1. User types a title/author/ISBN in `/dashboard/books/new`.
2. Query Google Books first.
3. If no results, fall back to Open Library search automatically.
4. Show a results grid (cover + title + author) for the user to pick from.
5. On selection, the form auto-fills title, author, cover URL, and ISBN
   (when available); the user can still edit every field, including genre,
   status, and dates, before saving.
6. If neither API returns anything, show an **"Add manually"** action that
   opens the same form empty (no dead end).

`lib/books/providers/googleBooks.js` and `lib/books/providers/openLibrary.js`
each expose a `search(query)` function returning a normalized shape
(`{ title, author, coverUrl, isbn, source }`); the add-book flow tries
Google first, then Open Library, and stops at the first provider with
results.

## Routes & pages

```
app/
  dashboard/
    books/                 (list — genre "shelves" + status filter, replaces dashboard/items)
      new/                 (search & select flow)
      [id]/edit/           (form: fields + progress + notes journal)
    profile/                (set/change username; link to own public profile)

  books/[id]/               (public page for ONE book, only if published:true)
  u/[username]/             (public profile: shelves of that user's published books)

components/
  books/
    BookShelfRow.js         (one genre shelf: fanned covers + count + prev/next)
    BookForm.js
    BookSearchResults.js
    RatingStars.js           (0-5, half-star support)
    StatusBadge.js
    NotesList.js / NoteForm.js
  nav/
    BottomNav.js             (icon-only, 5 items — see Visual design)

lib/
  books/
    books.js                 (Firestore CRUD, ownership enforced by userId)
    notes.js                 (CRUD for the notes subcollection)
    providers/googleBooks.js
    providers/openLibrary.js
  users/
    users.js                 (extended: username get/set with transaction)
```

`lib/items/items.js`, `app/dashboard/items/`, `app/items/[id]/`, and
`components/items/` are removed as part of this sub-project (the starter's
placeholder entity is fully replaced by `books`).

`app/dashboard/page.js`, `app/my-books/page.js`, and the custom CSS block
appended to `app/globals.css` (found uncommitted in the working tree) are
**not** part of this design — they were a stray static prototype with fake
data, a broken auth flow, and a desktop-first layout. They are discarded
during implementation in favor of this spec.

## Visual design

Validated interactively via mockups (real cover images pulled live from
Open Library during the session):

- **Palette**: warm cream background (`#f6f1e7`/`#f5f1e8`), near-black text
  (`#20180f`), warm orange accent (`#c96a1f`) for actions/active states/
  ratings, muted tan for secondary text (`#a89a7f`).
- **Typography**: serif (Georgia/Times) for headings ("My Favourite BOOKS"
  style), sans-serif (Arial) for UI chrome/body text.
- **Book list (`/dashboard/books`)**: header "My Favourite BOOKS", a slim
  status-filter chip row (All/Reading/To read/Read) — chips reuse `status`
  values — followed by one **shelf row per genre**: genre name + book count +
  prev/next affordance, with covers shown fanned/overlapping on a colored
  bar (color varies per genre, from the same warm palette family). This
  replaces the earlier plain-grid concept.
- **Book cover badges**: status shown directly on the cover (e.g. "READ",
  "READING · 62%" using `currentPage`/`totalPages`, "TO READ").
- **Bottom nav**: icon-only, no labels (variant "C" from the compared
  options) — Home, Library, a raised circular Add button, Profile, More.
  "More" is where not-yet-built areas (stats, shelves, bot) will live later
  instead of showing disabled tabs.
- **Mobile-first**: all layouts designed at a 375px viewport first; the
  existing starter's dark-mode toggle is superseded by this single warm
  light theme for the reading tracker (dark mode for this product, if
  wanted, is a future decision — not part of this sub-project).

## Error handling

- Every read/write to `books` and `books/{id}/notes` validates
  `userId === session.uid` server-side before acting.
- Private routes without a valid session redirect to `/login` (existing
  pattern).
- Public routes (`/books/[id]`, `/u/[username]`) return 404 when
  `published:false` or the username doesn't resolve to a user.
- Username changes go through the `usernames/{username}` transaction;
  a collision surfaces as an inline form error, no partial writes.
- Google Books / Open Library network failures during search show a
  non-blocking inline error and the "Add manually" fallback stays available.

## Testing

The project has no automated test runner configured today (`npm run lint`
is the only existing check). This sub-project keeps that scope: no new test
suite, manual QA per feature during implementation — consistent with the
starter/course context. Adding a lightweight runner (e.g. Vitest) is a
possible future addition, not part of this plan.
