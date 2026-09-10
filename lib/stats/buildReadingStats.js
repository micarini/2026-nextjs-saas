const MONTH_LABELS = [
  "J",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

function toDate(value) {
  if (!value) {
    return null;
  }

  if (
    value instanceof Date
  ) {
    return Number.isNaN(
      value.getTime()
    )
      ? null
      : value;
  }

  if (
    typeof value?.toDate ===
    "function"
  ) {
    const date =
      value.toDate();

    return Number.isNaN(
      date?.getTime?.()
    )
      ? null
      : date;
  }

  if (
    typeof value ===
      "object" &&
    typeof value.seconds ===
      "number"
  ) {
    const date =
      new Date(
        value.seconds *
          1000
      );

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  const date =
    new Date(value);

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date;
}


function getFinishedDate(
  book
) {
  return (
    toDate(
      book.finishedAt
    ) ||
    toDate(
      book.completedAt
    ) ||
    toDate(
      book.readAt
    ) ||
    toDate(
      book.updatedAt
    ) ||
    toDate(
      book.createdAt
    )
  );
}


function isFinished(book) {
  return [
    "read",
    "finished",
    "completed",
  ].includes(
    String(
      book.status || ""
    ).toLowerCase()
  );
}


function getPages(book) {
  const value =
    book.pageCount ??
    book.pages ??
    book.totalPages ??
    0;

  const pages =
    Number(value);

  return Number.isFinite(
    pages
  ) && pages > 0
    ? pages
    : 0;
}


function getTrackedMinutes(
  book
) {
  const value =
    book.readingMinutes ??
    book.minutesRead ??
    book.readingTimeMinutes ??
    book.timeSpentMinutes ??
    0;

  const minutes =
    Number(value);

  return Number.isFinite(
    minutes
  ) && minutes > 0
    ? minutes
    : 0;
}


function normalizeGenreName(
  value
) {
  return String(
    value || "Other"
  )
    .trim()
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function getGenres(book) {
  if (
    Array.isArray(
      book.genres
    ) &&
    book.genres.length
  ) {
    return book.genres
      .map(
        normalizeGenreName
      )
      .filter(Boolean);
  }

  if (
    Array.isArray(
      book.genre
    ) &&
    book.genre.length
  ) {
    return book.genre
      .map(
        normalizeGenreName
      )
      .filter(Boolean);
  }

  if (
    typeof book.genre ===
      "string" &&
    book.genre.trim()
  ) {
    return book.genre
      .split(",")
      .map(
        normalizeGenreName
      )
      .filter(Boolean);
  }

  return ["Other"];
}


function dateKey(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


function collectActivityDates(
  book,
  targetYear
) {
  const result = [];

  const possibleCollections =
    [
      book.readDates,
      book.readingDays,
      book.activityDates,
      book.readingSessions,
      book.sessions,
    ];

  for (
    const collection of
    possibleCollections
  ) {
    if (
      !Array.isArray(
        collection
      )
    ) {
      continue;
    }

    for (
      const item of
      collection
    ) {
      const candidate =
        item?.date ??
        item?.startedAt ??
        item?.createdAt ??
        item?.timestamp ??
        item;

      const date =
        toDate(
          candidate
        );

      if (
        date &&
        date.getFullYear() ===
          targetYear
      ) {
        result.push(
          dateKey(date)
        );
      }
    }
  }

  return result;
}


export function buildReadingStats(
  books = [],
  year,
  goal = 12
) {
  const selectedYear =
    Number(year) ||
    new Date().getFullYear();

  const annualGoal =
    Math.max(
      1,
      Number(goal) || 12
    );


  /* FINISHED THIS YEAR */

  const finishedBooks =
    books.filter(
      (book) => {
        if (
          !isFinished(
            book
          )
        ) {
          return false;
        }

        const date =
          getFinishedDate(
            book
          );

        return (
          date?.getFullYear() ===
          selectedYear
        );
      }
    );


  /* PREVIOUS YEAR */

  const previousFinishedBooks =
    books.filter(
      (book) => {
        if (
          !isFinished(
            book
          )
        ) {
          return false;
        }

        const date =
          getFinishedDate(
            book
          );

        return (
          date?.getFullYear() ===
          selectedYear - 1
        );
      }
    );


  /* MONTHS */

  const monthly =
    MONTH_LABELS.map(
      (
        label,
        index
      ) => ({
        label,
        monthIndex:
          index,
        books: 0,
        pages: 0,
      })
    );


  for (
    const book of
    finishedBooks
  ) {
    const date =
      getFinishedDate(
        book
      );

    if (!date) {
      continue;
    }

    const month =
      monthly[
        date.getMonth()
      ];

    month.books += 1;

    month.pages +=
      getPages(book);
  }


  /* PAGES */

  const pagesRead =
    finishedBooks.reduce(
      (
        sum,
        book
      ) =>
        sum +
        getPages(book),
      0
    );


  /* TIME */

  const trackedMinutes =
    finishedBooks.reduce(
      (
        sum,
        book
      ) =>
        sum +
        getTrackedMinutes(
          book
        ),
      0
    );


  /* GENRES */

  const genreMap =
    new Map();

  for (
    const book of
    finishedBooks
  ) {
    for (
      const genre of
      getGenres(book)
    ) {
      genreMap.set(
        genre,
        (
          genreMap.get(
            genre
          ) || 0
        ) + 1
      );
    }
  }


  const genres = [
    ...genreMap.entries(),
  ]
    .map(
      (
        [
          name,
          count,
        ]
      ) => ({
        name,
        count,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
          a.count ||
        a.name.localeCompare(
          b.name
        )
    );


  /* RATINGS */

  const ratings = [
    5,
    4,
    3,
    2,
    1,
  ].map(
    (rating) => ({
      rating,

      count:
        finishedBooks.filter(
          (book) =>
            Number(
              book.rating
            ) ===
            rating
        ).length,
    })
  );


  /* LONGEST / SHORTEST */

  const booksWithPages =
    finishedBooks
      .filter(
        (book) =>
          getPages(
            book
          ) > 0
      )
      .map(
        (book) => ({
          id:
            book.id,

          title:
            book.title ||
            "Untitled",

          author:
            book.author ||
            "",

          coverUrl:
            book.coverUrl ||
            book.imageUrl ||
            "",

          pages:
            getPages(
              book
            ),
        })
      )
      .sort(
        (
          a,
          b
        ) =>
          b.pages -
          a.pages
      );


  const longest =
    booksWithPages[0] ||
    null;


  const shortest =
    booksWithPages.length
      ? booksWithPages[
          booksWithPages.length -
            1
        ]
      : null;


  /* ACTIVITY DAYS */

  const activityDays =
    new Set();

  for (
    const book of
    books
  ) {
    for (
      const day of
      collectActivityDates(
        book,
        selectedYear
      )
    ) {
      activityDays.add(
        day
      );
    }
  }


  /* FIVE STARS */

  const fiveStarBooks =
    finishedBooks.filter(
      (book) =>
        Number(
          book.rating
        ) === 5
    );


  /* GOAL */

  const goalProgress =
    Math.min(
      100,
      Math.round(
        (
          finishedBooks.length /
          annualGoal
        ) * 100
      )
    );


  return {
    year:
      selectedYear,

    annualGoal,

    goalProgress,

    booksFinished:
      finishedBooks.length,

    pagesRead,

    trackedMinutes,

    hoursRead:
      trackedMinutes > 0
        ? Math.round(
            (
              trackedMinutes /
              60
            ) * 10
          ) / 10
        : null,

    monthly,

    genres,

    ratings,

    longest,

    shortest,

    previousYear:
      selectedYear - 1,

    previousYearCount:
      previousFinishedBooks.length,

    differenceFromLastYear:
      finishedBooks.length -
      previousFinishedBooks.length,

    activityDays: [
      ...activityDays,
    ],

    readingDayCount:
      activityDays.size,

    fiveStarReads:
      fiveStarBooks.length,

    fiveStarTitles:
      fiveStarBooks
        .slice(
          0,
          4
        )
        .map(
          (book) =>
            book.title
        )
        .filter(Boolean),
  };
}