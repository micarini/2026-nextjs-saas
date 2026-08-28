# Book Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter's `items` placeholder entity with a real `books` entity, delivering a mobile-first personal reading-tracker catalog: CRUD books (with cover search via Google Books/Open Library), a reading-journal notes subcollection, genre "shelf" browsing, a per-book public page, and a public user profile.

**Architecture:** Server Components read Firestore directly through `lib/books/*` and `lib/users/users.js`; all writes go through `"use server"` actions in `app/dashboard/books/actions.js` (and small siblings) that re-validate ownership server-side before touching Firestore, mirroring the existing `items` pattern. Client Components are used only where interactivity is required (the add/search flow, the two forms). The whole reading-tracker UI is a new warm light theme applied per-page via Tailwind utility classes (no new global CSS), while the untouched admin/login/marketing pages keep the starter's existing dark theme.

**Tech Stack:** Next.js 16 App Router, React 19, Firebase Admin SDK (Firestore), Tailwind CSS v4 utility classes, native `fetch` to the Google Books and Open Library public APIs. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-28-book-catalog-design.md`

## Global Constraints

- Mobile-first: every layout in this plan is built for a ~375px viewport first.
- Entire product UI/copy is in English.
- No Cloud Storage / file upload for this sub-project — cover images are only ever an external URL (from search results or manually pasted).
- No automated test framework exists (`npm run lint` is the only existing check) — every task verifies with `npm run lint` and/or a manual walkthrough with `npm run dev`, never with a written test file.
- Genre is a single value from a fixed list (`lib/books/genres.js`); status is one of exactly 4 values: `to_read`, `reading`, `read`, `abandoned`.
- Palette: background `#f6f1e7`, text `#20180f`, accent `#c96a1f`, muted `#a89a7f`, card/nav surface `#fffdf9`, border `#e7dfcf`/`#eee3ce`. Headings use `font-serif` (Tailwind's default serif stack), body/UI uses the default sans stack.
- Bottom nav is icon-only (no labels), 5 items: Home, Library, a raised circular Add button, Profile, More.
- Out of scope (future sub-projects, do not build): dashboard metrics/charts, user-created custom shelves, the AI librarian bot.

---

## File Structure

```
lib/books/
  genres.js               (GENRES list + genreLabel())
  statuses.js              (STATUSES list + statusLabel())
  books.js                 (Firestore CRUD for the `books` collection)
  notes.js                 (Firestore CRUD for the `books/{id}/notes` subcollection)
  search.js                (combines the two providers below)
  providers/
    googleBooks.js
    openLibrary.js

lib/users/users.js          (MODIFY: add username + usernames-collection support)

components/books/
  StatusBadge.js
  RatingStars.js
  BookForm.js
  BookSearchResults.js
  AddBookFlow.js
  BookShelfRow.js
  NotesList.js

components/nav/
  BottomNav.js

components/users/
  UsernameForm.js

app/dashboard/books/
  page.js
  actions.js
  new/
    page.js
    actions.js
  [id]/edit/
    page.js

app/dashboard/profile/
  page.js
  actions.js

app/dashboard/more/
  page.js

app/dashboard/page.js       (MODIFY: rebuilt as a light-theme home screen)

app/books/[id]/page.js
app/u/[username]/page.js

app/page.js                  (MODIFY: swap `items` for `books`)
components/Navbar.js         (MODIFY: swap the `/dashboard/items` link for `/dashboard/books`)
app/globals.css              (MODIFY: discard the stray prototype CSS)

REMOVE: lib/items/items.js, app/dashboard/items/, app/items/, components/items/ItemForm.js
```

---

### Task 1: Discard the stray prototype, restore a clean baseline

**Files:**
- Revert: `app/dashboard/page.js`, `app/globals.css`
- Delete: `app/my-books/`

**Interfaces:** none (cleanup only).

- [ ] **Step 1: Revert the two modified files to the last commit**

```bash
git checkout -- app/dashboard/page.js app/globals.css
```

- [ ] **Step 2: Remove the stray untracked prototype route**

```bash
rm -rf app/my-books
```

- [ ] **Step 3: Verify the tree is clean of the prototype**

Run: `git status --short`
Expected: no output for `app/dashboard/page.js`, `app/globals.css`, or `app/my-books` (they were the only pre-existing changes; this plan's own edits haven't started yet, so the working tree should now be fully clean).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: discard stray dashboard prototype before book catalog build"
```

---

### Task 2: Genre and status constants

**Files:**
- Create: `lib/books/genres.js`
- Create: `lib/books/statuses.js`

**Interfaces:**
- Produces: `GENRES: Array<{value: string, label: string}>`, `genreLabel(value: string): string` from `lib/books/genres.js`.
- Produces: `STATUSES: Array<{value: string, label: string}>`, `statusLabel(value: string): string` from `lib/books/statuses.js`.

- [ ] **Step 1: Create `lib/books/genres.js`**

```js
export const GENRES = [
  { value: "fantasy", label: "Fantasy" },
  { value: "romance", label: "Romance" },
  { value: "mystery_thriller", label: "Mystery & Thriller" },
  { value: "horror", label: "Horror" },
  { value: "science_fiction", label: "Science Fiction" },
  { value: "classic", label: "Classic" },
  { value: "historical", label: "Historical" },
  { value: "non_fiction", label: "Non-fiction" },
  { value: "biography", label: "Biography" },
  { value: "poetry", label: "Poetry" },
  { value: "young_adult", label: "Young Adult" },
  { value: "self_help", label: "Self-help" },
];

