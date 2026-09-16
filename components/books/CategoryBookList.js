"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  STATUSES,
} from "@/lib/books/statuses";

import {
  setDiscoveryBookStatus,
} from "@/app/dashboard/books/actions";


/* =========================================================
   LABELS
========================================================= */

const STATUS_LABELS = {
  to_read:
    "Want to read",

  reading:
    "Currently reading",

  read:
    "Read",

  abandoned:
    "Abandoned",
};


const STATUS_STYLES = {
  to_read:
    "bg-[#c8e75b] text-[#303427]",

  reading:
    "bg-[#36366f] text-white",

  read:
    "bg-[#36366f] text-white",

  abandoned:
    "bg-[#ece9e2] text-[#77747d]",
};


/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`´]/g, "")
    .replace(
      /[^\p{L}\p{N}]+/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeTitle(value) {
  return normalize(
    String(value || "")
      .replace(
        /\([^)]*(?:edition|paperback|hardcover|ebook|kindle)[^)]*\)/gi,
        " "
      )
      .replace(
        /\b(?:special|anniversary|illustrated|deluxe)\s+edition\b/gi,
        " "
      )
  );
}


const STOP_WORDS =
  new Set([
    "the",
    "a",
    "an",
    "and",
    "of",
    "in",
    "for",
    "to",

    "el",
    "la",
    "los",
    "las",
    "de",
    "del",
    "y",
  ]);


function titleTokens(value) {
  return normalizeTitle(
    value
  )
    .split(" ")
    .filter(Boolean)
    .filter(
      (word) =>
        !STOP_WORDS.has(
          word
        )
    );
}


/* =========================================================
   SAME WORK
========================================================= */

function sameWork(
  first,
  second
) {
  if (
    !first?.title ||
    !second?.title
  ) {
    return false;
  }


  /*
   * ISBN exacto.
   */

  const firstIsbn =
    String(
      first.isbn || ""
    ).replace(
      /[^0-9X]/gi,
      ""
    );

  const secondIsbn =
    String(
      second.isbn || ""
    ).replace(
      /[^0-9X]/gi,
      ""
    );


  if (
    firstIsbn &&
    secondIsbn &&
    firstIsbn ===
      secondIsbn
  ) {
    return true;
  }


  /*
   * Autor.
   */

  const firstAuthor =
    normalize(
      first.author ||
      first.authors?.[0]
    );

  const secondAuthor =
    normalize(
      second.author ||
      second.authors?.[0]
    );


  if (
    firstAuthor &&
    secondAuthor &&
    firstAuthor !==
      secondAuthor
  ) {
    return false;
  }


  /*
   * Título exacto.
   */

  const firstTitle =
    normalizeTitle(
      first.title
    );

  const secondTitle =
    normalizeTitle(
      second.title
    );


  if (
    firstTitle ===
    secondTitle
  ) {
    return true;
  }


  /*
   * Detectar:
   *
   * The Lightning Thief
   *
   * vs
   *
   * Percy Jackson and the Olympians:
   * The Lightning Thief
   */

  const firstTokens =
    titleTokens(
      first.title
    );

  const secondTokens =
    titleTokens(
      second.title
    );


  if (
    firstTokens.length < 2 ||
    secondTokens.length < 2
  ) {
    return false;
  }


  const firstSet =
    new Set(
      firstTokens
    );

  const secondSet =
    new Set(
      secondTokens
    );


  const intersection =
    [...firstSet].filter(
      (word) =>
        secondSet.has(
          word
        )
    ).length;


  const smaller =
    Math.min(
      firstSet.size,
      secondSet.size
    );


  return (
    intersection /
      smaller >=
    0.9
  );
}


/* =========================================================
   FIND SAVED BOOK
========================================================= */

function getSavedBook(
  book,
  userBooks
) {
  return (
    userBooks.find(
      (saved) =>
        sameWork(
          book,
          saved
        )
    ) || null
  );
}


/* =========================================================
   UNIQUE REACT KEY
========================================================= */

function getRowKey(
  book,
  index
) {
  const identity =
    book.googleBooksId ||
    book.openLibraryId ||
    book.id ||
    book.isbn ||
    `${normalizeTitle(
      book.title
    )}-${normalize(
      book.author
    )}`;


  /*
   * index al final garantiza que incluso si
   * el proveedor devuelve IDs repetidos,
   * React recibe una key única.
   */

  return `${identity}-${index}`;
}


/* =========================================================
   FORMAT
========================================================= */

function formatRatings(
  value
) {
  const number =
    Number(value) || 0;


  if (!number) {
    return null;
  }


  return new Intl.NumberFormat(
    "en-US"
  ).format(number);
}


function getYear(value) {
  if (!value) {
    return null;
  }


  return String(value)
    .slice(0, 4);
}


/* =========================================================
   ICONS
========================================================= */

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}


function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}


/* =========================================================
   RATING
========================================================= */

function Rating({
  rating,
  count,
  year,
}) {
  const value =
    Number(rating) || 0;


  const rounded =
    Math.round(value);


  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">

      {value > 0 ? (
        <>
          <div className="flex gap-[1px] text-[12px] text-[#c8e75b]">

            {[1, 2, 3, 4, 5].map(
              (star) => (
                <span
                  key={star}
                  className={
                    star <= rounded
                      ? "opacity-100"
                      : "text-[#d8d7df]"
                  }
                >
                  ★
                </span>
              )
            )}

          </div>


          <span className="text-[11px] font-medium text-[#36366f]">
            {value.toFixed(
              2
            )}
          </span>
        </>
      ) : null}


      {count ? (
        <span className="text-[10px] text-[#9a979f]">
          {formatRatings(
            count
          )}{" "}
          ratings
        </span>
      ) : null}


      {year ? (
        <span className="text-[10px] text-[#9a979f]">
          · {year}
        </span>
      ) : null}

    </div>
  );
}


/* =========================================================
   STATUS SELECT
========================================================= */

function BookStatusSelect({
  book,
  savedBook,
  categorySlug,
}) {
  const router =
    useRouter();


  const [
    currentStatus,
    setCurrentStatus,
  ] =
    useState(
      savedBook?.status ||
      ""
    );


  const [
    savedBookId,
    setSavedBookId,
  ] =
    useState(
      savedBook?.id ||
      null
    );


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  async function handleChange(
    event
  ) {
    const nextStatus =
      event.target.value;


    if (
      !nextStatus ||
      saving
    ) {
      return;
    }


    const previousStatus =
      currentStatus;


    setCurrentStatus(
      nextStatus
    );

    setSaving(true);
    setError("");


    try {
      const result =
        await setDiscoveryBookStatus({
          book,

          status:
            nextStatus,

          categorySlug,

          existingBookId:
            savedBookId,
        });


      if (
        result?.bookId
      ) {
        setSavedBookId(
          result.bookId
        );
      }


      router.refresh();

    } catch (err) {

      console.error(
        err
      );


      setCurrentStatus(
        previousStatus
      );


      setError(
        "Could not save"
      );

    } finally {

      setSaving(false);

    }
  }


  const style =
    currentStatus
      ? STATUS_STYLES[
          currentStatus
        ] ||
        STATUS_STYLES.to_read
      : "bg-[#c8e75b] text-[#303427]";


  return (
    <div className="mt-3">

      <div
        className={`
          relative
          inline-flex
          min-w-[148px]
          items-center
          rounded-full
          ${style}
          transition
          ${
            saving
              ? "opacity-60"
              : ""
          }
        `}
      >

        <select
          value={
            currentStatus
          }
          onChange={
            handleChange
          }
          disabled={
            saving
          }
          aria-label={`Reading status for ${book.title}`}
          className="
            relative
            z-10
            h-9
            w-full
            cursor-pointer
            appearance-none
            rounded-full
            bg-transparent
            pl-4
            pr-9
            text-[10px]
            font-semibold
            outline-none
          "
        >

          {!currentStatus ? (
            <option
              value=""
              disabled
            >
              Add to library
            </option>
          ) : null}


          {STATUSES.map(
            (status) => (

              <option
                key={
                  status.value
                }
                value={
                  status.value
                }
                className="bg-white text-[#36366f]"
              >
                {
                  STATUS_LABELS[
                    status.value
                  ] ||
                  status.label
                }
              </option>

            )
          )}

        </select>


        <span className="pointer-events-none absolute right-3 flex items-center">
          {saving ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
          ) : currentStatus ? (
            <CheckIcon />
          ) : (
            <ChevronIcon />
          )}
        </span>

      </div>


      {error ? (
        <p className="mt-1 text-[9px] text-red-500">
          {error}
        </p>
      ) : null}

    </div>
  );
}


/* =========================================================
   ROW
========================================================= */

function CategoryBookRow({
  book,
  savedBook,
  categorySlug,
}) {
  return (
    <article
      className="
        grid
        grid-cols-[76px_minmax(0,1fr)]
        gap-4
        rounded-[22px]
        border
        border-[#e4e2da]
        bg-white
        p-3
        shadow-[0_8px_25px_rgba(54,54,111,0.045)]
      "
    >

      {/* COVER */}

      <div
        className="
          relative
          aspect-[0.66]
          overflow-hidden
          rounded-[9px]
          bg-[#ecebe6]
          shadow-[0_8px_18px_rgba(54,54,111,0.16)]
        "
      >

        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              book.coverUrl
            }
            alt={
              book.title
            }
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (

          <div className="flex h-full items-center justify-center bg-[#36366f] p-2 text-center">

            <span className="text-[8px] font-medium text-white/75">
              {book.title}
            </span>

          </div>

        )}


        {savedBook ? (
          <span
            className="
              absolute
              right-1.5
              top-1.5
              h-2
              w-2
              rounded-full
              bg-[#c8e75b]
              ring-2
              ring-[#36366f]
            "
          />
        ) : null}

      </div>


      {/* INFO */}

      <div className="min-w-0 py-1">

        <p
          className="
            font-mono
            text-[7px]
            uppercase
            tracking-[0.18em]
            text-[#9a979f]
          "
        >
          {savedBook
            ? "In your library"
            : "Discover"}
        </p>


        <h2
          className="
            mt-1
            line-clamp-2
            text-[15px]
            font-semibold
            leading-[1.15]
            tracking-[-0.025em]
            text-[#36366f]
          "
        >
          {book.title}
        </h2>


        {book.author ? (
          <p className="mt-1 line-clamp-1 text-[10px] text-[#77747d]">
            {book.author}
          </p>
        ) : null}


        <Rating
          rating={
            book.averageRating ||
            book.rating
          }

          count={
            book.ratingsCount
          }

          year={
            getYear(
              book.publishedDate
            )
          }
        />


        <BookStatusSelect
          book={
            book
          }

          savedBook={
            savedBook
          }

          categorySlug={
            categorySlug
          }
        />

      </div>

    </article>
  );
}


/* =========================================================
   LIST
========================================================= */

export default function CategoryBookList({
  books = [],
  userBooks = [],
  categorySlug,
}) {
  return (
    <div className="space-y-3">

      {books.map(
        (
          book,
          index
        ) => {

          const savedBook =
            getSavedBook(
              book,
              userBooks
            );


          return (
            <CategoryBookRow
              key={
                getRowKey(
                  book,
                  index
                )
              }

              book={
                book
              }

              savedBook={
                savedBook
              }

              categorySlug={
                categorySlug
              }
            />
          );
        }
      )}

    </div>
  );
}