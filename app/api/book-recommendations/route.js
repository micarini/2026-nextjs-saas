/* =========================================================
   HELPERS
========================================================= */

function clean(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeTitle(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCoverUrl(url) {
  if (!url) return "";

  return String(url).replace(
    /^http:\/\//i,
    "https://"
  );
}


/* =========================================================
   GENEROS DISPONIBLES
========================================================= */

const GENRES = [
  "fantasy",
  "romance",
  "mystery",
  "thriller",
  "horror",
  "science fiction",
  "historical fiction",
  "adventure",
  "young adult",
  "biography",
  "poetry",
  "classics",
  "crime",
  "psychology",
  "philosophy",
  "history",
];


/* =========================================================
   DETECTAR INTENCIÓN
========================================================= */

function detectIntent(
  message,
  favoriteGenres = []
) {
  const text = clean(message);

  /*
    POPULAR
  */

  if (
    text.includes("popular") ||
    text.includes("bestseller") ||
    text.includes("best seller") ||
    text.includes("famous") ||
    text.includes("famos")
  ) {
    return {
      type: "popular",
      query: "fiction",
    };
  }


  /*
    SHORT READS
  */

  if (
    text.includes("short") ||
    text.includes("corto") ||
    text.includes("corta") ||
    text.includes("quick read") ||
    text.includes("pocas paginas") ||
    text.includes("pocas páginas")
  ) {
    return {
      type: "short",
      query: "fiction",
    };
  }


  /*
    EMOTIONAL
  */

  if (
    text.includes("emotional") ||
    text.includes("moving") ||
    text.includes("sad") ||
    text.includes("cry") ||
    text.includes("emotion") ||
    text.includes("emocional") ||
    text.includes("triste") ||
    text.includes("llorar")
  ) {
    return {
      type: "emotional",
      query:
        "emotional moving contemporary fiction family love grief",
    };
  }


  /*
    MYSTICISM
  */

  if (
    text.includes("mysticism") ||
    text.includes("mystic") ||
    text.includes("misticismo") ||
    text.includes("mistico") ||
    text.includes("místico")
  ) {
    return {
      type: "mysticism",
      query:
        "mysticism spirituality magical realism supernatural fiction",
    };
  }


  /*
    SURPRISE ME
  */

  if (
    text.includes("surprise") ||
    text.includes("sorprend")
  ) {
    const fallbackGenres = [
      "fantasy",
      "mystery",
      "romance",
      "science fiction",
      "historical fiction",
      "adventure",
    ];

    const availableGenres =
      favoriteGenres.length
        ? favoriteGenres
        : fallbackGenres;

    const genre =
      availableGenres[
        Math.floor(
          Math.random() *
            availableGenres.length
        )
      ];

    return {
      type: "surprise",
      query: genre || "fiction",
    };
  }


  /*
    GENEROS
  */

  for (const genre of GENRES) {
    if (
      text.includes(
        genre.toLowerCase()
      )
    ) {
      return {
        type: "genre",
        genre,
        query: genre,
      };
    }
  }


  /*
    SINÓNIMOS DE GENEROS
  */

  if (
    text.includes("fantasy") ||
    text.includes("fantasia") ||
    text.includes("fantasía")
  ) {
    return {
      type: "genre",
      genre: "Fantasy",
      query: "fantasy",
    };
  }


  if (
    text.includes("romance") ||
    text.includes("romantic")
  ) {
    return {
      type: "genre",
      genre: "Romance",
      query: "romance",
    };
  }


  if (
    text.includes("mystery") ||
    text.includes("misterio") ||
    text.includes("detective")
  ) {
    return {
      type: "genre",
      genre: "Mystery",
      query: "mystery detective fiction",
    };
  }


  if (
    text.includes("thriller") ||
    text.includes("suspense")
  ) {
    return {
      type: "genre",
      genre: "Thriller",
      query: "thriller suspense",
    };
  }


  if (
    text.includes("horror") ||
    text.includes("terror")
  ) {
    return {
      type: "genre",
      genre: "Horror",
      query: "horror fiction",
    };
  }


  if (
    text.includes("sci-fi") ||
    text.includes("scifi") ||
    text.includes("science fiction") ||
    text.includes("ciencia ficcion") ||
    text.includes("ciencia ficción")
  ) {
    return {
      type: "genre",
      genre: "Science Fiction",
      query: "science fiction",
    };
  }


  /*
    RECOMENDACIÓN GENÉRICA
  */

  if (
    text.includes("recommend") ||
    text.includes("recomend")
  ) {
    return {
      type: "general",
      query:
        favoriteGenres[0] ||
        "fiction",
    };
  }


  /*
    TEXTO LIBRE
  */

  return {
    type: "search",
    query: message,
  };
}


/* =========================================================
   GOOGLE BOOKS
========================================================= */

async function searchGoogleBooks(
  query
) {
  const url = new URL(
    "https://www.googleapis.com/books/v1/volumes"
  );

  url.searchParams.set(
    "q",
    query
  );

  url.searchParams.set(
    "maxResults",
    "40"
  );

  url.searchParams.set(
    "printType",
    "books"
  );

  const response =
    await fetch(
      url.toString(),
      {
        headers: {
          Accept:
            "application/json",
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    console.error(
      "Google Books:",
      response.status
    );

    return [];
  }

  const data =
    await response.json();

  const items =
    Array.isArray(data.items)
      ? data.items
      : [];

  return items
    .map((item) => {
      const info =
        item.volumeInfo || {};

      if (!info.title) {
        return null;
      }

      let coverUrl =
        info.imageLinks
          ?.thumbnail ||
        info.imageLinks
          ?.smallThumbnail ||
        "";

      coverUrl =
        normalizeCoverUrl(
          coverUrl
        );

      return {
        id:
          `google-${item.id}`,

        source: "google",

        title:
          info.title,

        author:
          info.authors?.[0] ||
          "",

        authors:
          info.authors || [],

        description:
          info.description || "",

        genres:
          info.categories || [],

        publishedDate:
          info.publishedDate || "",

        pageCount:
          Number(
            info.pageCount
          ) || null,

        rating:
          Number(
            info.averageRating
          ) || null,

        ratingsCount:
          Number(
            info.ratingsCount
          ) || 0,

        coverUrl,

        infoLink:
          info.infoLink || "",
      };
    })
    .filter(Boolean);
}


/* =========================================================
   OPEN LIBRARY
========================================================= */

async function searchOpenLibrary(
  query
) {
  const url = new URL(
    "https://openlibrary.org/search.json"
  );

  url.searchParams.set(
    "q",
    query
  );

  url.searchParams.set(
    "limit",
    "40"
  );

  const response =
    await fetch(
      url.toString(),
      {
        headers: {
          Accept:
            "application/json",
        },

        cache: "no-store",
      }
    );

  if (!response.ok) {
    return [];
  }

  const data =
    await response.json();

  const docs =
    Array.isArray(data.docs)
      ? data.docs
      : [];

  return docs
    .map((book) => {
      if (!book.title) {
        return null;
      }

      const coverUrl =
        book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : "";

      return {
        id:
          `open-${book.cover_i || book.key}`,

        source:
          "openlibrary",

        title:
          book.title,

        author:
          book.author_name?.[0] ||
          "",

        authors:
          book.author_name || [],

        description: "",

        genres:
          book.subject
            ?.slice(0, 6) ||
          [],

        publishedDate:
          book.first_publish_year
            ? String(
                book.first_publish_year
              )
            : "",

        pageCount:
          Number(
            book.number_of_pages_median
          ) || null,

        rating: null,

        ratingsCount: 0,

        coverUrl,

        infoLink:
          book.key
            ? `https://openlibrary.org${book.key}`
            : "",
      };
    })
    .filter(Boolean);
}


/* =========================================================
   QUITAR DUPLICADOS Y LIBROS YA GUARDADOS
========================================================= */

function cleanResults(
  books,
  existingTitles
) {
  const existing =
    new Set(
      existingTitles.map(
        normalizeTitle
      )
    );

  const seen =
    new Set();

  return books.filter(
    (book) => {
      const normalized =
        normalizeTitle(
          book.title
        );

      if (!normalized) {
        return false;
      }

      if (
        existing.has(normalized)
      ) {
        return false;
      }

      if (
        seen.has(normalized)
      ) {
        return false;
      }

      seen.add(normalized);

      return true;
    }
  );
}


/* =========================================================
   SCORE NORMAL
========================================================= */

function standardScore(book) {
  let score = 0;

  if (book.coverUrl) {
    score += 8;
  }

  if (book.author) {
    score += 3;
  }

  if (book.pageCount) {
    score += 2;
  }

  if (book.rating) {
    score +=
      book.rating * 2;
  }

  if (book.ratingsCount) {
    score +=
      Math.min(
        12,
        Math.log10(
          book.ratingsCount + 1
        ) * 3
      );
  }

  return score;
}


/* =========================================================
   APLICAR INTENCIÓN
========================================================= */

function rankForIntent(
  books,
  intent
) {
  /*
    SHORT READS

    Preferimos 60 - 250 páginas.
  */

  if (
    intent.type ===
    "short"
  ) {
    const shortBooks =
      books.filter(
        (book) =>
          book.pageCount &&
          book.pageCount >= 60 &&
          book.pageCount <= 250
      );

    /*
      Si Google no devolvió suficientes
      libros con pageCount, no dejamos
      la respuesta vacía.
    */

    const pool =
      shortBooks.length >= 3
        ? shortBooks
        : books;

    return pool.sort(
      (a, b) => {
        if (
          a.pageCount &&
          b.pageCount
        ) {
          return (
            a.pageCount -
            b.pageCount
          );
        }

        return (
          standardScore(b) -
          standardScore(a)
        );
      }
    );
  }


  /*
    POPULAR BOOKS

    Acá priorizamos cantidad de ratings.
  */

  if (
    intent.type ===
    "popular"
  ) {
    return books.sort(
      (a, b) => {
        const popularityA =
          (a.ratingsCount || 0) *
          (a.rating || 1);

        const popularityB =
          (b.ratingsCount || 0) *
          (b.rating || 1);

        return (
          popularityB -
          popularityA ||
          standardScore(b) -
          standardScore(a)
        );
      }
    );
  }


  /*
    SURPRISE

    Mantenemos buenos resultados
    pero mezclamos un poco.
  */

  if (
    intent.type ===
    "surprise"
  ) {
    const goodBooks =
      [...books]
        .sort(
          (a, b) =>
            standardScore(b) -
            standardScore(a)
        )
        .slice(0, 20);

    return goodBooks.sort(
      () =>
        Math.random() - 0.5
    );
  }


  /*
    RESTO
  */

  return books.sort(
    (a, b) =>
      standardScore(b) -
      standardScore(a)
  );
}


/* =========================================================
   RESPUESTA
========================================================= */

function buildReply(
  intent,
  books
) {
  if (!books.length) {
    return "I couldn't find enough matches. Try another genre or tell me what kind of story you're in the mood for.";
  }

  switch (
    intent.type
  ) {
    case "popular":
      return "These are some popular books worth checking out. I prioritized books with stronger ratings and reader activity.";

    case "short":
      return "Here are some shorter books for when you want something you can finish quickly.";

    case "emotional":
      return "Here are a few emotional reads — stories centered around relationships, family, love, loss and personal change.";

    case "mysticism":
      return "Here are some books with mystical, spiritual, supernatural or magical elements.";

    case "surprise":
      return "I picked a few books for you based on your reading taste. No rules this time — just possibilities.";

    case "genre":
      return `Here are some ${intent.genre || intent.query} books I think are worth exploring.`;

    default:
      return "Here are a few books that match what you're looking for.";
  }
}


/* =========================================================
   API
========================================================= */

export async function POST(
  request
) {
  try {
    const body =
      await request.json();

    const message =
      String(
        body?.message || ""
      ).trim();

    if (!message) {
      return Response.json({
        reply:
          "Tell me what kind of book you're looking for.",
        books: [],
      });
    }

    const favoriteGenres =
      Array.isArray(
        body.favoriteGenres
      )
        ? body.favoriteGenres
        : [];

    const existingTitles =
      Array.isArray(
        body.existingTitles
      )
        ? body.existingTitles
        : [];


    /*
      Detectamos qué quiere el usuario.
    */

    const intent =
      detectIntent(
        message,
        favoriteGenres
      );


    /*
      GOOGLE BOOKS
    */

    let books =
      await searchGoogleBooks(
        intent.query
      );


    /*
      Si tenemos pocos resultados,
      agregamos Open Library.
    */

    if (
      books.length < 10
    ) {
      const extra =
        await searchOpenLibrary(
          intent.query
        );

      books = [
        ...books,
        ...extra,
      ];
    }


    /*
      Limpiar.
    */

    books =
      cleanResults(
        books,
        existingTitles
      );


    /*
      Aplicar lógica de cada tipo
      de recomendación.
    */

    books =
      rankForIntent(
        books,
        intent
      );


    /*
      Mostrar 7.
    */

    books =
      books.slice(0, 7);


    return Response.json({
      reply:
        buildReply(
          intent,
          books
        ),

      books,

      intent:
        intent.type,
    });

  } catch (error) {
    console.error(
      "Book recommendation API:",
      error
    );

    return Response.json({
      reply:
        "I couldn't reach the book catalog right now. Try again in a moment.",

      books: [],
    });
  }
}