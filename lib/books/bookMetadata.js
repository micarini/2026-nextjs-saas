import "server-only";

import {
  unstable_cache,
} from "next/cache";


function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(
      /[^\p{L}\p{N}]+/gu,
      " "
    )
    .replace(/\s+/g, " ")
    .trim();
}

function emptyMetadata(isbn = "") {
  return {
    totalPages: null,
    averageRating: null,
    ratingsCount: null,
    isbn,
    openLibraryId: "",
  };
}


function normalizeIsbn(value) {
  return String(value || "")
    .replace(/[^0-9X]/gi, "")
    .toUpperCase();
}


function getPositiveNumber(value) {
  const number =
    Number(value);

  return (
    Number.isFinite(number) &&
    number > 0
  )
    ? Math.round(number)
    : null;
}

function getAverageRating(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0 && number <= 5
    ? Math.round(number * 10) / 10
    : null;
}

async function fetchGoogleBooksRating(title, author, isbn) {
  const query = isbn
    ? `isbn:${isbn}`
    : `intitle:${title}${author ? ` inauthor:${author}` : ""}`;
  const params = new URLSearchParams({
    q: query,
    maxResults: "5",
    printType: "books",
  });

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    params.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?${params.toString()}`,
      { signal: AbortSignal.timeout(6000), cache: "no-store" }
    );

    if (!response.ok) {
      return { averageRating: null, ratingsCount: null };
    }

    const items = (await response.json()).items || [];
    const targetTitle = normalize(title);
    const match = items.find((item) => {
      const info = item.volumeInfo || {};
      return normalize(info.title) === targetTitle;
    }) || items[0];
    const info = match?.volumeInfo || {};

    return {
      averageRating: getAverageRating(info.averageRating),
      ratingsCount: getPositiveNumber(info.ratingsCount),
    };
  } catch {
    return { averageRating: null, ratingsCount: null };
  }
}


function getBestDocument(
  docs,
  title,
  author
) {
  if (!docs.length) {
    return null;
  }

  const targetTitle =
    normalize(title);

  const targetAuthor =
    normalize(author);


  /*
   * Primero intentamos título + autor exactos.
   */
  const exact =
    docs.find((doc) => {
      const docTitle =
        normalize(doc.title);

      const authors =
        Array.isArray(
          doc.author_name
        )
          ? doc.author_name
          : [];

      const authorMatch =
        !targetAuthor ||
        authors.some(
          (name) =>
            normalize(name) ===
            targetAuthor
        );

      return (
        docTitle === targetTitle &&
        authorMatch
      );
    });


  if (exact) {
    return exact;
  }


  /*
   * Después título exacto.
   */
  const titleMatch =
    docs.find(
      (doc) =>
        normalize(doc.title) ===
        targetTitle
    );


  return (
    titleMatch ||
    docs[0] ||
    null
  );
}


async function fetchMetadata(
  title,
  author,
  isbn
) {
  const cleanIsbn =
    normalizeIsbn(isbn);
  const googleRating = await fetchGoogleBooksRating(
    title,
    author,
    cleanIsbn
  );


  /* ========================================
     1. ISBN

     Si tenemos ISBN, esta es la consulta
     más precisa.
  ========================================= */

  if (cleanIsbn) {
    try {
      const key =
        `ISBN:${cleanIsbn}`;

      const response =
        await fetch(
          `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(
            key
          )}&jscmd=data&format=json`,
          {
            signal:
              AbortSignal.timeout(
                5000
              ),
          }
        );


      if (response.ok) {
        const data =
          await response.json();

        const edition =
          data?.[key];


        const pages =
          getPositiveNumber(
            edition?.number_of_pages
          );


        if (pages) {
          return {
            totalPages:
              pages,

            averageRating:
              googleRating.averageRating,

            ratingsCount:
              googleRating.ratingsCount,

            isbn:
              cleanIsbn,

            openLibraryId:
              edition?.key
                ?.replace(
                  "/books/",
                  ""
                ) || "",
          };
        }
      }

    } catch {
      // Continúa con búsqueda
      // por título + autor.
    }
  }


  /* ========================================
     2. TITLE + AUTHOR
  ========================================= */

  if (!title) {
    return {
      totalPages: null,
      ...googleRating,
      isbn: cleanIsbn,
      openLibraryId: "",
    };
  }


  try {
    const params =
      new URLSearchParams();

    params.set(
      "title",
      title
    );

    if (author) {
      params.set(
        "author",
        author
      );
    }

    params.set(
      "limit",
      "5"
    );

    params.set(
      "fields",
      [
        "key",
        "title",
        "author_name",
        "number_of_pages_median",
        "isbn",
        "ratings_average",
        "ratings_count",
      ].join(",")
    );


    const response =
      await fetch(
        `https://openlibrary.org/search.json?${params.toString()}`,
        {
          signal:
            AbortSignal.timeout(
              6000
            ),
        }
      );


    if (!response.ok) {
      return emptyMetadata(cleanIsbn);
    }


    const data =
      await response.json();


    const docs =
      Array.isArray(
        data?.docs
      )
        ? data.docs
        : [];


    const match =
      getBestDocument(
        docs,
        title,
        author
      );


    if (!match) {
      return emptyMetadata(cleanIsbn);
    }


    const pages =
      getPositiveNumber(
        match.number_of_pages_median
      );


    const foundIsbn =
      Array.isArray(match.isbn)
        ? normalizeIsbn(
            match.isbn[0]
          )
        : "";


    return {
      totalPages:
        pages,

      averageRating:
        googleRating.averageRating ??
        getAverageRating(match.ratings_average),

      ratingsCount:
        googleRating.ratingsCount ??
        getPositiveNumber(match.ratings_count),

      isbn:
        cleanIsbn ||
        foundIsbn,

      openLibraryId:
        String(
          match.key || ""
        ).replace(
          "/works/",
          ""
        ),
    };

  } catch {
    return emptyMetadata(cleanIsbn);
  }
}


/*
 * Cacheamos la búsqueda.
 *
 * El mismo libro no vuelve a golpear
 * Open Library constantemente.
 */
const getCachedMetadata =
  unstable_cache(
    fetchMetadata,
    [
      "book-metadata",
      "ratings-v2",
    ],
    {
      revalidate:
        60 * 60 * 24 * 7,
    }
  );


export async function getBookMetadata({
  title,
  author,
  isbn,
}) {
  return getCachedMetadata(
    String(title || ""),
    String(author || ""),
    String(isbn || "")
  );
}