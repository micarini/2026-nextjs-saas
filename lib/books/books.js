import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";

import { getDb } from "@/lib/firebase/firestore";


const COLLECTION = "books";


/* =========================================================
   NORMALIZACIÓN GENERAL
========================================================= */

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`´]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function normalizeIsbn(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^0-9X]/g, "");
}


function normalizeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


/* =========================================================
   FECHAS
========================================================= */

function serializeDate(value) {
  if (!value) {
    return null;
  }


  // Firebase Timestamp
  if (
    typeof value?.toDate === "function"
  ) {
    const date = value.toDate();

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date.toISOString();
  }


  // Date normal
  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value.toISOString();
  }


  // Timestamp serializado
  if (
    typeof value === "object" &&
    typeof value.seconds === "number"
  ) {
    const date = new Date(
      value.seconds * 1000
    );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date.toISOString();
  }


  // String ISO
  const date = new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date.toISOString();
}


function getBookTimestamp(book) {
  const updated = new Date(
    book?.updatedAt || 0
  ).getTime();

  if (
    Number.isFinite(updated) &&
    updated > 0
  ) {
    return updated;
  }


  const created = new Date(
    book?.createdAt || 0
  ).getTime();

  return Number.isFinite(created)
    ? created
    : 0;
}


function getRawTimestamp(data) {
  const updated =
    data?.updatedAt?.toMillis?.();

  if (Number.isFinite(updated)) {
    return updated;
  }


  const created =
    data?.createdAt?.toMillis?.();

  if (Number.isFinite(created)) {
    return created;
  }


  const updatedDate = new Date(
    data?.updatedAt || 0
  ).getTime();

  if (
    Number.isFinite(updatedDate) &&
    updatedDate > 0
  ) {
    return updatedDate;
  }


  const createdDate = new Date(
    data?.createdAt || 0
  ).getTime();

  return Number.isFinite(createdDate)
    ? createdDate
    : 0;
}


/* =========================================================
   INFORMACIÓN DE EDICIÓN

   Queremos considerar:

   The Hobbit
   The Hobbit - Special Edition
   The Hobbit (Illustrated Edition)

   como la MISMA obra.
========================================================= */

function removeEditionInformation(value) {
  let text = String(value || "");


  /*
   * Información editorial entre ()
   */

  text = text.replace(
    /\([^)]*(?:special edition|anniversary edition|collector'?s? edition|illustrated edition|deluxe edition|international edition|revised edition|updated edition|movie tie[- ]?in|paperback|hardcover|ebook|kindle|mass market|book\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)|volume\s+\d+|vol\.?\s*\d+)[^)]*\)/gi,
    " "
  );


  /*
   * Información editorial entre []
   */

  text = text.replace(
    /\[[^\]]*(?:special edition|anniversary edition|collector'?s? edition|illustrated edition|deluxe edition|international edition|revised edition|updated edition|movie tie[- ]?in|paperback|hardcover|ebook|kindle|mass market|book\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)|volume\s+\d+|vol\.?\s*\d+)[^\]]*\]/gi,
    " "
  );


  /*
   * Special Edition
   * Illustrated Edition
   * Deluxe Edition
   */

  text = text.replace(
    /\b(?:special|anniversary|collector'?s?|illustrated|deluxe|international|revised|updated)\s+edition\b/gi,
    " "
  );


  /*
   * Movie Tie-In Edition
   */

  text = text.replace(
    /\bmovie\s+tie[- ]?in(?:\s+edition)?\b/gi,
    " "
  );


  /*
   * Paperback / Hardcover / Kindle Edition
   */

  text = text.replace(
    /\b(?:paperback|hardcover|ebook|kindle|mass market)(?:\s+edition)?\b/gi,
    " "
  );


  /*
   * Book 1
   * Book One
   * Volume 2
   */

  text = text.replace(
    /\b(?:book|volume|vol\.?)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi,
    " "
  );


  return text;
}


/* =========================================================
   PALABRAS QUE NO DEFINEN UN TÍTULO
========================================================= */

const TITLE_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "of",
  "in",
  "on",
  "for",
  "to",
  "with",

  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "de",
  "del",
  "y",
  "en",
  "con",
  "para",
]);


/* =========================================================
   NORMALIZAR TÍTULO
========================================================= */

function normalizeBookTitle(value) {
  return normalizeText(
    removeEditionInformation(value)
  );
}


function getTitleTokens(value) {
  const normalized =
    normalizeBookTitle(value);

  if (!normalized) {
    return [];
  }


  return normalized
    .split(" ")
    .filter(Boolean)
    .filter(
      (word) =>
        !TITLE_STOP_WORDS.has(word)
    );
}


/* =========================================================
   AUTOR
========================================================= */

function getAuthorTokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .filter(
      (word) =>
        word !== "by" &&
        word !== "author"
    );
}


function isSameAuthor(
  firstAuthor,
  secondAuthor
) {
  const first =
    getAuthorTokens(firstAuthor);

  const second =
    getAuthorTokens(secondAuthor);


  if (
    first.length === 0 &&
    second.length === 0
  ) {
    return true;
  }


  if (
    first.length === 0 ||
    second.length === 0
  ) {
    return false;
  }


  const firstSet =
    new Set(first);

  const secondSet =
    new Set(second);


  const intersection =
    [...firstSet].filter(
      (word) =>
        secondSet.has(word)
    ).length;


  /*
   * Taylor Jenkins Reid
   *
   * vs
   *
   * Reid Taylor Jenkins
   */

  if (
    intersection === firstSet.size &&
    intersection === secondSet.size
  ) {
    return true;
  }


  /*
   * Rick Riordan
   *
   * vs
   *
   * Rick Riordan Robert Venditti
   */

  const smaller =
    Math.min(
      firstSet.size,
      secondSet.size
    );


  return (
    smaller >= 2 &&
    intersection / smaller >= 1
  );
}


/* =========================================================
   SIMILITUD ENTRE TÍTULOS
========================================================= */

function getTitleSimilarity(
  firstTitle,
  secondTitle
) {
  const firstNormalized =
    normalizeBookTitle(firstTitle);

  const secondNormalized =
    normalizeBookTitle(secondTitle);


  if (
    !firstNormalized ||
    !secondNormalized
  ) {
    return 0;
  }


  /*
   * Daisy Jones & The Six
   *
   * Daisy Jones and the Six
   */

  if (
    firstNormalized ===
    secondNormalized
  ) {
    return 1;
  }


  const firstTokens =
    getTitleTokens(firstTitle);

  const secondTokens =
    getTitleTokens(secondTitle);


  if (
    !firstTokens.length ||
    !secondTokens.length
  ) {
    return 0;
  }


  const firstSet =
    new Set(firstTokens);

  const secondSet =
    new Set(secondTokens);


  const intersection =
    [...firstSet].filter(
      (token) =>
        secondSet.has(token)
    ).length;


  const union =
    new Set([
      ...firstSet,
      ...secondSet,
    ]).size;


  const smaller =
    Math.min(
      firstSet.size,
      secondSet.size
    );


  const jaccard =
    union
      ? intersection / union
      : 0;


  const containment =
    smaller
      ? intersection / smaller
      : 0;


  /*
   * Ejemplo:
   *
   * The Lightning Thief
   *
   * Percy Jackson and the Olympians:
   * The Lightning Thief
   */

  if (
    smaller >= 2 &&
    containment === 1
  ) {
    return 0.95;
  }


  return Math.max(
    jaccard,
    containment * 0.9
  );
}


/* =========================================================
   IDENTIDAD DE UNA OBRA

   IMPORTANTE:

   ISBN identifica una EDICIÓN.

   Nosotros queremos identificar la OBRA.
========================================================= */

export function getBookIdentity(
  book = {}
) {
  const titleTokens =
    getTitleTokens(
      book.title
    );


  const authorTokens =
    getAuthorTokens(
      book.author ||
      book.authors?.[0]
    );


  if (titleTokens.length) {
    const titleKey =
      [
        ...new Set(
          titleTokens
        ),
      ]
        .sort()
        .join("-");


    const authorKey =
      [
        ...new Set(
          authorTokens
        ),
      ]
        .sort()
        .join("-");


    return `work:${titleKey}:${authorKey}`;
  }


  /*
   * Si no hay título usamos ISBN.
   */

  const isbn =
    normalizeIsbn(
      book.isbn
    );


  if (isbn) {
    return `isbn:${isbn}`;
  }


  return "";
}


/* =========================================================
   COMPARAR LIBROS
========================================================= */

export function isSameBook(
  first,
  second
) {
  if (!first || !second) {
    return false;
  }


  /*
   * Nunca fusionamos libros
   * pertenecientes a usuarios diferentes.
   */

  if (
    first.userId &&
    second.userId &&
    first.userId !== second.userId
  ) {
    return false;
  }


  /*
   * ISBN igual:
   * seguro que es el mismo.
   */

  const firstIsbn =
    normalizeIsbn(first.isbn);

  const secondIsbn =
    normalizeIsbn(second.isbn);


  if (
    firstIsbn &&
    secondIsbn &&
    firstIsbn === secondIsbn
  ) {
    return true;
  }


  /*
   * ISBN distinto NO significa necesariamente
   * obra distinta.

   * Paperback y Hardcover pueden tener
   * ISBN diferentes.
   */


  const titleSimilarity =
    getTitleSimilarity(
      first.title,
      second.title
    );


  const firstAuthor =
    first.author ||
    first.authors?.[0] ||
    "";

  const secondAuthor =
    second.author ||
    second.authors?.[0] ||
    "";


  const sameAuthor =
    isSameAuthor(
      firstAuthor,
      secondAuthor
    );


  /*
   * Mismo autor + título muy parecido.
   */

  if (
    sameAuthor &&
    titleSimilarity >= 0.82
  ) {
    return true;
  }


  /*
   * Si falta autor en una fuente pero el título
   * normalizado es idéntico, también puede ser
   * el mismo libro.
   */

  if (
    (!firstAuthor || !secondAuthor) &&
    titleSimilarity === 1
  ) {
    return true;
  }


  /*
   * Misma portada + título parecido.
   */

  if (
    first.coverUrl &&
    second.coverUrl &&
    first.coverUrl ===
      second.coverUrl &&
    titleSimilarity >= 0.65
  ) {
    return true;
  }


  return false;
}


/* =========================================================
   STATUS
========================================================= */

function getStatusPriority(status) {
  const value =
    String(status || "")
      .trim()
      .toLowerCase();


  const priorities = {
    read: 4,
    finished: 4,
    completed: 4,

    reading: 3,
    currently_reading: 3,
    "currently-reading": 3,

    to_read: 2,
    want_to_read: 2,
    "want-to-read": 2,

    paused: 1,
  };


  return priorities[value] || 0;
}


/* =========================================================
   FUSIONAR DOS VERSIONES DEL MISMO LIBRO
========================================================= */

function mergeDuplicateBooks(
  first,
  second
) {
  const firstPriority =
    getStatusPriority(
      first.status
    );

  const secondPriority =
    getStatusPriority(
      second.status
    );


  const firstTime =
    getBookTimestamp(first);

  const secondTime =
    getBookTimestamp(second);


  /*
   * Elegimos el documento principal.

   * Primero preferimos el estado más avanzado:
   * read > reading > to_read

   * Si están iguales, usamos el más reciente.
   */

  let primary;
  let secondary;


  if (
    firstPriority >
    secondPriority
  ) {
    primary = first;
    secondary = second;
  } else if (
    secondPriority >
    firstPriority
  ) {
    primary = second;
    secondary = first;
  } else if (
    secondTime >=
    firstTime
  ) {
    primary = second;
    secondary = first;
  } else {
    primary = first;
    secondary = second;
  }


  const finalStatus =
    getStatusPriority(
      primary.status
    ) >=
    getStatusPriority(
      secondary.status
    )
      ? primary.status
      : secondary.status;


  const finished =
    [
      "read",
      "finished",
      "completed",
    ].includes(
      String(
        finalStatus || ""
      ).toLowerCase()
    );


  return {
    ...secondary,
    ...primary,


    /*
     * Esta ID corresponde a un documento
     * real de Firestore.
     */

    id:
      primary.id,


    userId:
      primary.userId ||
      secondary.userId,


    title:
      primary.title ||
      secondary.title,


    author:
      primary.author ||
      secondary.author,


    description:
      primary.description ||
      secondary.description,


    genre:
      primary.genre ||
      secondary.genre ||
      "fantasy",


    genres:
      primary.genres?.length
        ? primary.genres
        : secondary.genres || [],


    status:
      finalStatus ||
      "to_read",


    rating:
      primary.rating ??
      secondary.rating ??
      null,


    averageRating:
      primary.averageRating ??
      secondary.averageRating ??
      null,


    ratingsCount:
      Math.max(
        Number(
          primary.ratingsCount
        ) || 0,

        Number(
          secondary.ratingsCount
        ) || 0
      ) || null,


    coverUrl:
      primary.coverUrl ||
      secondary.coverUrl ||
      "",


    isbn:
      primary.isbn ||
      secondary.isbn ||
      "",


    totalPages:
      Math.max(
        Number(
          primary.totalPages
        ) || 0,

        Number(
          secondary.totalPages
        ) || 0
      ) || null,


    /*
     * Conservamos el progreso más alto.
     */

    currentPage:
      Math.max(
        Number(
          primary.currentPage
        ) || 0,

        Number(
          secondary.currentPage
        ) || 0
      ),


    startDate:
      primary.startDate ||
      secondary.startDate ||
      null,


    finishDate:
      finished
        ? (
            primary.finishDate ||
            secondary.finishDate ||
            null
          )
        : null,


    targetDate:
      primary.targetDate ||
      secondary.targetDate ||
      null,


    published:
      Boolean(
        primary.published ||
        secondary.published
      ),


    spotifyUrl:
      primary.spotifyUrl ||
      secondary.spotifyUrl ||
      "",


    googleBooksId:
      primary.googleBooksId ||
      secondary.googleBooksId ||
      "",


    openLibraryId:
      primary.openLibraryId ||
      secondary.openLibraryId ||
      "",


    createdAt:
      secondary.createdAt ||
      primary.createdAt ||
      null,


    updatedAt:
      primary.updatedAt ||
      secondary.updatedAt ||
      null,


    bookKey:
      getBookIdentity(
        primary
      ),


    duplicateIds: [
      ...new Set(
        [
          ...(first.duplicateIds || []),
          ...(second.duplicateIds || []),

          first.id,
          second.id,
        ].filter(Boolean)
      ),
    ],
  };
}


/* =========================================================
   DEDUPLICAR ARRAY DE LIBROS
========================================================= */

export function dedupeBooks(
  books = []
) {
  const uniqueBooks = [];


  for (const book of books) {
    const existingIndex =
      uniqueBooks.findIndex(
        (existingBook) =>
          isSameBook(
            existingBook,
            book
          )
      );


    if (
      existingIndex === -1
    ) {
      uniqueBooks.push({
        ...book,

        bookKey:
          book.bookKey ||
          getBookIdentity(book),
      });

      continue;
    }


    uniqueBooks[
      existingIndex
    ] =
      mergeDuplicateBooks(
        uniqueBooks[
          existingIndex
        ],
        book
      );
  }


  return uniqueBooks;
}


/* =========================================================
   SERIALIZAR FIRESTORE
========================================================= */

function serializeBook(doc) {
  const data =
    doc.data();


  const book = {
    id:
      doc.id,


    userId:
      data.userId,


    title:
      data.title ||
      "",


    author:
      data.author ||
      "",


    authors:
      Array.isArray(
        data.authors
      )
        ? data.authors
        : [],


    description:
      data.description ||
      "",


    genre:
      data.genre ||
      "fantasy",


    genres:
      Array.isArray(
        data.genres
      )
        ? data.genres
        : [],


    status:
      data.status ||
      "to_read",


    rating:
      normalizeNumber(
        data.rating
      ),


    averageRating:
      normalizeNumber(
        data.averageRating
      ),


    ratingsCount:
      normalizeNumber(
        data.ratingsCount
      ),


    coverUrl:
      data.coverUrl ||
      "",


    isbn:
      data.isbn ||
      "",


    totalPages:
      normalizeNumber(
        data.totalPages
      ),


    currentPage:
      normalizeNumber(
        data.currentPage
      ),


    startDate:
      serializeDate(
        data.startDate
      ),


    finishDate:
      serializeDate(
        data.finishDate
      ),


    targetDate:
      serializeDate(
        data.targetDate
      ),


    published:
      Boolean(
        data.published
      ),


    spotifyUrl:
      data.spotifyUrl ||
      "",


    googleBooksId:
      data.googleBooksId ||
      data.googleBookId ||
      data.volumeId ||
      "",


    openLibraryId:
      data.openLibraryId ||
      data.openLibraryKey ||
      "",


    bookKey:
      data.bookKey ||
      "",


    createdAt:
      serializeDate(
        data.createdAt
      ),


    updatedAt:
      serializeDate(
        data.updatedAt
      ),
  };


  if (!book.bookKey) {
    book.bookKey =
      getBookIdentity(book);
  }


  return book;
}


/* =========================================================
   ORDEN
========================================================= */

function byNewest(a, b) {
  return (
    getBookTimestamp(b) -
    getBookTimestamp(a)
  );
}


/* =========================================================
   LISTAR LIBROS DEL USUARIO
========================================================= */

export async function listUserBooks(
  userId
) {
  const snapshot =
    await getDb()
      .collection(
        COLLECTION
      )
      .where(
        "userId",
        "==",
        userId
      )
      .get();


  const books =
    snapshot.docs.map(
      serializeBook
    );


  /*
   * MUY IMPORTANTE:
   *
   * Los duplicados antiguos también
   * desaparecen de la interfaz.
   */

  return dedupeBooks(
    books
  ).sort(
    byNewest
  );
}


/* =========================================================
   LIBROS PUBLICADOS
========================================================= */

export async function listPublishedBooks() {
  const snapshot =
    await getDb()
      .collection(
        COLLECTION
      )
      .where(
        "published",
        "==",
        true
      )
      .get();


  const books =
    snapshot.docs.map(
      serializeBook
    );


  return dedupeBooks(
    books
  ).sort(
    byNewest
  );
}


export async function listPublishedBooksByUser(
  userId
) {
  const snapshot =
    await getDb()
      .collection(
        COLLECTION
      )
      .where(
        "userId",
        "==",
        userId
      )
      .where(
        "published",
        "==",
        true
      )
      .get();


  return dedupeBooks(
    snapshot.docs.map(
      serializeBook
    )
  ).sort(
    byNewest
  );
}


/* =========================================================
   OBTENER UN LIBRO
========================================================= */

export async function getUserBook(
  userId,
  bookId
) {
  const doc =
    await getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId)
      .get();


  if (!doc.exists) {
    return null;
  }


  const book =
    serializeBook(doc);


  return (
    book.userId === userId
      ? book
      : null
  );
}


export async function getPublishedBook(
  bookId
) {
  const doc =
    await getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId)
      .get();


  if (!doc.exists) {
    return null;
  }


  const book =
    serializeBook(doc);


  return book.published
    ? book
    : null;
}


/* =========================================================
   BUSCAR COPIAS EXISTENTES DE LA MISMA OBRA
========================================================= */

async function findExistingUserBookDocs(
  userId,
  data
) {
  const snapshot =
    await getDb()
      .collection(
        COLLECTION
      )
      .where(
        "userId",
        "==",
        userId
      )
      .get();


  const target = {
    ...data,
    userId,
  };


  const matches =
    snapshot.docs.filter(
      (doc) =>
        isSameBook(
          target,
          {
            id:
              doc.id,

            ...doc.data(),
          }
        )
    );


  matches.sort(
    (first, second) =>
      getRawTimestamp(
        second.data()
      ) -
      getRawTimestamp(
        first.data()
      )
  );


  return matches;
}


/* =========================================================
   ID ESTABLE
========================================================= */

export function createStableDocumentId(
  userId,
  bookKey
) {
  return createHash(
    "sha256"
  )
    .update(
      `${userId}:${bookKey}`
    )
    .digest("hex");
}


/* =========================================================
   CREAR LIBRO

   Antes:
   .add()

   Eso generaba una ID nueva SIEMPRE.

   Ahora:
   1. buscamos la misma obra
   2. si existe, reutilizamos ese registro
   3. si no existe, usamos ID estable
========================================================= */

export async function createUserBook(
  userId,
  data
) {
  const title =
    String(
      data?.title || ""
    ).trim();


  if (!title) {
    throw new Error(
      "Book title is required."
    );
  }


  const db =
    getDb();


  const now =
    FieldValue.serverTimestamp();


  const incomingBook = {
    ...data,

    title,

    userId,
  };


  const bookKey =
    getBookIdentity(
      incomingBook
    );


  /*
   * Buscar versiones/ediciones
   * que ya estén guardadas.
   */

  const existingDocs =
    await findExistingUserBookDocs(
      userId,
      incomingBook
    );


  if (existingDocs.length) {
    /*
     * Dedupe también decide cuál es
     * el registro principal.
     */

    const serialized =
      existingDocs.map(
        serializeBook
      );


    const merged =
      dedupeBooks(
        serialized
      )[0];


    const existingDoc =
      existingDocs.find(
        (doc) =>
          doc.id === merged.id
      ) || existingDocs[0];


    const existing =
      existingDoc.data();


    /*
     * NO sobrescribimos progreso personal.
     *
     * Solamente actualizamos metadata
     * del catálogo.
     */

    const updates = {
      bookKey:
        getBookIdentity({
          ...existing,
          ...incomingBook,
        }),

      title:
        title ||
        existing.title ||
        "",

      author:
        data.author ||
        existing.author ||
        "",

      description:
        data.description ||
        existing.description ||
        "",

      genre:
        data.genre ||
        existing.genre ||
        "fantasy",

      coverUrl:
        data.coverUrl ||
        existing.coverUrl ||
        "",

      isbn:
        data.isbn ||
        existing.isbn ||
        "",

      totalPages:
        normalizeNumber(
          data.totalPages
        ) ??
        normalizeNumber(
          existing.totalPages
        ),

      averageRating:
        normalizeNumber(
          data.averageRating
        ) ??
        normalizeNumber(
          existing.averageRating
        ),

      ratingsCount:
        normalizeNumber(
          data.ratingsCount
        ) ??
        normalizeNumber(
          existing.ratingsCount
        ),

      updatedAt:
        now,
    };


    if (
      Array.isArray(
        data.genres
      ) &&
      data.genres.length
    ) {
      updates.genres =
        data.genres;
    }


    if (
      Array.isArray(
        data.authors
      ) &&
      data.authors.length
    ) {
      updates.authors =
        data.authors;
    }


    if (
      data.googleBooksId ||
      data.googleBookId ||
      data.volumeId
    ) {
      updates.googleBooksId =
        data.googleBooksId ||
        data.googleBookId ||
        data.volumeId;
    }


    if (
      data.openLibraryId ||
      data.openLibraryKey
    ) {
      updates.openLibraryId =
        data.openLibraryId ||
        data.openLibraryKey;
    }


    await existingDoc.ref.set(
      updates,
      {
        merge: true,
      }
    );


    /*
     * Devolvemos la ID existente.
     */

    return existingDoc.id;
  }


  /*
   * Libro completamente nuevo.
   */

  const stableId =
    createStableDocumentId(
      userId,
      bookKey
    );


  const docRef =
    db
      .collection(
        COLLECTION
      )
      .doc(stableId);


  const payload = {
    userId,

    bookKey,

    title,


    author:
      data.author ||
      "",


    authors:
      Array.isArray(
        data.authors
      )
        ? data.authors
        : [],


    description:
      data.description ||
      "",


    genre:
      data.genre ||
      "fantasy",


    genres:
      Array.isArray(
        data.genres
      )
        ? data.genres
        : [],


    status:
      data.status ||
      "to_read",


    rating:
      normalizeNumber(
        data.rating
      ),


    averageRating:
      normalizeNumber(
        data.averageRating
      ),


    ratingsCount:
      normalizeNumber(
        data.ratingsCount
      ),


    coverUrl:
      data.coverUrl ||
      "",


    isbn:
      data.isbn ||
      "",


    totalPages:
      normalizeNumber(
        data.totalPages
      ),


    currentPage:
      normalizeNumber(
        data.currentPage
      ) ?? 0,


    startDate:
      data.startDate ??
      null,


    finishDate:
      data.finishDate ??
      null,


    targetDate:
      data.targetDate ??
      null,


    published:
      Boolean(
        data.published
      ),


    spotifyUrl:
      data.spotifyUrl ||
      "",


    googleBooksId:
      data.googleBooksId ||
      data.googleBookId ||
      data.volumeId ||
      "",


    openLibraryId:
      data.openLibraryId ||
      data.openLibraryKey ||
      "",


    createdAt:
      now,


    updatedAt:
      now,
  };


  /*
   * Usamos una transacción para evitar que
   * dos clicks simultáneos creen dos libros.
   */

  await db.runTransaction(
    async (transaction) => {
      const existing =
        await transaction.get(
          docRef
        );


      if (existing.exists) {
        return;
      }


      transaction.set(
        docRef,
        payload
      );
    }
  );


  return stableId;
}


/* =========================================================
   ACTUALIZAR LIBRO COMPLETO
========================================================= */

export async function updateUserBook(
  userId,
  bookId,
  data
) {
  const docRef =
    getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  const previous =
    doc.data();


  const mergedIdentity = {
    ...previous,
    ...data,
  };


  const updates = {
    bookKey:
      getBookIdentity(
        mergedIdentity
      ),

    updatedAt:
      FieldValue.serverTimestamp(),
  };


  /*
   * TEXTOS
   */

  const textFields = [
    "title",
    "author",
    "description",
    "genre",
    "status",
    "coverUrl",
    "isbn",
    "spotifyUrl",
    "googleBooksId",
    "openLibraryId",
  ];


  for (
    const field
    of textFields
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        data,
        field
      ) &&
      data[field] !== undefined
    ) {
      updates[field] =
        data[field];
    }
  }


  /*
   * ARRAYS
   */

  if (
    Array.isArray(
      data.authors
    )
  ) {
    updates.authors =
      data.authors;
  }


  if (
    Array.isArray(
      data.genres
    )
  ) {
    updates.genres =
      data.genres;
  }


  /*
   * NÚMEROS
   */

  const numberFields = [
    "rating",
    "averageRating",
    "ratingsCount",
    "totalPages",
    "currentPage",
  ];


  for (
    const field
    of numberFields
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        data,
        field
      ) &&
      data[field] !== undefined
    ) {
      updates[field] =
        normalizeNumber(
          data[field]
        );
    }
  }


  /*
   * FECHAS
   */

  const dateFields = [
    "startDate",
    "finishDate",
    "targetDate",
  ];


  for (
    const field
    of dateFields
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        data,
        field
      ) &&
      data[field] !== undefined
    ) {
      updates[field] =
        data[field];
    }
  }


  /*
   * PUBLICADO
   */

  if (
    Object.prototype.hasOwnProperty.call(
      data,
      "published"
    )
  ) {
    updates.published =
      Boolean(
        data.published
      );
  }


  await docRef.update(
    updates
  );
}


/* =========================================================
   STATUS
========================================================= */

export async function updateUserBookStatus(
  userId,
  bookId,
  status
) {
  const docRef =
    getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  await docRef.update({
    status,

    updatedAt:
      FieldValue.serverTimestamp(),
  });
}


/* =========================================================
   RATING
========================================================= */

export async function updateUserBookRating(
  userId,
  bookId,
  rating
) {
  const docRef =
    getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  await docRef.update({
    rating:
      normalizeNumber(
        rating
      ),

    updatedAt:
      FieldValue.serverTimestamp(),
  });
}


/* =========================================================
   FECHAS
========================================================= */

export async function updateUserBookDates(
  userId,
  bookId,
  {
    startDate,
    finishDate,
    targetDate,
  }
) {
  const docRef =
    getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  await docRef.update({
    startDate,

    finishDate,

    targetDate,

    updatedAt:
      FieldValue.serverTimestamp(),
  });
}


/* =========================================================
   SPOTIFY
========================================================= */

export async function updateUserBookSpotifyUrl(
  userId,
  bookId,
  spotifyUrl
) {
  const docRef =
    getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  await docRef.update({
    spotifyUrl,

    updatedAt:
      FieldValue.serverTimestamp(),
  });
}


/* =========================================================
   PROGRESO
========================================================= */

export async function updateUserBookProgress(
  userId,
  bookId,
  currentPage
) {
  const docRef =
    getDb()
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  const page =
    normalizeNumber(
      currentPage
    );


  await docRef.update({
    currentPage:
      page ?? 0,

    updatedAt:
      FieldValue.serverTimestamp(),
  });
}


/* =========================================================
   BORRAR NOTAS DE UN DOCUMENTO
========================================================= */

async function deleteBookDocumentWithNotes(
  docRef
) {
  const notesSnapshot =
    await docRef
      .collection(
        "notes"
      )
      .get();


  /*
   * Firestore limita batches a 500 operaciones.
   * Para una cantidad normal de notas esto
   * alcanza perfectamente.
   */

  if (
    notesSnapshot.docs.length
  ) {
    const batch =
      getDb().batch();


    notesSnapshot.docs.forEach(
      (noteDoc) => {
        batch.delete(
          noteDoc.ref
        );
      }
    );


    await batch.commit();
  }


  await docRef.delete();
}


/* =========================================================
   ELIMINAR LIBRO

   Como ahora dos ediciones representan una sola obra,
   al borrar el libro eliminamos también duplicados
   antiguos de esa misma obra.
========================================================= */

export async function deleteUserBook(
  userId,
  bookId
) {
  const db =
    getDb();


  const docRef =
    db
      .collection(
        COLLECTION
      )
      .doc(bookId);


  const doc =
    await docRef.get();


  if (
    !doc.exists ||
    doc.data().userId !==
      userId
  ) {
    throw new Error(
      "Book not found."
    );
  }


  const bookToDelete = {
    id:
      doc.id,

    ...doc.data(),
  };


  /*
   * Buscar todas las ediciones/copies
   * antiguas de la misma obra.
   */

  const snapshot =
    await db
      .collection(
        COLLECTION
      )
      .where(
        "userId",
        "==",
        userId
      )
      .get();


  const matchingDocs =
    snapshot.docs.filter(
      (candidate) =>
        isSameBook(
          bookToDelete,
          {
            id:
              candidate.id,

            ...candidate.data(),
          }
        )
    );


  /*
   * Si por algún motivo no encontramos
   * coincidencias, eliminamos al menos
   * el documento original.
   */

  if (!matchingDocs.length) {
    await deleteBookDocumentWithNotes(
      docRef
    );

    return;
  }


  for (
    const matchingDoc
    of matchingDocs
  ) {
    await deleteBookDocumentWithNotes(
      matchingDoc.ref
    );
  }
}