"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";

import {
  createUserBook,
  deleteUserBook,
  updateUserBook,
  updateUserBookStatus,
  updateUserBookRating,
  updateUserBookProgress,
  updateUserBookDates,
} from "@/lib/books/books";

import {
  addBookNote,
  deleteBookNote,
} from "@/lib/books/notes";

import {
  GENRES,
} from "@/lib/books/genres";

import {
  STATUSES,
} from "@/lib/books/statuses";


/* =========================================================
   PARSERS
========================================================= */

function parseOptionalInt(value) {
  const trimmed =
    String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed =
    Number.parseInt(
      trimmed,
      10
    );

  return Number.isNaN(parsed)
    ? null
    : parsed;
}


function parseOptionalFloat(value) {
  const trimmed =
    String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed =
    Number.parseFloat(
      trimmed
    );

  return Number.isNaN(parsed)
    ? null
    : parsed;
}


function parseDateInput(value) {
  const trimmed =
    String(value || "").trim();

  return trimmed
    ? new Date(trimmed)
    : null;
}


/* =========================================================
   BOOK FORM
========================================================= */

function parseBookForm(formData) {
  const title =
    String(
      formData.get("title") ||
      ""
    ).trim();


  const author =
    String(
      formData.get("author") ||
      ""
    ).trim();


  let genre =
    String(
      formData.get("genre") ||
      ""
    );


  const status =
    String(
      formData.get("status") ||
      "to_read"
    );


  const ratingRaw =
    String(
      formData.get("rating") ||
      ""
    ).trim();


  const published =
    formData.get(
      "published"
    ) === "on";


  if (!title) {
    throw new Error(
      "Title is required."
    );
  }


  if (!author) {
    throw new Error(
      "Author is required."
    );
  }


  /*
   * Si la API trae un género
   * que nuestra app no reconoce,
   * usamos uno válido.
   */

  if (
    !GENRES.some(
      (entry) =>
        entry.value === genre
    )
  ) {
    genre =
      GENRES[0]?.value ||
      "fantasy";
  }


  if (
    !STATUSES.some(
      (entry) =>
        entry.value === status
    )
  ) {
    throw new Error(
      "Choose a valid status."
    );
  }


  return {
    title,

    author,

    description:
      String(
        formData.get(
          "description"
        ) || ""
      ).trim(),

    genre,

    status,

    averageRating:
      parseOptionalFloat(
        formData.get(
          "averageRating"
        )
      ),

    ratingsCount:
      parseOptionalInt(
        formData.get(
          "ratingsCount"
        )
      ),

    rating:
      ratingRaw
        ? Number(
            ratingRaw
          )
        : null,

    coverUrl:
      String(
        formData.get(
          "coverUrl"
        ) || ""
      ).trim(),

    isbn:
      String(
        formData.get(
          "isbn"
        ) || ""
      ).trim(),

    totalPages:
      parseOptionalInt(
        formData.get(
          "totalPages"
        )
      ),

    currentPage:
      parseOptionalInt(
        formData.get(
          "currentPage"
        )
      ),

    startDate:
      parseDateInput(
        formData.get(
          "startDate"
        )
      ),

    finishDate:
      parseDateInput(
        formData.get(
          "finishDate"
        )
      ),

    targetDate:
      parseDateInput(
        formData.get(
          "targetDate"
        )
      ),

    published,
  };
}


/* =========================================================
   CREATE
========================================================= */

export async function createBook(
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  const bookId =
    await createUserBook(
      user.uid,
      parseBookForm(
        formData
      )
    );


  revalidatePath("/");

  revalidatePath(
    "/dashboard"
  );


  redirect(
    `/dashboard/books/${bookId}`
  );
}


/* =========================================================
   UPDATE
========================================================= */

export async function updateBook(
  bookId,
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  await updateUserBook(
    user.uid,
    bookId,
    parseBookForm(
      formData
    )
  );


  revalidatePath("/");

  revalidatePath(
    `/books/${bookId}`
  );

  revalidatePath(
    "/dashboard"
  );


  redirect(
    "/dashboard"
  );
}


/* =========================================================
   CHANGE STATUS
   - DETALLE DEL LIBRO
========================================================= */

