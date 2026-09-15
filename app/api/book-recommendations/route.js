import { isGeminiConfigured } from "@/lib/ai/gemini";
import { pickBooks, planSearch } from "@/lib/ai/bookbot";
import { getBookIdentity, listUserBooks } from "@/lib/books/books";
import { getCurrentUser } from "@/lib/firebase/session";
import { buildTasteProfile, formatTasteProfile } from "@/lib/recommendations/tasteProfile";

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
      // Kept short on purpose — Open Library's search treats a long,
      // descriptive `q` almost like an AND of every word and returns 0
      // results for phrases this specific. Google Books tolerates long
      // queries fine, but Open Library is the fallback whenever Google
      // Books is unavailable (e.g. its daily quota is exhausted), so the
      // query has to work on both.
      query: "emotional grief family fiction",
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
      // Same reasoning as the emotional intent above — short enough to
      // still return results from Open Library, not just Google Books.
      query: "mysticism spirituality fiction",
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
  query,
  maxResults = 40
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
    String(maxResults)
  );

  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set(
      "key",
      process.env.GOOGLE_BOOKS_API_KEY
    );
  }

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
  query,
  limit = 40
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
    String(limit)
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
   BIBLIOTECA DEL USUARIO

   Ya no confiamos en lo que manda el cliente: leemos la
   biblioteca en el servidor con la sesión, así la IA ve
   los libros leídos y sus puntajes reales.
========================================================= */

function excludeLibrary(
  books,
  libraryKeys
) {
  return books.filter(
    (book) =>
      !libraryKeys.has(
        getBookIdentity(book)
      )
  );
}


function sanitizeHistory(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(-8)
    .map((turn) => ({
      role:
        turn?.role === "assistant"
          ? "assistant"
          : "user",

      text:
        String(turn?.text || "")
          .trim()
          .slice(0, 600),

      books:
        Array.isArray(turn?.books)
          ? turn.books
              .slice(0, 7)
              .map((title) =>
                String(title).slice(0, 120)
              )
          : [],
    }))
    .filter((turn) => turn.text);
}


/* =========================================================
   GEMINI

   1. planSearch: Gemini lee el pedido + historial + gustos
      y propone títulos concretos y búsquedas cortas.
   2. Buscamos esos títulos en Google Books / Open Library
      (solo libros reales, con portada y autor).
   3. pickBooks: Gemini elige entre esos candidatos reales
      y redacta la respuesta.

   Si algo falla (sin key, cuota agotada, respuesta rara),
   el caller cae al camino de reglas de siempre.
========================================================= */

function titlesMatch(
  foundTitle,
  wantedTitle
) {
  const found =
    normalizeTitle(foundTitle);

  const wanted =
    normalizeTitle(wantedTitle);

  if (!found || !wanted) {
    return false;
  }

  return (
    found === wanted ||
    found.startsWith(wanted) ||
    wanted.startsWith(found)
  );
}


async function findSuggestedBook({
  title,
  author,
}) {
  const safeTitle =
    title.replace(/"/g, "");

  const safeAuthor =
    author.replace(/"/g, "");

  const query =
    safeAuthor
      ? `intitle:"${safeTitle}" inauthor:"${safeAuthor}"`
      : `intitle:"${safeTitle}"`;

  let results =
    await searchGoogleBooks(
      query,
      5
    );

  let matches =
    results.filter((book) =>
      titlesMatch(
        book.title,
        title
      )
    );

  if (!matches.length) {
    results =
      await searchOpenLibrary(
        `${safeTitle} ${safeAuthor}`.trim(),
        5
      );

    matches =
      results.filter((book) =>
        titlesMatch(
          book.title,
          title
        )
      );
  }

  if (!matches.length) {
    return null;
  }

  return {
    ...(matches.find(
      (book) => book.coverUrl
    ) || matches[0]),

    suggested: true,
  };
}


async function recommendWithAI({
  message,
  history,
  profileText,
  intent,
  existingTitles,
  libraryKeys,
}) {
  const plan =
    await planSearch({
      message,
      history,
      profileText,
    });

  const queries =
    plan.queries.length
      ? plan.queries
      : [intent.query];

  const [
    suggested,
    queried,
  ] = await Promise.all([
    Promise.all(
      plan.suggestions.map(
        findSuggestedBook
      )
    ),

    Promise.all(
      queries.map((query) =>
        searchGoogleBooks(
          query,
          15
        )
      )
    ),
  ]);

  /*
    Los títulos que pensó la IA van primero,
    así ganan en el dedupe y en el orden.
  */

  let candidates =
    excludeLibrary(
      cleanResults(
        [
          ...suggested.filter(Boolean),
          ...queried.flat(),
        ],
        existingTitles
      ),
      libraryKeys
    );

  if (plan.maxPages) {
    const shortOnes =
      candidates.filter(
        (book) =>
          !book.pageCount ||
          book.pageCount <=
            plan.maxPages * 1.15
      );

    if (shortOnes.length >= 3) {
      candidates = shortOnes;
    }
  }

  if (!candidates.length) {
    return null;
  }

  const pick =
    await pickBooks({
      message,
      history,
      profileText,
      candidates,
    });

  const books =
    pick.indexes
      .map((index) => candidates[index])
      .filter(Boolean);

  if (!books.length) {
    return null;
  }

  return {
    reply:
      pick.reply ||
      "Here are a few books I think you'll like.",

    books,

    intent:
      intent.type,

    source:
      "gemini",
  };
}


/* =========================================================
   API
========================================================= */

export async function POST(
  request
) {
  try {
    const user =
      await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error:
            "unauthorized",

          reply:
            "Sign in to get personal recommendations.",

          books: [],
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await request
        .json()
        .catch(() => ({}));

    const message =
      String(
        body?.message || ""
      )
        .trim()
        .slice(0, 1000);

    if (!message) {
      return Response.json({
        reply:
          "Tell me what kind of book you're looking for.",
        books: [],
      });
    }

    const history =
      sanitizeHistory(
        body?.history
      );


    /*
      Biblioteca y gustos del usuario.
    */

    const library =
      await listUserBooks(
        user.uid
      );

    const profile =
      buildTasteProfile(
        library
      );

    const favoriteGenres =
      profile.favoriteGenres;

    const existingTitles =
      library
        .map((book) => book.title)
        .filter(Boolean);

    const libraryKeys =
      new Set(
        library
          .map(
            (book) =>
              book.bookKey ||
              getBookIdentity(book)
          )
          .filter(Boolean)
      );

    const intent =
      detectIntent(
        message,
        favoriteGenres
      );


    /*
      CAMINO IA
    */

    if (isGeminiConfigured()) {
      try {
        const aiResult =
          await recommendWithAI({
            message,
            history,
            profileText:
              formatTasteProfile(
                profile
              ),
            intent,
            existingTitles,
            libraryKeys,
          });

        if (aiResult) {
          return Response.json(
            aiResult
          );
        }
      } catch (error) {
        console.error(
          "Gemini recommendation failed, falling back to rules:",
          error.message
        );
      }
    }


    /*
      CAMINO DE REGLAS (fallback)
    */

    let books =
      await searchGoogleBooks(
        intent.query
      );

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

    books =
      excludeLibrary(
        cleanResults(
          books,
          existingTitles
        ),
        libraryKeys
      );

    const finalBooks =
      rankForIntent(
        books,
        intent
      ).slice(0, 7);

    return Response.json({
      reply:
        buildReply(
          intent,
          finalBooks
        ),

      books:
        finalBooks,

      intent:
        intent.type,

      source:
        "rules",
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
