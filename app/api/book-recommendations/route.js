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

const GENRE_ALIASES = {
  fantasy: ["fantasy", "fantasía", "fantasia"],
  romance: ["romance", "romantic"],
  mystery: ["mystery", "misterio", "detective"],
  thriller: ["thriller", "suspense"],
  horror: ["horror", "terror"],
  "science fiction": ["science fiction", "sci-fi", "scifi", "ciencia ficción", "ciencia ficcion"],
  "historical fiction": ["historical fiction", "historical", "histórica", "historica"],
  "young adult": ["young adult", "ya"],
  biography: ["biography", "biografía", "biografia"],
  poetry: ["poetry", "poesía", "poesia"],
  classics: ["classics", "classic", "clásicos", "clasicos"],
  crime: ["crime", "crimen"],
  psychology: ["psychology", "psicología", "psicologia"],
  philosophy: ["philosophy", "filosofía", "filosofia"],
  history: ["history", "historia"],
};

function detectRequestedGenre(text) {
  const normalized = clean(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return Object.entries(GENRE_ALIASES).find(([, aliases]) =>
    aliases.some((alias) =>
      normalized.includes(
        alias.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      )
    )
  )?.[0] || "";
}

function detectMaxPages(text) {
  const match = text.match(
    /(?:under|less than|fewer than|up to|max(?:imum)?(?: of)?|menos de|hasta|máximo(?: de)?)\s*(\d+)\s*(?:pages?|páginas?)/i
  );

  return match ? Number(match[1]) : null;
}


/* =========================================================
   DETECTAR INTENCIÓN
========================================================= */

function detectIntent(
  message,
  favoriteGenres = []
) {
  const text = clean(message);
  const requestedGenre = detectRequestedGenre(text);
  const maxPages = detectMaxPages(text);

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
      query: requestedGenre || "fiction",
      genre: requestedGenre || null,
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
    text.includes("pocas páginas") ||
    maxPages
  ) {
    return {
      type: "short",
      query: requestedGenre || "fiction",
      genre: requestedGenre || null,
      maxPages,
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
        genre: requestedGenre || genre,
        query: genre,
        maxPages,
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
      maxPages,
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
      maxPages,
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
      maxPages,
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
      maxPages,
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
      maxPages,
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
      maxPages,
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
  maxResults = 40,
  { genre = "" } = {}
) {
  const url = new URL(
    "https://www.googleapis.com/books/v1/volumes"
  );

  url.searchParams.set("q", genre ? `subject:${genre}` : query);

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
          info.categories?.length
            ? info.categories
            : genre
              ? [genre]
              : [],

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
  limit = 40,
  { genre = "" } = {}
) {
  const url = new URL(
    "https://openlibrary.org/search.json"
  );

  url.searchParams.set(
    "q",
    genre ? `subject:${genre}` : query
  );

  if (genre) {
    url.searchParams.set("subject", genre);
  }

  async function searchOpenLibrarySubject(genre, limit = 40) {
    const subject = encodeURIComponent(genre.replace(/\s+/g, "_"));
    const response = await fetch(
      `https://openlibrary.org/subjects/${subject}.json?limit=${limit}&sort=rating`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const error = new Error(`Open Library subject request failed: ${response.status}`);
      error.status = response.status;
      error.provider = "Open Library";
      throw error;
    }

    const data = await response.json();

    return (Array.isArray(data.works) ? data.works : [])
      .map((book) => ({
        id: `open-${book.key || book.title}`,
        source: "openlibrary",
        title: book.title || "",
        author: book.authors?.[0]?.name || "",
        authors: book.authors?.map((author) => author.name) || [],
        description: "",
        genres: book.subject || [genre],
        publishedDate: book.first_publish_year
          ? String(book.first_publish_year)
          : "",
        pageCount: null,
        rating: Number(book.ratings_average) || null,
        ratingsCount: Number(book.ratings_count) || 0,
        coverUrl: book.cover_id
          ? `https://covers.openlibrary.org/b/id/${book.cover_id}-M.jpg`
          : "",
        infoLink: book.key
          ? `https://openlibrary.org${book.key}`
          : "",
      }))
      .filter((book) => book.title);
  }

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
            ?.slice(0, 6)?.length
            ? book.subject.slice(0, 6)
            : genre
              ? [genre]
              : [],

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

function normalizeGenreText(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function genreMatches(book, genre) {
  if (!genre) {
    return true;
  }

  const aliases = GENRE_ALIASES[genre] || [genre];
  const metadata = (book.genres || [])
    .map(normalizeGenreText)
    .filter(Boolean);

  return aliases.some((alias) => {
    const normalizedAlias = normalizeGenreText(alias);

    return metadata.some(
      (value) =>
        value === normalizedAlias ||
        value.startsWith(`${normalizedAlias} `) ||
        value.includes(` ${normalizedAlias} `) ||
        value.endsWith(` ${normalizedAlias}`) ||
        value.includes(`/${normalizedAlias}`)
    );
  });
}

function filterByIntent(books, intent) {
  if (!intent.genre) {
    return books;
  }

  return books.filter((book) => genreMatches(book, intent.genre));
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

function shuffleBooks(books) {
  const shuffled = [...books];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function shuffleTopBooks(books, topCount = 20) {
  const ranked = [...books];
  const top = ranked.splice(0, topCount);

  return [...shuffleBooks(top), ...ranked];
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
          book.pageCount >= 1 &&
          book.pageCount <= (intent.maxPages || 250)
      );

    /*
      Si Google no devolvió suficientes
      libros con pageCount, no dejamos
      la respuesta vacía.
    */

    const pool =
      intent.maxPages
        ? shortBooks
        : shortBooks.length >= 3
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

  if (intent.type === "genre") {
    const pool = intent.maxPages
      ? books.filter((book) => book.pageCount && book.pageCount <= intent.maxPages)
      : books;
    const ranked = (intent.maxPages ? pool : pool.length >= 3 ? pool : books).sort(
      (a, b) =>
        ((b.ratingsCount || 0) * (b.rating || 1)) -
          ((a.ratingsCount || 0) * (a.rating || 1)) ||
        standardScore(b) - standardScore(a)
    );

    return shuffleTopBooks(ranked);
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

function buildFollowUps(intent) {
  const genre = intent.genre || "this genre";
  const genreLabel = genre.charAt(0).toUpperCase() + genre.slice(1);

  if (intent.type === "short" || intent.maxPages) {
    return [
      `Under ${intent.maxPages ? Math.max(40, intent.maxPages - 25) : 150} pages`,
      `${genreLabel} with a darker mood`,
      `More highly rated ${genre} books`,
    ];
  }

  if (intent.type === "genre") {
    return [
      `${genreLabel} under 200 pages`,
      `More popular ${genre} books`,
      `${genreLabel} with a darker mood`,
      `${genreLabel} for beginners`,
    ];
  }

  return [
    "Something shorter",
    "More popular options",
    "Surprise me with something different",
  ];
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

  function nextDailyResetLabel() {
    const reset = new Date();
    reset.setUTCHours(24, 0, 0, 0);
    return reset.toISOString();
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

  const catalogQueries = intent.genre
    ? queries.map(() => `subject:${intent.genre}`)
    : queries;

  const [
    suggested,
    queried,
    genreQueried,
  ] = await Promise.all([
    Promise.all(
      plan.suggestions.map(
        findSuggestedBook
      )
    ),

    Promise.all(
      catalogQueries.map((query) =>
        searchGoogleBooks(
          query,
          15,
          intent.genre ? { genre: intent.genre } : {}
        )
      )
    ),

    intent.genre
      ? searchOpenLibrarySubject(intent.genre, 40)
      : Promise.resolve([]),
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
          ...genreQueried,
        ],
        existingTitles
      ),
      libraryKeys
    );

  candidates = filterByIntent(candidates, intent);

  const maxPages = intent.maxPages || plan.maxPages;

  if (maxPages) {
    const shortOnes =
      candidates.filter(
        (book) =>
          maxPages === intent.maxPages
            ? book.pageCount && book.pageCount <= maxPages
            : !book.pageCount || book.pageCount <= maxPages * 1.15
      );

    if (shortOnes.length >= 3) {
      candidates = shortOnes;
    }
  }

  candidates = shuffleBooks(candidates);

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

    followUps:
      buildFollowUps(intent),
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

    let geminiUnavailable = false;

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
        geminiUnavailable = true;
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
        intent.query,
        40,
        intent.genre ? { genre: intent.genre } : {}
      );

    books = filterByIntent(books, intent);

    if (books.length < 10) {
      let extra = [];

      try {
        extra = intent.genre
          ? await searchOpenLibrarySubject(intent.genre, 40)
          : await searchOpenLibrary(intent.query, 40);
      } catch (error) {
        console.error("Open Library fallback failed:", error.message);

        if (intent.genre) {
          extra = await searchOpenLibrary(
            intent.query,
            40,
            { genre: intent.genre }
          );
        }
      }

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

    books = filterByIntent(books, intent);

    const finalBooks =
      rankForIntent(
        books,
        intent
      ).slice(0, 7);

    if (!finalBooks.length) {
      return Response.json({
        reply: geminiUnavailable
          ? "Gemini is temporarily unavailable because its quota may have been reached. The catalog fallback also did not return matches."
          : "The book catalog is temporarily unavailable. Please try again later.",
        books: [],
        intent: intent.type,
        source: "fallback",
        quotaNotice: {
          provider: geminiUnavailable ? "Gemini" : "book catalog",
          resetAt: nextDailyResetLabel(),
        },
      });
    }

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

      followUps:
        buildFollowUps(intent),
    });

  } catch (error) {
    console.error(
      "Book recommendation API:",
      error
    );

    const status = Number(error?.status);
    const quota = status === 429 ||
      /quota|rate.?limit|resource.?exhausted|too many requests/i.test(
        error?.message || ""
      );
    const provider = error?.provider ||
      (status === 429 ? "recommendation provider" : "recommendation service");

    return Response.json({
      reply:
        quota
          ? `${provider} has reached its request quota. It should be available again after the next daily reset.`
          : "I couldn't reach the book catalog right now. Try again in a moment.",

      books: [],

      quotaNotice: quota
        ? {
            provider,
            resetAt: nextDailyResetLabel(),
          }
        : null,
    });
  }
}
