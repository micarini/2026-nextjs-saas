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
    .replace(
      /[^a-z0-9áéíóúüñ ]/gi,
      ""
    )
    .replace(/\s+/g, " ");
}


function normalizeCoverUrl(url) {
  if (!url) return "";

  return String(url).replace(
    /^http:\/\//i,
    "https://"
  );
}


/* =========================================================
   DETECTAR QUÉ BUSCAR
========================================================= */

function buildSearchQuery(
  message,
  favoriteGenres = []
) {
  const text =
    clean(message);

  const subjects = [];


  if (
    text.includes("fantasy") ||
    text.includes("fantasía") ||
    text.includes("fantasia")
  ) {
    subjects.push("fantasy");
  }


  if (
    text.includes("science fiction") ||
    text.includes("sci-fi") ||
    text.includes("scifi") ||
    text.includes("ciencia ficción") ||
    text.includes("ciencia ficcion")
  ) {
    subjects.push(
      "science fiction"
    );
  }


  if (
    text.includes("romance") ||
    text.includes("romantic") ||
    text.includes("romántic")
  ) {
    subjects.push("romance");
  }


  if (
    text.includes("mystery") ||
    text.includes("misterio") ||
    text.includes("detective")
  ) {
    subjects.push("mystery");
  }


  if (
    text.includes("thriller") ||
    text.includes("suspense")
  ) {
    subjects.push("thriller");
  }


  if (
    text.includes("horror") ||
    text.includes("terror")
  ) {
    subjects.push("horror");
  }


  if (
    text.includes("history") ||
    text.includes("historia")
  ) {
    subjects.push("history");
  }


  if (
    text.includes("mythology") ||
    text.includes("myth") ||
    text.includes("mitología") ||
    text.includes("mitologia")
  ) {
    subjects.push("mythology");
  }


  if (
    text.includes("mysticism") ||
    text.includes("mystic") ||
    text.includes("misticismo") ||
    text.includes("místico") ||
    text.includes("mistico")
  ) {
    subjects.push("mysticism");
  }


  if (
    text.includes("biography") ||
    text.includes("biografía") ||
    text.includes("biografia") ||
    text.includes("memoir")
  ) {
    subjects.push("biography");
  }


  if (
    text.includes("adventure") ||
    text.includes("aventura")
  ) {
    subjects.push("adventure");
  }


  if (
    text.includes("young adult") ||
    text.includes("ya ")
  ) {
    subjects.push(
      "young adult"
    );
  }


  /*
    Pregunta genérica:
    usamos el género favorito del usuario.
  */

  const generic =
    text.includes("recommend") ||
    text.includes("recomend") ||
    text.includes("surprise") ||
    text.includes("sorpr");


  if (
    subjects.length === 0 &&
    generic &&
    favoriteGenres.length > 0
  ) {
    subjects.push(
      favoriteGenres[0]
    );
  }


  if (subjects.length) {
    return {
      text:
        subjects.join(" "),

      subject:
        subjects[0],
    };
  }


  return {
    text: message,
    subject: null,
  };
}


/* =========================================================
   FILTRAR LIBROS QUE YA TIENE EL USUARIO
========================================================= */

function filterExistingBooks(
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
      if (!book?.title) {
        return false;
      }

      const title =
        normalizeTitle(
          book.title
        );


      if (!title) {
        return false;
      }


      if (
        existing.has(title)
      ) {
        return false;
      }


      if (
        seen.has(title)
      ) {
        return false;
      }


      seen.add(title);

      return true;
    }
  );
}


/* =========================================================
   GOOGLE BOOKS
========================================================= */

