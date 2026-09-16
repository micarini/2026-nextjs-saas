import {
  getBooksBySubject,
} from "@/lib/discovery/subjects";


/* =========================================================
   CATEGORÍAS
========================================================= */

const CATEGORY_CONFIG = {
  fantasy: {
    slug: "fantasy",
    label: "Fantasy",
    subject: "fantasy",
  },

  mystery: {
    slug: "mystery",
    label: "Mystery",
    subject: "mystery",
  },

  literary: {
    slug: "literary",
    label: "Literary",
    subject: "literary fiction",
  },

  romance: {
    slug: "romance",
    label: "Romance",
    subject: "romance",
  },

  ya: {
    slug: "ya",
    label: "Young Adult",
    subject: "young adult",
  },

  "young-adult": {
    slug: "ya",
    label: "Young Adult",
    subject: "young adult",
  },

  "young-adult-fiction": {
    slug: "ya",
    label: "Young Adult",
    subject: "young adult",
  },

  "science-fiction": {
    slug: "science-fiction",
    label: "Science Fiction",
    subject: "science fiction",
  },

  "sci-fi": {
    slug: "science-fiction",
    label: "Science Fiction",
    subject: "science fiction",
  },

  horror: {
    slug: "horror",
    label: "Horror",
    subject: "horror",
  },

  thriller: {
    slug: "thriller",
    label: "Thriller",
    subject: "thriller",
  },

  history: {
    slug: "history",
    label: "History",
    subject: "history",
  },

  classics: {
    slug: "classics",
    label: "Classics",
    subject: "classics",
  },
};


/* =========================================================
   NORMALIZACIÓN
========================================================= */

function normalizeText(value) {
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


/* =========================================================
   ELIMINAR INFO DE EDICIÓN
========================================================= */

function removeEditionInfo(value) {
  return String(value || "")
    .replace(
      /\([^)]*(?:edition|paperback|hardcover|ebook|kindle|book\s*\d+|volume\s*\d+)[^)]*\)/gi,
      " "
    )
    .replace(
      /\b(?:special|anniversary|illustrated|deluxe|international|collectors?)\s+edition\b/gi,
      " "
    );
}


/* =========================================================
   CLAVE DE OBRA
========================================================= */

function getWorkKey(book) {
  const title =
    normalizeText(
      removeEditionInfo(
        book?.title
      )
    );

  const author =
    normalizeText(
      book?.author ||
      book?.authors?.[0]
    );

  return `${title}:${author}`;
}


/* =========================================================
   SCORE PARA ELEGIR MEJOR EDICIÓN
========================================================= */

function getBookScore(book) {
  let score = 0;

  if (book?.coverUrl) {
    score += 5;
  }

  if (book?.author) {
    score += 2;
  }

  if (
    book?.averageRating ||
    book?.rating
  ) {
    score += 2;
  }

  if (
    book?.ratingsCount
  ) {
    score += 2;
  }

  if (
    book?.totalPages ||
    book?.pageCount
  ) {
    score += 1;
  }

  if (book?.description) {
    score += 1;
  }

  return score;
}


/* =========================================================
   DEDUPLICAR EDICIONES
========================================================= */

function dedupeResults(
  books = []
) {
  const result =
    new Map();


  for (const book of books) {
    if (!book?.title) {
      continue;
    }


    const key =
      getWorkKey(book);


    if (
      !key ||
      key === ":"
    ) {
      continue;
    }


    const existing =
      result.get(key);


    if (!existing) {
      result.set(
        key,
        book
      );

      continue;
    }


    /*
     * Si hay dos ediciones de la misma obra,
     * conservamos la que tenga más metadata.
     */

    if (
      getBookScore(book) >
      getBookScore(existing)
    ) {
      result.set(
        key,
        book
      );
    }
  }


  return [
    ...result.values(),
  ];
}


/* =========================================================
   OBTENER CONFIG
========================================================= */

export function getCategoryConfig(
  slug
) {
  const value =
    String(slug || "")
      .trim()
      .toLowerCase();


  return (
    CATEGORY_CONFIG[value] ||
    null
  );
}


/* =========================================================
   GENERAR SLUG
========================================================= */

export function getCategorySlug(
  value
) {
  const normalized =
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      )
      .replace(/&/g, "and")
      .replace(/_/g, "-")
      .replace(/\s+/g, "-");


  const aliases = {
    fantasy:
      "fantasy",

    mystery:
      "mystery",

    literary:
      "literary",

    "literary-fiction":
      "literary",

    romance:
      "romance",

    ya:
      "ya",

    "young-adult":
      "ya",

    "young-adult-fiction":
      "ya",

    "science-fiction":
      "science-fiction",

    "sci-fi":
      "science-fiction",

    horror:
      "horror",

    thriller:
      "thriller",

    history:
      "history",

    classics:
      "classics",
  };


  return (
    aliases[normalized] ||
    normalized
  );
}


/* =========================================================
   CARGAR LIBROS DE LA CATEGORÍA
========================================================= */

export async function getCategoryBooks(
  slug,
  limit = 32
) {
  const category =
    getCategoryConfig(
      slug
    );


  if (!category) {
    return [];
  }


  try {

    /*
     * IMPORTANTE:
     *
     * Ya NO hacemos otro fetch directo
     * a Google Books.
     *
     * Reutilizamos EXACTAMENTE el mismo
     * loader que usa el dashboard.
     */

    const books =
      await getBooksBySubject(
        category.subject,
        limit
      );


    if (
      !Array.isArray(books)
    ) {
      return [];
    }


    return dedupeResults(
      books
    ).slice(
      0,
      limit
    );

  } catch (error) {

    /*
     * No tiramos abajo toda la página
     * si el catálogo externo tiene
     * temporalmente un problema.
     */

    console.error(
      `Could not load category "${category.label}":`,
      error
    );


    return [];
  }
}