export async function changeBookStatus(
  bookId,
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  const status =
    String(
      formData.get(
        "status"
      ) || ""
    );


  if (
    !STATUSES.some(
      (entry) =>
        entry.value === status
    )
  ) {
    throw new Error(
      "Choose a valid status."
    );
  }


  await updateUserBookStatus(
    user.uid,
    bookId,
    status
  );


  revalidatePath("/");

  revalidatePath(
    "/dashboard"
  );

  revalidatePath(
    "/dashboard/library"
  );

  revalidatePath(
    `/dashboard/books/${bookId}`
  );
}


/* =========================================================
   HELPERS PARA DISCOVERY
========================================================= */

function normalizeGenreCandidate(
  value
) {
  return String(
    value || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}


function resolveDiscoveryGenre(
  book,
  categorySlug
) {
  /*
   * Probamos toda la información
   * disponible.
   */

  const candidates = [
    book?.genre,

    categorySlug,

    ...(
      Array.isArray(
        book?.categories
      )
        ? book.categories
        : []
    ),

    ...(
      Array.isArray(
        book?.genres
      )
        ? book.genres
        : []
    ),
  ].filter(Boolean);


  for (
    const candidate
    of candidates
  ) {
    const normalized =
      normalizeGenreCandidate(
        candidate
      );


    const match =
      GENRES.find(
        (genre) => {

          const value =
            normalizeGenreCandidate(
              genre.value
            );


          const label =
            normalizeGenreCandidate(
              genre.label
            );


          return (
            value === normalized ||
            label === normalized
          );
        }
      );


    if (match) {
      return match.value;
    }
  }


  /*
   * Segundo intento:
   *
   * young-adult
   * young adult
   * Young Adult Fiction
   */

  const category =
    normalizeGenreCandidate(
      categorySlug
    );


  if (category) {
    const match =
      GENRES.find(
        (genre) => {

          const value =
            normalizeGenreCandidate(
              genre.value
            );


          const label =
            normalizeGenreCandidate(
              genre.label
            );


          return (
            value.includes(
              category
            ) ||
            label.includes(
              category
            ) ||
            category.includes(
              value
            ) ||
            category.includes(
              label
            )
          );
        }
      );


    if (match) {
      return match.value;
    }
  }


  /*
   * Fallback seguro.
   */

  return (
    GENRES[0]?.value ||
    "fantasy"
  );
}


/* =========================================================
   DISCOVERY STATUS
   NUEVA ACCIÓN

   Esta es la que va a usar:
   CategoryBookList.js

   NO REDIRECT
   NO ADD BOOK PAGE
   NO SEARCH
========================================================= */

export async function setDiscoveryBookStatus({
  book,
  status,
  categorySlug,
  existingBookId,
}) {
  const user =
    await getCurrentUser();


  if (!user) {
    throw new Error(
      "You must be signed in."
    );
  }


  /*
   * Usamos exactamente los mismos
   * statuses del detalle del libro.
   */

  if (
    !STATUSES.some(
      (entry) =>
        entry.value === status
    )
  ) {
    throw new Error(
      "Choose a valid status."
    );
  }


  const title =
    String(
      book?.title || ""
    ).trim();


  if (!title) {
    throw new Error(
      "Book title is required."
    );
  }


  const author =
    String(
      book?.author ||
      book?.authors?.[0] ||
      "Unknown author"
    ).trim();


  let bookId =
    existingBookId ||
    null;


  /* =====================================================
     LIBRO NUEVO
  ===================================================== */

  if (!bookId) {
    bookId =
      await createUserBook(
        user.uid,
        {
          /*
           * Información principal
           */

          title,

          author,

          authors:
            Array.isArray(
              book?.authors
            )
              ? book.authors
              : author
                ? [author]
                : [],


          description:
            String(
              book?.description ||
              ""
            ),


          /*
           * Genre compatible
           * con nuestra app.
           */

          genre:
            resolveDiscoveryGenre(
              book,
              categorySlug
            ),


          genres:
            Array.isArray(
              book?.genres
            )
              ? book.genres
              : Array.isArray(
                    book?.categories
                  )
                ? book.categories
                : [],


          /*
           * ESTADO ELEGIDO DIRECTAMENTE
           */

          status,


          /*
           * Rating personal todavía
           * no existe.
           */

          rating:
            null,


          /*
           * Rating público.
           */

          averageRating:
            Number(
              book?.averageRating ??
              book?.rating
            ) || null,


          ratingsCount:
            Number(
              book?.ratingsCount
            ) || null,


          /*
           * Cover
           */

          coverUrl:
            String(
              book?.coverUrl ||
              ""
            ),


          /*
           * ISBN
           */

          isbn:
            String(
              book?.isbn ||
              ""
            ),


          /*
           * Pages
           */

          totalPages:
            Number(
              book?.totalPages ??
              book?.pageCount
            ) || null,


          currentPage:
            0,


          /*
           * Las fechas continúan manejándose
           * como en el detalle.
           *
           * No inventamos fechas sólo porque
           * el status cambió.
           */

          startDate:
            null,

          finishDate:
            null,

          targetDate:
            null,


          published:
            false,


          spotifyUrl:
            "",


          /*
           * IDs externos.
           *
           * Ayudan a detectar duplicados.
           */

          googleBooksId:
            String(
              book?.googleBooksId ||
              book?.googleBookId ||
              book?.volumeId ||
              book?.id ||
              ""
            ),


          openLibraryId:
            String(
              book?.openLibraryId ||
              book?.openLibraryKey ||
              ""
            ),
        }
      );
  }


  /* =====================================================
     ACTUALIZAR STATUS

     Si createUserBook encontró que ya existía
     otra edición del mismo libro, devuelve
     la ID existente.

     Por eso podemos actualizarlo acá.
  ===================================================== */

  await updateUserBookStatus(
    user.uid,
    bookId,
    status
  );


  /* =====================================================
     REFRESH
  ===================================================== */

  revalidatePath(
    "/dashboard"
  );


  revalidatePath(
    "/dashboard/library"
  );


  revalidatePath(
    "/dashboard/stats"
  );


  if (categorySlug) {
    revalidatePath(
      `/dashboard/categories/${categorySlug}`
    );
  }


  /*
   * Importante:
   *
   * NO REDIRECT.
   *
   * CategoryBookList recibe esta respuesta
   * y continúa en la misma pantalla.
   */

  return {
    ok: true,

    bookId,

    status,
  };
}


/* =========================================================
   RATING
========================================================= */

export async function changeBookRating(
  bookId,
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  const rating =
    parseOptionalInt(
      formData.get(
        "rating"
      )
    );


  await updateUserBookRating(
    user.uid,
    bookId,
    rating
  );


  revalidatePath(
    `/dashboard/books/${bookId}`
  );
}


/* =========================================================
   PROGRESS
========================================================= */

export async function changeBookProgress(
  bookId,
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  const currentPage =
    parseOptionalInt(
      formData.get(
        "currentPage"
      )
    );


  await updateUserBookProgress(
    user.uid,
    bookId,
    currentPage
  );


  revalidatePath(
    `/dashboard/books/${bookId}`
  );
}


/* =========================================================
   DATES
========================================================= */

export async function changeBookDates(
  bookId,
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  await updateUserBookDates(
    user.uid,
    bookId,
    {
      startDate:
        parseDateInput(
          formData.get(
            "startDate"
          )
        ),

      finishDate:
        parseDateInput(
          formData.get(
            "finishDate"
          )
        ),

      targetDate:
        parseDateInput(
          formData.get(
            "targetDate"
          )
        ),
    }
  );


  revalidatePath(
    `/dashboard/books/${bookId}`
  );
}


/* =========================================================
   DELETE BOOK
========================================================= */

export async function deleteBook(
  bookId
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  await deleteUserBook(
    user.uid,
    bookId
  );


  revalidatePath("/");

  revalidatePath(
    `/books/${bookId}`
  );

  revalidatePath(
    "/dashboard"
  );

  revalidatePath(
    "/dashboard/library"
  );


  redirect(
    "/dashboard"
  );
}


/* =========================================================
   NOTES
========================================================= */

export async function addNote(
  bookId,
  formData
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  const text =
    String(
      formData.get(
        "text"
      ) || ""
    ).trim();


  if (!text) {
    throw new Error(
      "Note text is required."
    );
  }


  await addBookNote(
    user.uid,
    bookId,
    {
      text,

      page:
        parseOptionalInt(
          formData.get(
            "page"
          )
        ),
    }
  );


  revalidatePath(
    "/dashboard/books/[id]",
    "page"
  );
}


export async function deleteNote(
  bookId,
  noteId
) {
  const user =
    await getCurrentUser();


  if (!user) {
    redirect("/");
  }


  await deleteBookNote(
    user.uid,
    bookId,
    noteId
  );


  revalidatePath(
    "/dashboard/books/[id]",
    "page"
  );
}