async function searchGoogleBooks(
  search
) {
  const url =
    new URL(
      "https://www.googleapis.com/books/v1/volumes"
    );


  /*
    Evito subject:xyz como única query
    porque algunas búsquedas devuelven
    resultados pobres.

    Buscamos texto normal.
  */

  url.searchParams.set(
    "q",
    search.text
  );

  url.searchParams.set(
    "maxResults",
    "20"
  );

  url.searchParams.set(
    "printType",
    "books"
  );


  const response =
    await fetch(
      url.toString(),
      {
        method: "GET",

        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (!response.ok) {
    const body =
      await response
        .text()
        .catch(() => "");

    console.error(
      "Google Books error:",
      response.status,
      body
    );

    return [];
  }


  const data =
    await response.json();


  const items =
    Array.isArray(
      data.items
    )
      ? data.items
      : [];


  return items
    .map((item) => {
      const info =
        item.volumeInfo ||
        {};


      const title =
        info.title ||
        "";


      if (!title) {
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

        source:
          "google",

        googleId:
          item.id,

        title,

        author:
          info.authors?.[0] ||
          "",

        authors:
          info.authors ||
          [],

        description:
          info.description ||
          "",

        genres:
          info.categories ||
          [],

        publishedDate:
          info.publishedDate ||
          "",

        pageCount:
          info.pageCount ||
          null,

        rating:
          info.averageRating ||
          null,

        ratingsCount:
          info.ratingsCount ||
          0,

        coverUrl,

        infoLink:
          info.infoLink ||
          "",
      };
    })
    .filter(Boolean);
}


/* =========================================================
   OPEN LIBRARY FALLBACK
========================================================= */

async function searchOpenLibrary(
  search
) {
  const url =
    new URL(
      "https://openlibrary.org/search.json"
    );


  url.searchParams.set(
    "q",
    search.text
  );

  url.searchParams.set(
    "limit",
    "20"
  );


  const response =
    await fetch(
      url.toString(),
      {
        headers: {
          Accept:
            "application/json",
        },

        cache:
          "no-store",
      }
    );


  if (!response.ok) {
    console.error(
      "Open Library error:",
      response.status
    );

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
          `openlibrary-${book.key}`,

        source:
          "openlibrary",

        title:
          book.title,

        author:
          book.author_name?.[0] ||
          "",

        authors:
          book.author_name ||
          [],

        description:
          "",

        genres:
          book.subject
            ?.slice(0, 5) ||
          [],

        publishedDate:
          book.first_publish_year
            ? String(
                book.first_publish_year
              )
            : "",

        pageCount:
          book.number_of_pages_median ||
          null,

        rating:
          null,

        ratingsCount:
          0,

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
   ORDENAR RESULTADOS
========================================================= */

function scoreBook(book) {
  let score = 0;


  /*
    Preferimos resultados que tengan portada.
  */

  if (book.coverUrl) {
    score += 5;
  }


  /*
    Autor conocido.
  */

  if (book.author) {
    score += 2;
  }


  /*
    Información de páginas.
  */

  if (book.pageCount) {
    score += 1;
  }


  /*
    Rating Google Books.
  */

  if (book.rating) {
    score +=
      Number(book.rating);
  }


  if (
    book.ratingsCount
  ) {
    score +=
      Math.min(
        5,
        Math.log10(
          book.ratingsCount +
            1
        )
      );
  }


  return score;
}


/* =========================================================
   RESPUESTA DEL BOT
========================================================= */

function buildReply(
  message,
  books,
  favoriteGenres
) {
  const text =
    clean(message);


  if (!books.length) {
    return "I couldn't find a good match yet. Try telling me a genre, mood or type of story you want to read.";
  }


  if (
    text.includes(
      "surprise"
    ) ||
    text.includes(
      "sorpr"
    )
  ) {
    return "I picked a few books you might enjoy. I left out titles that are already in your library.";
  }


  if (
    text.includes(
      "fantasy"
    ) ||
    text.includes(
      "fantas"
    )
  ) {
    return "Here are some fantasy books worth exploring. I tried to mix popular choices with a few different styles.";
  }


  if (
    text.includes(
      "mystery"
    ) ||
    text.includes(
      "misterio"
    )
  ) {
    return "Here are a few mysteries that could be a good fit for your next read.";
  }


  if (
    text.includes(
      "romance"
    )
  ) {
    return "I found a few romance books that could fit what you're looking for.";
  }


  if (
    favoriteGenres.length >
    0
  ) {
    return `I found a few possibilities for you. I also kept your taste for ${favoriteGenres
      .slice(0, 2)
      .join(" and ")} in mind.`;
  }


  return "Here are a few books I'd recommend based on what you asked for.";
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
        body?.message ||
          ""
      ).trim();


    if (!message) {
      return Response.json(
        {
          reply:
            "Tell me what kind of book you're looking for.",

          books: [],
        },
        {
          status: 200,
        }
      );
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


    const search =
      buildSearchQuery(
        message,
        favoriteGenres
      );


    /* =====================================================
       1. GOOGLE BOOKS
    ===================================================== */

    let books = [];


    try {
      books =
        await searchGoogleBooks(
          search
        );
    } catch (error) {
      console.error(
        "Google Books fetch failed:",
        error
      );
    }


    /* =====================================================
       2. FALLBACK OPEN LIBRARY
    ===================================================== */

    if (
      books.length < 5
    ) {
      try {
        const openBooks =
          await searchOpenLibrary(
            search
          );


        books = [
          ...books,
          ...openBooks,
        ];

      } catch (error) {

        console.error(
          "Open Library fetch failed:",
          error
        );

      }
    }


    /* =====================================================
       FILTRAR
    ===================================================== */

    books =
      filterExistingBooks(
        books,
        existingTitles
      );


    /* =====================================================
       ORDENAR
    ===================================================== */

    books.sort(
      (a, b) =>
        scoreBook(b) -
        scoreBook(a)
    );


    /* =====================================================
       LIMITAR
    ===================================================== */

    books =
      books.slice(
        0,
        7
      );


    return Response.json(
      {
        reply:
          buildReply(
            message,
            books,
            favoriteGenres
          ),

        books,
      },
      {
        status: 200,
      }
    );

  } catch (error) {

    /*
      MUY IMPORTANTE:

      En vez de devolver 500 y romper
      BookRecommendationBot, devolvemos
      una respuesta válida.
    */

    console.error(
      "Recommendation API error:",
      error
    );


    return Response.json(
      {
        reply:
          "I'm having trouble reaching the book catalog right now. Try again in a moment.",

        books: [],
      },
      {
        status: 200,
      }
    );
  }
}