export function genreLabel(value) {
  return GENRES.find((genre) => genre.value === value)?.label || GENRES[0].label;
}
```

- [ ] **Step 2: Create `lib/books/statuses.js`**

```js
export const STATUSES = [
  { value: "to_read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "abandoned", label: "Abandoned" },
];

export function statusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label || STATUSES[0].label;
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/books/genres.js` or `lib/books/statuses.js`.

- [ ] **Step 4: Commit**

```bash
git add lib/books/genres.js lib/books/statuses.js
git commit -m "feat: add genre and status constants for the book catalog"
```

---

### Task 3: Books Firestore CRUD

**Files:**
- Create: `lib/books/books.js`

**Interfaces:**
- Consumes: nothing from earlier tasks (uses `@/lib/firebase/firestore`'s `getDb()`, same as `lib/items/items.js`).
- Produces (used by later tasks): `listUserBooks(userId): Promise<Book[]>`, `listPublishedBooks(): Promise<Book[]>`, `listPublishedBooksByUser(userId): Promise<Book[]>`, `getUserBook(userId, bookId): Promise<Book|null>`, `getPublishedBook(bookId): Promise<Book|null>`, `createUserBook(userId, data): Promise<string>` (returns new doc id), `updateUserBook(userId, bookId, data): Promise<void>`, `deleteUserBook(userId, bookId): Promise<void>`.
- `Book` shape: `{ id, userId, title, author, genre, status, rating: number|null, coverUrl, isbn, totalPages: number|null, currentPage: number|null, startDate: string|null, finishDate: string|null, targetDate: string|null, published: boolean, createdAt: string|null, updatedAt: string|null }` (date fields are ISO strings, like the existing `items` pattern).
- `data` passed into `createUserBook`/`updateUserBook` must already contain every field above except `id`/`userId`/`createdAt`/`updatedAt` (validation happens in the caller, in Task 12 — this file trusts its input, exactly like `lib/items/items.js` does).

- [ ] **Step 1: Create `lib/books/books.js`**

```js
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "books";

function serializeBook(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    title: data.title || "",
    author: data.author || "",
    genre: data.genre || "fantasy",
    status: data.status || "to_read",
    rating: typeof data.rating === "number" ? data.rating : null,
    coverUrl: data.coverUrl || "",
    isbn: data.isbn || "",
    totalPages: typeof data.totalPages === "number" ? data.totalPages : null,
    currentPage: typeof data.currentPage === "number" ? data.currentPage : null,
    startDate: data.startDate?.toDate?.().toISOString() || null,
    finishDate: data.finishDate?.toDate?.().toISOString() || null,
    targetDate: data.targetDate?.toDate?.().toISOString() || null,
    published: Boolean(data.published),
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}

function byNewest(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

export async function listUserBooks(userId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map(serializeBook).sort(byNewest);
}

export async function listPublishedBooks() {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("published", "==", true)
    .get();

  return snapshot.docs.map(serializeBook).sort(byNewest);
}

export async function listPublishedBooksByUser(userId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("published", "==", true)
    .get();

  return snapshot.docs.map(serializeBook).sort(byNewest);
}

export async function getUserBook(userId, bookId) {
  const doc = await getDb().collection(COLLECTION).doc(bookId).get();

  if (!doc.exists) {
    return null;
  }

  const book = serializeBook(doc);

  return book.userId === userId ? book : null;
}

export async function getPublishedBook(bookId) {
  const doc = await getDb().collection(COLLECTION).doc(bookId).get();

  if (!doc.exists) {
    return null;
  }

  const book = serializeBook(doc);

  return book.published ? book : null;
}

export async function createUserBook(userId, data) {
  const now = FieldValue.serverTimestamp();

  const docRef = await getDb()
    .collection(COLLECTION)
    .add({
      userId,
      title: data.title,
      author: data.author,
      genre: data.genre,
      status: data.status,
      rating: data.rating,
      coverUrl: data.coverUrl,
      isbn: data.isbn,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      startDate: data.startDate,
      finishDate: data.finishDate,
      targetDate: data.targetDate,
      published: data.published,
      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
}

export async function updateUserBook(userId, bookId, data) {
  const docRef = getDb().collection(COLLECTION).doc(bookId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Book not found.");
  }

  await docRef.update({
    title: data.title,
    author: data.author,
    genre: data.genre,
    status: data.status,
    rating: data.rating,
    coverUrl: data.coverUrl,
    isbn: data.isbn,
    totalPages: data.totalPages,
    currentPage: data.currentPage,
    startDate: data.startDate,
    finishDate: data.finishDate,
    targetDate: data.targetDate,
    published: data.published,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteUserBook(userId, bookId) {
  const docRef = getDb().collection(COLLECTION).doc(bookId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Book not found.");
  }

  const notesSnapshot = await docRef.collection("notes").get();
  const batch = getDb().batch();
  notesSnapshot.docs.forEach((noteDoc) => batch.delete(noteDoc.ref));
  await batch.commit();

  await docRef.delete();
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/books/books.js`.

- [ ] **Step 3: Commit**

```bash
git add lib/books/books.js
git commit -m "feat: add Firestore CRUD for the books collection"
```

---

### Task 4: Notes subcollection CRUD

**Files:**
- Create: `lib/books/notes.js`

**Interfaces:**
- Consumes: `getUserBook(userId, bookId)` from `lib/books/books.js` (Task 3), for ownership checks.
- Produces: `listBookNotes(userId, bookId): Promise<Note[]>`, `addBookNote(userId, bookId, data: {text, page}): Promise<void>`, `deleteBookNote(userId, bookId, noteId): Promise<void>`.
- `Note` shape: `{ id, text, page: number|null, createdAt: string|null }`.
- All three throw `Error("Book not found.")` when the book doesn't exist or isn't owned by `userId`.

- [ ] **Step 1: Create `lib/books/notes.js`**

```js
import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { getUserBook } from "@/lib/books/books";

function serializeNote(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    text: data.text || "",
    page: typeof data.page === "number" ? data.page : null,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

export async function listBookNotes(userId, bookId) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  const snapshot = await getDb()
    .collection("books")
    .doc(bookId)
    .collection("notes")
    .get();

  return snapshot.docs
    .map(serializeNote)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function addBookNote(userId, bookId, data) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  await getDb().collection("books").doc(bookId).collection("notes").add({
    text: data.text,
    page: data.page,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteBookNote(userId, bookId, noteId) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  await getDb()
    .collection("books")
    .doc(bookId)
    .collection("notes")
    .doc(noteId)
    .delete();
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/books/notes.js`.

- [ ] **Step 3: Commit**

```bash
git add lib/books/notes.js
git commit -m "feat: add Firestore CRUD for book notes"
```

---

### Task 5: Google Books search provider

**Files:**
- Create: `lib/books/providers/googleBooks.js`

**Interfaces:**
- Produces: `searchGoogleBooks(query: string): Promise<SearchResult[]>`.
- `SearchResult` shape (shared by both providers, used by Task 7 and the UI): `{ title: string, author: string, coverUrl: string, isbn: string, source: "google_books" | "open_library" }`.
- Never throws for network/API errors — resolves to `[]` instead, so the caller can fall back.

- [ ] **Step 1: Create `lib/books/providers/googleBooks.js`**

```js
export async function searchGoogleBooks(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({ q: trimmed, maxResults: "8" });
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;

  if (apiKey) {
    params.set("key", apiKey);
  }

  let response;

  try {
    response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
    );
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return (data.items || [])
    .map((item) => {
      const info = item.volumeInfo || {};
      const isbnEntry = (info.industryIdentifiers || []).find(
        (entry) => entry.type === "ISBN_13" || entry.type === "ISBN_10",
      );

      return {
        title: info.title || "",
        author: (info.authors || []).join(", "),
        coverUrl: (info.imageLinks?.thumbnail || "").replace("http://", "https://"),
        isbn: isbnEntry?.identifier || "",
        source: "google_books",
      };
    })
    .filter((result) => result.title);
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/books/providers/googleBooks.js`.

- [ ] **Step 3: Commit**

```bash
git add lib/books/providers/googleBooks.js
git commit -m "feat: add Google Books search provider"
```

---

### Task 6: Open Library search provider

**Files:**
- Create: `lib/books/providers/openLibrary.js`

**Interfaces:**
- Produces: `searchOpenLibrary(query: string): Promise<SearchResult[]>` — same `SearchResult` shape as Task 5, `source: "open_library"`. Never throws.

- [ ] **Step 1: Create `lib/books/providers/openLibrary.js`**

```js
export async function searchOpenLibrary(query) {
  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  const params = new URLSearchParams({
    q: trimmed,
    limit: "8",
    fields: "title,author_name,cover_i,isbn",
  });

  let response;

  try {
    response = await fetch(`https://openlibrary.org/search.json?${params.toString()}`);
  } catch {
    return [];
  }

  if (!response.ok) {
    return [];
  }

  const data = await response.json();

  return (data.docs || [])
    .map((doc) => ({
      title: doc.title || "",
      author: (doc.author_name || []).join(", "),
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : "",
      isbn: (doc.isbn || [])[0] || "",
      source: "open_library",
    }))
    .filter((result) => result.title);
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/books/providers/openLibrary.js`.

- [ ] **Step 3: Commit**

```bash
git add lib/books/providers/openLibrary.js
git commit -m "feat: add Open Library search provider"
```

---

### Task 7: Combined book search

**Files:**
- Create: `lib/books/search.js`

**Interfaces:**
- Consumes: `searchGoogleBooks` (Task 5), `searchOpenLibrary` (Task 6).
- Produces: `searchBookCovers(query: string): Promise<SearchResult[]>` — tries Google Books first, falls back to Open Library only if Google returned zero results.

- [ ] **Step 1: Create `lib/books/search.js`**

```js
import { searchGoogleBooks } from "@/lib/books/providers/googleBooks";
import { searchOpenLibrary } from "@/lib/books/providers/openLibrary";

export async function searchBookCovers(query) {
  const googleResults = await searchGoogleBooks(query);

  if (googleResults.length > 0) {
    return googleResults;
  }

  return searchOpenLibrary(query);
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/books/search.js`.

- [ ] **Step 3: Commit**

```bash
git add lib/books/search.js
git commit -m "feat: combine Google Books and Open Library search with fallback"
```

---

### Task 8: Username support in `lib/users/users.js`

**Files:**
- Modify: `lib/users/users.js`

**Interfaces:**
- Produces (new): `getUserByUsername(username: string): Promise<UserProfile|null>`, `setUsername(uid: string, rawUsername: string): Promise<void>` (throws `Error` with a user-facing message on invalid format or collision).
- Modifies: `serializeUser` now also returns `username: string` (empty string when unset) on every existing exported function that returns a profile (`getUserProfile`, `getCurrentUserProfile`, `listUserProfiles`, `getUserByUsername`) — no signature changes for existing exports.
- Adds Firestore collection `usernames/{username} -> { uid }` used only internally by this file.

- [ ] **Step 1: Add `username` to `serializeUser`**

In `lib/users/users.js`, update the `serializeUser` function (the object literal it returns) to add the `username` field:

```js
function serializeUser(doc) {
  const data = doc.data();

  return {
    uid: doc.id, 
    email: data.email || "",
    displayName: data.displayName || "",
    photoURL: data.photoURL || "",
    provider: data.provider || "",
    user_type: normalizeUserType(data.user_type),
    username: data.username || "",
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
    lastLoginAt: data.lastLoginAt?.toDate?.().toISOString() || null,
  };
}
```

- [ ] **Step 2: Add `getUserByUsername` and `setUsername` at the end of the file**

```js
export async function getUserByUsername(username) {
  const trimmed = String(username || "").trim().toLowerCase();

  if (!trimmed) {
    return null;
  }

  const reservationDoc = await getDb().collection("usernames").doc(trimmed).get();

  if (!reservationDoc.exists) {
    return null;
  }

  return getUserProfile(reservationDoc.data().uid);
}

export async function setUsername(uid, rawUsername) {
  const username = String(rawUsername || "").trim().toLowerCase();

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    throw new Error(
      "Username must be 3-20 characters: lowercase letters, numbers, underscore.",
    );
  }

  const usernameRef = getDb().collection("usernames").doc(username);
  const userRef = getDb().collection(COLLECTION).doc(uid);

  await getDb().runTransaction(async (transaction) => {
    const [usernameDoc, userDoc] = await Promise.all([
      transaction.get(usernameRef),
      transaction.get(userRef),
    ]);

    if (usernameDoc.exists && usernameDoc.data().uid !== uid) {
      throw new Error("That username is already taken.");
    }

    const previousUsername = userDoc.data()?.username;

    if (previousUsername && previousUsername !== username) {
      transaction.delete(getDb().collection("usernames").doc(previousUsername));
    }

    transaction.set(usernameRef, { uid });
    transaction.update(userRef, {
      username,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning `lib/users/users.js`.

- [ ] **Step 4: Commit**

```bash
git add lib/users/users.js
git commit -m "feat: add username support with uniqueness reservation"
```

---

### Task 9: Remove the `items` entity and repoint references

**Files:**
- Delete: `lib/items/items.js`, `app/dashboard/items/` (recursive: `page.js`, `actions.js`, `[id]/edit/page.js`), `app/items/` (recursive: `[id]/page.js`), `components/items/ItemForm.js`
- Modify: `components/Navbar.js`, `app/page.js`

**Interfaces:**
- Consumes: `listPublishedBooks` from `lib/books/books.js` (Task 3).
- Produces: nothing new — this task only removes dead code and repoints the two remaining consumers of the old `items` entity so the app builds again.

- [ ] **Step 1: Delete the `items` files and directories**

```bash
rm -f lib/items/items.js
rmdir lib/items 2>/dev/null || true
rm -rf app/dashboard/items
rm -rf app/items
rm -f components/items/ItemForm.js
rmdir components/items 2>/dev/null || true
```

- [ ] **Step 2: Update the nav links in `components/Navbar.js`**

Find this block inside the `links` array definition:

```js
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/items", label: "Items" },
        ]
      : []),
```

Replace with:

```js
    ...(user
      ? [
          { href: "/dashboard", label: "Dashboard" },
          { href: "/dashboard/books", label: "Books" },
        ]
      : []),
```

- [ ] **Step 3: Rewrite `app/page.js` to use published books instead of published items**

```jsx
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { getCurrentUser } from "@/lib/firebase/session";
import { listPublishedBooks } from "@/lib/books/books";
import { getCurrentUserProfile } from "@/lib/users/users";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const profile = user ? await getCurrentUserProfile(user) : null;
  const publishedBooks = await listPublishedBooks();

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar user={user} profile={profile} />

      <section className="mx-auto flex h-auto min-h-[300px] w-full max-w-6xl flex-col justify-center border-t border-zinc-800 px-4 py-8 sm:h-[300px] sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
          Next.js 16 + Firebase
        </p>
        <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-normal text-zinc-50 sm:text-5xl lg:text-6xl lg:leading-none">
          Track your reading life
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">
          A personal reading tracker: log your books, follow your progress
          and share your public shelf.
        </p>
        <div className="mt-7 grid gap-3 sm:flex sm:flex-wrap">
          <Link
            className="inline-flex h-11 w-full items-center justify-center border border-cyan-400 bg-cyan-400 px-5 text-sm font-semibold text-zinc-950 transition hover:border-cyan-300 hover:bg-cyan-300 sm:w-auto"
            href={user ? "/dashboard" : "/login"}
          >
            {user ? "Go to dashboard" : "Sign in"}
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl border-t border-zinc-800 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Public
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-normal text-zinc-50">
              Books shared by readers
            </h2>
          </div>
          <span className="text-sm text-zinc-500">{publishedBooks.length} total</span>
        </div>

        {publishedBooks.length === 0 ? (
          <div className="border border-zinc-800 p-6 text-sm leading-6 text-zinc-400">
            No public books yet.
          </div>
        ) : (
          <div className="grid gap-px overflow-hidden border border-zinc-800 bg-zinc-800 sm:grid-cols-2 lg:grid-cols-3">
            {publishedBooks.map((book) => (
              <article className="min-w-0 bg-zinc-950 p-5" key={book.id}>
                {book.coverUrl ? (
                  <div className="-m-5 mb-5 border-b border-zinc-800 bg-zinc-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={book.title}
                      className="h-44 w-full object-cover"
                      src={book.coverUrl}
                    />
                  </div>
                ) : null}
                <h3 className="mt-1 overflow-wrap-anywhere text-lg font-semibold text-zinc-100">
                  {book.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">{book.author}</p>
                <Link
                  className="mt-5 inline-flex h-10 w-full items-center justify-center border border-zinc-700 px-4 text-sm font-semibold text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
                  href={`/books/${book.id}`}
                >
                  View book
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: no errors, and specifically no "module not found" errors for `@/lib/items/items` (confirms nothing still imports the deleted entity).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove the items placeholder entity, repoint home and nav to books"
```

---

### Task 10: Display components — StatusBadge and RatingStars

**Files:**
- Create: `components/books/StatusBadge.js`
- Create: `components/books/RatingStars.js`

**Interfaces:**
- Produces: `<StatusBadge status currentPage totalPages className />` (no default export args are required except `status`), `<RatingStars rating />`.
- Both are presentational only (no data fetching, no "use client" needed).

- [ ] **Step 1: Create `components/books/StatusBadge.js`**

```jsx
const LABELS = {
  to_read: "TO READ",
  reading: "READING",
  read: "READ",
  abandoned: "ABANDONED",
};

export default function StatusBadge({ status, currentPage, totalPages, className = "" }) {
  const label = LABELS[status] || LABELS.to_read;
  const progress =
    status === "reading" && totalPages
      ? Math.round(((Number(currentPage) || 0) / totalPages) * 100)
      : null;
  const dark = status === "read";

  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-bold ${
        dark ? "bg-[#20180f] text-white" : "bg-white/90 text-[#6b5f4a]"
      } ${className}`}
    >
      {label}
      {progress !== null ? ` · ${progress}%` : ""}
    </span>
  );
}
```

- [ ] **Step 2: Create `components/books/RatingStars.js`**

```jsx
export default function RatingStars({ rating }) {
  if (rating === null || rating === undefined) {
    return null;
  }

  return (
    <span className="text-[10px] tracking-wide text-[#c96a1f]">
      {"★".repeat(Math.round(rating))} {rating.toFixed(1)}
    </span>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning either new file.

- [ ] **Step 4: Commit**

```bash
git add components/books/StatusBadge.js components/books/RatingStars.js
git commit -m "feat: add StatusBadge and RatingStars display components"
```

---

### Task 11: BookForm (create/edit form)

**Files:**
- Create: `components/books/BookForm.js`

**Interfaces:**
- Consumes: `GENRES` (Task 2), `STATUSES` (Task 2).
- Produces: `<BookForm action book initialValues submitLabel />` (client component). `action` is a bound server action accepting `FormData`. `book` is a full `Book` object (edit mode). `initialValues` is a partial `{title, author, coverUrl, isbn}` (create-from-search mode). Neither prop is required (empty manual-add mode).
- Emits form field names consumed by `parseBookForm` in Task 12: `title, author, genre, status, rating, totalPages, currentPage, startDate, finishDate, targetDate, isbn, coverUrl, published`.

- [ ] **Step 1: Create `components/books/BookForm.js`**

```jsx
"use client";

import { useState } from "react";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";

const RATING_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function toDateInputValue(isoString) {
  return isoString ? isoString.slice(0, 10) : "";
}

const fieldClass =
  "h-11 rounded-md border border-[#e7dfcf] bg-white px-3 outline-none focus:border-[#c96a1f]";
const labelClass = "grid gap-1.5 text-sm font-medium text-[#20180f]";

export default function BookForm({ action, book, initialValues, submitLabel = "Save" }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const values = book || initialValues || {};

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (err) {
      setError(err.message || "Could not save the book.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className={labelClass}>
        <span>Title</span>
        <input
          className={fieldClass}
          name="title"
          defaultValue={values.title || ""}
          disabled={loading}
          required
        />
      </label>

      <label className={labelClass}>
        <span>Author</span>
        <input
          className={fieldClass}
          name="author"
          defaultValue={values.author || ""}
          disabled={loading}
          required
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>Genre</span>
          <select
            className={fieldClass}
            name="genre"
            defaultValue={values.genre || GENRES[0].value}
            disabled={loading}
          >
            {GENRES.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <span>Status</span>
          <select
            className={fieldClass}
            name="status"
            defaultValue={values.status || "to_read"}
            disabled={loading}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        <span>Rating</span>
        <select
          className={fieldClass}
          name="rating"
          defaultValue={values.rating ?? ""}
          disabled={loading}
        >
          <option value="">No rating</option>
          {RATING_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value} ★
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          <span>Total pages</span>
          <input
            className={fieldClass}
            name="totalPages"
            type="number"
            min="0"
            defaultValue={values.totalPages ?? ""}
            disabled={loading}
          />
        </label>

        <label className={labelClass}>
          <span>Current page</span>
          <input
            className={fieldClass}
            name="currentPage"
            type="number"
            min="0"
            defaultValue={values.currentPage ?? ""}
            disabled={loading}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className={labelClass}>
          <span>Start date</span>
          <input
            className={fieldClass}
            name="startDate"
            type="date"
            defaultValue={toDateInputValue(values.startDate)}
            disabled={loading}
          />
        </label>

        <label className={labelClass}>
          <span>Finish date</span>
          <input
            className={fieldClass}
            name="finishDate"
            type="date"
            defaultValue={toDateInputValue(values.finishDate)}
            disabled={loading}
          />
        </label>

        <label className={labelClass}>
          <span>Target date</span>
          <input
            className={fieldClass}
            name="targetDate"
            type="date"
            defaultValue={toDateInputValue(values.targetDate)}
            disabled={loading}
          />
        </label>
      </div>

      <label className={labelClass}>
        <span>ISBN (optional)</span>
        <input
          className={fieldClass}
          name="isbn"
          defaultValue={values.isbn || ""}
          disabled={loading}
        />
      </label>

      <label className={labelClass}>
        <span>Cover image URL (optional)</span>
        <input
          className={fieldClass}
          name="coverUrl"
          defaultValue={values.coverUrl || ""}
          disabled={loading}
        />
      </label>

      <label className="flex items-start gap-3 rounded-md border border-[#e7dfcf] bg-white p-3 text-sm font-medium text-[#20180f]">
        <input
          className="mt-1 size-4 accent-[#c96a1f]"
          name="published"
          type="checkbox"
          defaultChecked={Boolean(values.published)}
          disabled={loading}
        />
        <span>
          Make this book public
          <span className="mt-1 block text-sm font-normal leading-6 text-[#a89a7f]">
            Shows it at a public book page and on your public profile.
          </span>
        </span>
      </label>

      <button
        className="h-11 rounded-full bg-[#20180f] text-sm font-semibold text-white disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? "Saving..." : submitLabel}
      </button>

      {error ? (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `components/books/BookForm.js`.

- [ ] **Step 3: Commit**

```bash
git add components/books/BookForm.js
git commit -m "feat: add BookForm for creating and editing books"
```

---

### Task 12: Book server actions (create/update/delete, notes)

**Files:**
- Create: `app/dashboard/books/actions.js`

**Interfaces:**
- Consumes: `createUserBook, updateUserBook, deleteUserBook` (Task 3), `addBookNote, deleteBookNote` (Task 4), `GENRES` (Task 2), `STATUSES` (Task 2), `getCurrentUser` (existing `lib/firebase/session.js`).
- Produces: `createBook(formData): Promise<void>` (redirects to `/dashboard/books`), `updateBook(bookId, formData): Promise<void>` (bind `bookId` first; redirects to `/dashboard/books`), `deleteBook(bookId): Promise<void>` (bind `bookId` first; redirects to `/dashboard/books`), `addNote(bookId, formData): Promise<void>` (bind `bookId` first), `deleteNote(bookId, noteId): Promise<void>` (bind `bookId` first).
- All five re-check `getCurrentUser()` and redirect to `/login` if absent, matching `app/dashboard/items/actions.js`.

- [ ] **Step 1: Create `app/dashboard/books/actions.js`**

```js
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { createUserBook, deleteUserBook, updateUserBook } from "@/lib/books/books";
import { addBookNote, deleteBookNote } from "@/lib/books/notes";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";

function parseOptionalInt(value) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDateInput(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? new Date(trimmed) : null;
}

function parseBookForm(formData) {
  const title = String(formData.get("title") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const genre = String(formData.get("genre") || "");
  const status = String(formData.get("status") || "to_read");
  const ratingRaw = String(formData.get("rating") || "").trim();
  const published = formData.get("published") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!author) {
    throw new Error("Author is required.");
  }

  if (!GENRES.some((entry) => entry.value === genre)) {
    throw new Error("Choose a valid genre.");
  }

  if (!STATUSES.some((entry) => entry.value === status)) {
    throw new Error("Choose a valid status.");
  }

  return {
    title,
    author,
    genre,
    status,
    rating: ratingRaw ? Number(ratingRaw) : null,
    coverUrl: String(formData.get("coverUrl") || "").trim(),
    isbn: String(formData.get("isbn") || "").trim(),
    totalPages: parseOptionalInt(formData.get("totalPages")),
    currentPage: parseOptionalInt(formData.get("currentPage")),
    startDate: parseDateInput(formData.get("startDate")),
    finishDate: parseDateInput(formData.get("finishDate")),
    targetDate: parseDateInput(formData.get("targetDate")),
    published,
  };
}

export async function createBook(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await createUserBook(user.uid, parseBookForm(formData));
  revalidatePath("/");
  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

export async function updateBook(bookId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await updateUserBook(user.uid, bookId, parseBookForm(formData));
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

export async function deleteBook(bookId) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await deleteUserBook(user.uid, bookId);
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

export async function addNote(bookId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const text = String(formData.get("text") || "").trim();

  if (!text) {
    throw new Error("Note text is required.");
  }

  await addBookNote(user.uid, bookId, {
    text,
    page: parseOptionalInt(formData.get("page")),
  });
  revalidatePath(`/dashboard/books/${bookId}/edit`);
}

export async function deleteNote(bookId, noteId) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await deleteBookNote(user.uid, bookId, noteId);
  revalidatePath(`/dashboard/books/${bookId}/edit`);
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `app/dashboard/books/actions.js`.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/books/actions.js
git commit -m "feat: add server actions for book and note CRUD"
```

---

### Task 13: Bottom navigation component

**Files:**
- Create: `components/nav/BottomNav.js`

**Interfaces:**
- Produces: `<BottomNav active="home"|"library"|"add"|"profile"|"more" />`. `active` is optional — when omitted, the component derives it from the current pathname.

- [ ] **Step 1: Create `components/nav/BottomNav.js`**

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
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `components/nav/BottomNav.js`.

- [ ] **Step 3: Commit**

```bash
git add components/nav/BottomNav.js
git commit -m "feat: add icon-only bottom navigation"
```

---

### Task 14: Add-book search & manual flow

**Files:**
- Create: `app/dashboard/books/new/actions.js`
- Create: `components/books/BookSearchResults.js`
- Create: `components/books/AddBookFlow.js`
- Create: `app/dashboard/books/new/page.js`

**Interfaces:**
- Consumes: `searchBookCovers` (Task 7), `createBook` (Task 12), `BookForm` (Task 11), `getCurrentUser` (existing), `BottomNav` (Task 13).
- Produces: `searchBooksAction(query: string): Promise<SearchResult[]>` (server action, throws if not signed in). `<BookSearchResults results onSelect />` (presentational). `<AddBookFlow />` (client, no props — the whole search-then-form flow for the `/dashboard/books/new` page).

- [ ] **Step 1: Create `app/dashboard/books/new/actions.js`**

```js
"use server";

import { getCurrentUser } from "@/lib/firebase/session";
import { searchBookCovers } from "@/lib/books/search";

export async function searchBooksAction(query) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to search books.");
  }

  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  return searchBookCovers(trimmed);
}
```

- [ ] **Step 2: Create `components/books/BookSearchResults.js`**

```jsx
export default function BookSearchResults({ results, onSelect }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {results.map((result, index) => (
        <button
          key={`${result.source}-${result.isbn || result.title}-${index}`}
          type="button"
          onClick={() => onSelect(result)}
          className="text-left"
        >
          <div className="aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0]">
            {result.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.coverUrl}
                alt={result.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[12px] leading-tight text-[#20180f]">
            {result.title}
          </p>
          <p className="text-[11px] text-[#a89a7f]">{result.author}</p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/books/AddBookFlow.js`**

```jsx
"use client";

import { useState, useTransition } from "react";
import BookForm from "@/components/books/BookForm";
import BookSearchResults from "@/components/books/BookSearchResults";
import { searchBooksAction } from "@/app/dashboard/books/new/actions";
import { createBook } from "@/app/dashboard/books/actions";

export default function AddBookFlow() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("search");
  const [isPending, startTransition] = useTransition();

  function handleSearch(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const found = await searchBooksAction(query);
        setResults(found);
        setSearched(true);
      } catch (err) {
        setError(err.message || "Search failed.");
      }
    });
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

- [ ] **Step 4: Create `app/dashboard/books/new/page.js`**

```jsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import AddBookFlow from "@/components/books/AddBookFlow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]">
      <div className="px-5 pt-8">
        <Link href="/dashboard/books" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold">Add a book</h1>
      </div>

      <div className="px-5 py-6">
        <AddBookFlow />
      </div>

      <BottomNav active="add" />
    </main>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run lint`
Expected: no errors mentioning any of the four new files.

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/books/new components/books/BookSearchResults.js components/books/AddBookFlow.js
git commit -m "feat: add the book search-and-add flow"
```

---

### Task 15: Book library page (genre shelves + status filter)

**Files:**
- Create: `components/books/BookShelfRow.js`
- Create: `app/dashboard/books/page.js`

**Interfaces:**
- Consumes: `listUserBooks` (Task 3), `GENRES` (Task 2), `STATUSES` (Task 2), `StatusBadge`/`RatingStars` (Task 10), `BottomNav` (Task 13).
- Produces: `<BookShelfRow genreLabel books hrefFor />` — `hrefFor` is `(book) => string`, defaulting to `` `/dashboard/books/${book.id}/edit` `` so the public-profile page (Task 20) can override it to a public URL.

- [ ] **Step 1: Create `components/books/BookShelfRow.js`**

```jsx
import Link from "next/link";
import RatingStars from "@/components/books/RatingStars";
import StatusBadge from "@/components/books/StatusBadge";

const defaultHrefFor = (book) => `/dashboard/books/${book.id}/edit`;

export default function BookShelfRow({ genreLabel, books, hrefFor = defaultHrefFor }) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-[#20180f]">{genreLabel}</h2>
        <span className="text-[11px] text-[#a89a7f]">
          {books.length} book{books.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {books.map((book) => (
          <Link key={book.id} href={hrefFor(book)} className="w-[92px] shrink-0">
            <div className="relative aspect-[0.68] overflow-hidden rounded-md bg-[#ebe3d0] shadow-[0_8px_18px_rgba(0,0,0,0.15)]">
              {book.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverUrl} alt={book.title} className="h-full w-full object-cover" />
              ) : null}
              <StatusBadge
                status={book.status}
                currentPage={book.currentPage}
                totalPages={book.totalPages}
                className="absolute left-1.5 top-1.5"
              />
            </div>
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-tight text-[#20180f]">
              {book.title}
            </p>
            <p className="text-[11px] text-[#a89a7f]">{book.author}</p>
            <RatingStars rating={book.rating} />
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/books/page.js`**

```jsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";
import BookShelfRow from "@/components/books/BookShelfRow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function BooksPage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { status: statusFilter } = await searchParams;
  const books = await listUserBooks(user.uid);
  const filteredBooks = statusFilter
    ? books.filter((book) => book.status === statusFilter)
    : books;

  const shelves = GENRES.map((genre) => ({
    genre: genre.value,
    label: genre.label,
    books: filteredBooks.filter((book) => book.genre === genre.value),
  })).filter((shelf) => shelf.books.length > 0);

  const chipClass = (isActive) =>
    `whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] ${
      isActive ? "bg-[#20180f] text-white" : "border border-[#e7dfcf] bg-white text-[#6b5f4a]"
    }`;

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]">
      <div className="px-5 pb-2 pt-8">
        <p className="font-serif text-[15px] text-[#6b5f4a]">My Favourite</p>
        <h1 className="font-serif text-[40px] font-bold leading-none">BOOKS</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto px-5 pb-5">
        <Link href="/dashboard/books" className={chipClass(!statusFilter)}>
          All
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status.value}
            href={`/dashboard/books?status=${status.value}`}
            className={chipClass(statusFilter === status.value)}
          >
            {status.label}
          </Link>
        ))}
      </div>

      <div className="px-5">
        {shelves.length === 0 ? (
          <div className="mt-10 rounded-lg border border-[#e7dfcf] bg-white p-6 text-center text-sm text-[#6b5f4a]">
            No books yet. Search for a title or add one manually to start your library.
          </div>
        ) : (
          shelves.map((shelf) => (
            <BookShelfRow key={shelf.genre} genreLabel={shelf.label} books={shelf.books} />
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

      <BottomNav active="library" />
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning either new file.

- [ ] **Step 4: Commit**

```bash
git add components/books/BookShelfRow.js app/dashboard/books/page.js
git commit -m "feat: add the My Books library page with genre shelves and status filter"
```

---

### Task 16: Book edit page with notes

**Files:**
- Create: `components/books/NotesList.js`
- Create: `app/dashboard/books/[id]/edit/page.js`

**Interfaces:**
- Consumes: `getUserBook` (Task 3), `listBookNotes` (Task 4), `BookForm` (Task 11), `updateBook, deleteBook, addNote, deleteNote` (Task 12), `BottomNav` (Task 13).
- Produces: `<NotesList notes addNoteAction deleteNoteAction />` — `addNoteAction` is `addNote` already bound to a `bookId`; `deleteNoteAction` is `deleteNote` already bound to that same `bookId` (this component binds the `noteId` itself per row).

- [ ] **Step 1: Create `components/books/NotesList.js`**

```jsx
function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(value));
}

export default function NotesList({ notes, addNoteAction, deleteNoteAction }) {
  return (
    <div className="mt-3 grid gap-3">
      <form action={addNoteAction} className="grid gap-2 rounded-md border border-[#e7dfcf] bg-white p-3">
        <textarea
          name="text"
          placeholder="Write a note..."
          className="min-h-20 resize-y rounded-md border border-[#e7dfcf] px-3 py-2 text-sm outline-none focus:border-[#c96a1f]"
          required
        />
        <div className="flex items-center gap-2">
          <input
            name="page"
            type="number"
            min="0"
            placeholder="Page (optional)"
            className="h-10 w-32 rounded-md border border-[#e7dfcf] px-3 text-sm outline-none focus:border-[#c96a1f]"
          />
          <button type="submit" className="h-10 flex-1 rounded-md bg-[#20180f] text-sm font-semibold text-white">
            Add note
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-[#a89a7f]">No notes yet.</p>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="rounded-md border border-[#e7dfcf] bg-white p-3">
            <p className="whitespace-pre-wrap text-sm text-[#20180f]">{note.text}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#a89a7f]">
              <span>
                {formatDate(note.createdAt)}
                {note.page !== null ? ` · p. ${note.page}` : ""}
              </span>
              <form action={deleteNoteAction.bind(null, note.id)}>
                <button type="submit" className="text-red-700 underline">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/books/[id]/edit/page.js`**

```jsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserBook } from "@/lib/books/books";
import { listBookNotes } from "@/lib/books/notes";
import BookForm from "@/components/books/BookForm";
import NotesList from "@/components/books/NotesList";
import BottomNav from "@/components/nav/BottomNav";
import { updateBook, deleteBook, addNote, deleteNote } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const book = await getUserBook(user.uid, id);

  if (!book) {
    notFound();
  }

  const notes = await listBookNotes(user.uid, id);

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]">
      <div className="px-5 pt-8">
        <Link href="/dashboard/books" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold">Edit book</h1>
      </div>

      <div className="px-5 py-6">
        <BookForm action={updateBook.bind(null, book.id)} book={book} submitLabel="Save changes" />

        <form action={deleteBook.bind(null, book.id)} className="mt-4">
          <button
            type="submit"
            className="h-11 w-full rounded-md border border-red-300 text-sm font-semibold text-red-700"
          >
            Delete book
          </button>
        </form>

        <div className="mt-8">
          <h2 className="font-serif text-xl font-bold">Notes</h2>
          <NotesList
            notes={notes}
            addNoteAction={addNote.bind(null, book.id)}
            deleteNoteAction={deleteNote.bind(null, book.id)}
          />
        </div>
      </div>

      <BottomNav active="library" />
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint`
Expected: no errors mentioning either new file.

- [ ] **Step 4: Commit**

```bash
git add components/books/NotesList.js app/dashboard/books/[id]
git commit -m "feat: add the book edit page with the notes journal"
```

---

### Task 17: Public book page

**Files:**
- Create: `app/books/[id]/page.js`

**Interfaces:**
- Consumes: `getPublishedBook` (Task 3), `genreLabel` (Task 2), `statusLabel` (Task 2), `RatingStars` (Task 10).

- [ ] **Step 1: Create `app/books/[id]/page.js`**

```jsx
import { notFound } from "next/navigation";
import { getPublishedBook } from "@/lib/books/books";
import { genreLabel } from "@/lib/books/genres";
import { statusLabel } from "@/lib/books/statuses";
import RatingStars from "@/components/books/RatingStars";

export const dynamic = "force-dynamic";

export default async function PublicBookPage({ params }) {
  const { id } = await params;
  const book = await getPublishedBook(id);

  if (!book) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 py-10 text-[#20180f]">
      <div className="mx-auto max-w-md">
        <div className="mx-auto w-48 overflow-hidden rounded-lg shadow-[0_15px_35px_rgba(0,0,0,0.2)]">
          {book.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverUrl} alt={book.title} className="w-full object-cover" />
          ) : null}
        </div>

        <h1 className="mt-6 text-center font-serif text-3xl font-bold">{book.title}</h1>
        <p className="mt-1 text-center text-[#a89a7f]">{book.author}</p>

        <div className="mt-4 flex justify-center gap-2 text-[11px]">
          <span className="rounded-full bg-white px-3 py-1">{genreLabel(book.genre)}</span>
          <span className="rounded-full bg-white px-3 py-1">{statusLabel(book.status)}</span>
        </div>

        <div className="mt-3 flex justify-center">
          <RatingStars rating={book.rating} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `app/books/[id]/page.js`.

- [ ] **Step 3: Commit**

```bash
git add app/books
git commit -m "feat: add the public book page"
```

---

### Task 18: Dashboard home page

**Files:**
- Modify (rewrite): `app/dashboard/page.js`

**Interfaces:**
- Consumes: `getCurrentUser` (existing), `getCurrentUserProfile` (existing), `listUserBooks` (Task 3), `BottomNav` (Task 13).

- [ ] **Step 1: Rewrite `app/dashboard/page.js`**

```jsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { listUserBooks } from "@/lib/books/books";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, books] = await Promise.all([
    getCurrentUserProfile(user),
    listUserBooks(user.uid),
  ]);

  const currentlyReading = books.filter((book) => book.status === "reading");

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-10 text-[#20180f]">
      <p className="font-serif text-[15px] text-[#6b5f4a]">Welcome back</p>
      <h1 className="mt-1 font-serif text-4xl font-bold">
        {profile?.displayName || "Reader"}
      </h1>

      <p className="mt-4 text-sm text-[#a89a7f]">
        {books.length} book{books.length === 1 ? "" : "s"} in your library
        {currentlyReading.length > 0 ? `, ${currentlyReading.length} currently reading` : ""}.
      </p>

      <Link
        href="/dashboard/books"
        className="mt-6 block rounded-full bg-[#20180f] py-3.5 text-center text-sm font-semibold text-white"
      >
        Go to my library
      </Link>

      <BottomNav active="home" />
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `app/dashboard/page.js`.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/page.js
git commit -m "feat: rebuild the dashboard home screen for the reading tracker"
```

---

### Task 19: Profile page (username + logout)

**Files:**
- Create: `components/users/UsernameForm.js`
- Create: `app/dashboard/profile/actions.js`
- Create: `app/dashboard/profile/page.js`

**Interfaces:**
- Consumes: `setUsername` (Task 8), `getCurrentUserProfile` (existing), `logout` (existing `app/dashboard/actions.js`), `BottomNav` (Task 13).
- Produces: `saveUsername(formData): Promise<void>` (server action; throws — does not redirect — so `UsernameForm` can show the error inline). `<UsernameForm action currentUsername />` (client).

- [ ] **Step 1: Create `components/users/UsernameForm.js`**

```jsx
"use client";

import { useState } from "react";

export default function UsernameForm({ action, currentUsername }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await action(new FormData(event.currentTarget));
    } catch (err) {
      setError(err.message || "Could not save the username.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-2">
      <label className="text-sm font-medium text-[#20180f]">
        Public username
        <input
          name="username"
          defaultValue={currentUsername || ""}
          placeholder="e.g. mia_reads"
          disabled={loading}
          className="mt-1.5 h-11 w-full rounded-md border border-[#e7dfcf] bg-white px-3 outline-none focus:border-[#c96a1f]"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-md bg-[#20180f] text-sm font-semibold text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save username"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
```

- [ ] **Step 2: Create `app/dashboard/profile/actions.js`**

```js
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { setUsername } from "@/lib/users/users";

export async function saveUsername(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await setUsername(user.uid, String(formData.get("username") || ""));
  revalidatePath("/dashboard/profile");
}
```

- [ ] **Step 3: Create `app/dashboard/profile/page.js`**

```jsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { logout } from "@/app/dashboard/actions";
import BottomNav from "@/components/nav/BottomNav";
import UsernameForm from "@/components/users/UsernameForm";
import { saveUsername } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-8 text-[#20180f]">
      <h1 className="font-serif text-3xl font-bold">Profile</h1>
      <p className="mt-1 text-sm text-[#a89a7f]">{user.email}</p>

      <UsernameForm action={saveUsername} currentUsername={profile?.username} />

      {profile?.username ? (
        <p className="mt-3 text-sm text-[#a89a7f]">
          Public profile: <span className="text-[#c96a1f]">/u/{profile.username}</span>
        </p>
      ) : null}

      <form action={logout} className="mt-8">
        <button
          type="submit"
          className="h-11 w-full rounded-md border border-[#e7dfcf] bg-white text-sm font-semibold text-[#20180f]"
        >
          Log out
        </button>
      </form>

      <BottomNav active="profile" />
    </main>
  );
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`
Expected: no errors mentioning any of the three new files.

- [ ] **Step 5: Commit**

```bash
git add components/users/UsernameForm.js app/dashboard/profile
git commit -m "feat: add the profile page with username setup and logout"
```

---

### Task 20: Public profile page

**Files:**
- Create: `app/u/[username]/page.js`

**Interfaces:**
- Consumes: `getUserByUsername` (Task 8), `listPublishedBooksByUser` (Task 3), `GENRES` (Task 2), `BookShelfRow` with its `hrefFor` override (Task 15).

- [ ] **Step 1: Create `app/u/[username]/page.js`**

```jsx
import { notFound } from "next/navigation";
import { getUserByUsername } from "@/lib/users/users";
import { listPublishedBooksByUser } from "@/lib/books/books";
import { GENRES } from "@/lib/books/genres";
import BookShelfRow from "@/components/books/BookShelfRow";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const books = await listPublishedBooksByUser(profile.uid);

  const shelves = GENRES.map((genre) => ({
    genre: genre.value,
    label: genre.label,
    books: books.filter((book) => book.genre === genre.value),
  })).filter((shelf) => shelf.books.length > 0);

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 py-10 text-[#20180f]">
      <div className="mx-auto max-w-md">
        <p className="text-center font-serif text-[15px] text-[#6b5f4a]">
          {profile.displayName || profile.email}
        </p>
        <h1 className="text-center font-serif text-4xl font-bold">@{profile.username}</h1>

        <div className="mt-8">
          {shelves.length === 0 ? (
            <p className="text-center text-sm text-[#a89a7f]">No public books yet.</p>
          ) : (
            shelves.map((shelf) => (
              <BookShelfRow
                key={shelf.genre}
                genreLabel={shelf.label}
                books={shelf.books}
                hrefFor={(book) => `/books/${book.id}`}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `app/u/[username]/page.js`.

Note: `listPublishedBooksByUser` filters on two fields (`userId` and `published`) with plain equality, which Firestore serves without a manual composite index. If Firestore's error message ever asks for one, follow the link it prints — that is a Firebase Console action, not a code change.

- [ ] **Step 3: Commit**

```bash
git add app/u
git commit -m "feat: add the public profile page with published genre shelves"
```

---

### Task 21: "More" placeholder page

**Files:**
- Create: `app/dashboard/more/page.js`

**Interfaces:**
- Consumes: `getCurrentUser`, `getCurrentUserProfile` (existing), `BottomNav` (Task 13).

- [ ] **Step 1: Create `app/dashboard/more/page.js`**

```jsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function MorePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-10 text-[#20180f]">
      <h1 className="font-serif text-3xl font-bold">More</h1>

      <div className="mt-6 grid gap-3">
        <div className="rounded-md border border-[#e7dfcf] bg-white p-4">
          <p className="text-sm font-semibold">Coming soon</p>
          <p className="mt-1 text-sm text-[#a89a7f]">
            Reading stats, custom shelves, and the AI librarian bot are on their way.
          </p>
        </div>

        {isAdmin ? (
          <Link
            href="/dashboard/users"
            className="rounded-md border border-[#e7dfcf] bg-white p-4 text-sm font-semibold"
          >
            Admin: manage users →
          </Link>
        ) : null}
      </div>

      <BottomNav active="more" />
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run lint`
Expected: no errors mentioning `app/dashboard/more/page.js`.

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/more
git commit -m "feat: add the More placeholder page"
```

---

### Task 22: End-to-end manual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Confirm `.env` is filled in**

Run: `test -f .env && echo present || echo missing`
Expected: `present`. If missing, copy `.env.example` to `.env` and fill in Firebase Web App + Admin SDK credentials before continuing (see `README.md`'s Configuracion section) — none of the steps below work without a real Firebase project.

- [ ] **Step 2: Start the dev server**

```bash
npm run dev
```

Expected: starts without errors, listening on `http://localhost:3000`.

- [ ] **Step 3: Walk the full flow in a browser (resize to ~375px width, or use device toolbar)**

1. Visit `http://localhost:3000`, sign in (or create an account) via `/login`.
2. Land on `/dashboard` — confirm the cream/orange home screen shows a welcome message and a "Go to my library" button, with the icon-only bottom nav visible.
3. Tap the bottom nav's raised **+** button (or "Go to my library" → "Add Books") to reach `/dashboard/books/new`.
4. Search for a real title (e.g. "Circe"), confirm real cover thumbnails appear in a 3-column grid.
5. Tap a result, confirm the form pre-fills title/author/cover, fill in genre/status/rating/pages/dates, submit.
6. Confirm you land back on `/dashboard/books` and the new book appears under the correct genre shelf with the right status badge.
7. Tap the book cover, confirm it opens `/dashboard/books/[id]/edit` with the same data.
8. Add a note with a page number, confirm it appears in the list with the date and page.
9. Check "Make this book public" and save; confirm the book still shows correctly.
10. Visit `/books/[id]` directly (copy the id from the URL) — confirm the public page renders without being signed in (use a private/incognito window).
11. Go to `/dashboard/profile`, set a username, confirm it saves and the "/u/username" hint appears; try setting the same username from a second account and confirm it's rejected with an inline error (skip if only one test account is available).
12. Visit `/u/[your-username]` in an incognito window — confirm the published book(s) show grouped by genre.
13. Tap "Delete book" from the edit page, confirm it's removed from `/dashboard/books`.
14. Tap the bottom nav's status chips (All/Reading/To read/Read/Abandoned) on `/dashboard/books`, confirm the shelves filter correctly.
15. Visit `/` (signed out), confirm it lists published books (not items) and links to `/books/[id]` correctly.

- [ ] **Step 4: Run the full lint one more time**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 5: Final commit (only if Step 3 surfaced fixes)**

```bash
git add -A
git commit -m "fix: address issues found during end-to-end verification"
```

If Step 3 passed with no fixes needed, skip this commit — the feature is already fully committed task-by-task.
