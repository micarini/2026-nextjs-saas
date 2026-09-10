import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";
import { listUserBooks } from "@/lib/books/books";

import BottomNav from "@/components/nav/BottomNav";
import StatsDashboard from "@/components/stats/StatsDashboard";

export const dynamic = "force-dynamic";


/* =========================================================
   HELPERS
========================================================= */

function toDate(value) {
  if (!value) return null;

  try {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime())
        ? null
        : value;
    }

    if (typeof value?.toDate === "function") {
      const date = value.toDate();

      return Number.isNaN(date.getTime())
        ? null
        : date;
    }

    if (
      typeof value === "object" &&
      typeof value.seconds === "number"
    ) {
      const date = new Date(
        value.seconds * 1000
      );

      return Number.isNaN(date.getTime())
        ? null
        : date;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? null
      : date;
  } catch {
    return null;
  }
}


function getBookPages(book) {
  const totalPages =
    parseInt(book.totalPages, 10);

  const currentPage =
    parseInt(book.currentPage, 10);

  if (
    !Number.isNaN(totalPages) &&
    totalPages > 0
  ) {
    return totalPages;
  }

  if (
    !Number.isNaN(currentPage) &&
    currentPage > 0
  ) {
    return currentPage;
  }

  return 0;
}


function normalizeGenre(value) {
  if (!value) {
    return "Other";
  }

  return String(value)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function getBookGenres(book) {
  if (
    Array.isArray(book.genres) &&
    book.genres.length
  ) {
    return book.genres
      .map(normalizeGenre)
      .filter(Boolean);
  }

  if (Array.isArray(book.genre)) {
    return book.genre
      .map(normalizeGenre)
      .filter(Boolean);
  }

  if (
    typeof book.genre === "string" &&
    book.genre.trim()
  ) {
    return book.genre
      .split(",")
      .map(normalizeGenre)
      .filter(Boolean);
  }

  return ["Other"];
}


function formatDateKey(date) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   PAGE
========================================================= */

export default async function StatsPage() {
  const user =
    await getCurrentUser();

  if (!user) {
    redirect("/login");
  }


  /* =======================================================
     DATOS
  ======================================================= */

  const books =
    await listUserBooks(user.uid);

  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const previousYear =
    currentYear - 1;


  /* =======================================================
     LIBROS TERMINADOS ESTE AÑO
  ======================================================= */

  const finishedBooksThisYear =
    books.filter((book) => {
      if (book.status !== "read") {
        return false;
      }

      /*
        Mantengo el comportamiento que ya tenía
        tu página:

        Si está marcado como read pero no tiene
        finishDate, lo consideramos del año actual.
      */

      if (!book.finishDate) {
        return true;
      }

      const finishDate =
        toDate(book.finishDate);

      if (!finishDate) {
        return true;
      }

      return (
        finishDate.getFullYear() ===
        currentYear
      );
    });


  /* =======================================================
     LIBROS TERMINADOS AÑO ANTERIOR
  ======================================================= */

  const finishedBooksPreviousYear =
    books.filter((book) => {
      if (book.status !== "read") {
        return false;
      }

      if (!book.finishDate) {
        return false;
      }

      const finishDate =
        toDate(book.finishDate);

      return (
        finishDate &&
        finishDate.getFullYear() ===
          previousYear
      );
    });


  /* =======================================================
     TOTAL LIBROS
  ======================================================= */

  const totalBooksFinished =
    finishedBooksThisYear.length;


  /* =======================================================
     TOTAL PÁGINAS
  ======================================================= */

  const totalPagesReadThisYear =
    finishedBooksThisYear.reduce(
      (total, book) => {
        return (
          total +
          getBookPages(book)
        );
      },
      0
    );


  /* =======================================================
     META ANUAL

     Mantengo la lógica que ya tenías:
     mínimo 30 libros.
  ======================================================= */

  const yearlyGoal =
    totalBooksFinished > 30
      ? totalBooksFinished + 10
      : 30;


  const goalProgress =
    Math.min(
      100,
      Math.round(
        (
          totalBooksFinished /
          yearlyGoal
        ) * 100
      )
    );


  /* =======================================================
     ESTADÍSTICAS MENSUALES
  ======================================================= */

  const monthLabels = [
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


  const monthly =
    monthLabels.map(
      (label, index) => ({
        label,
        monthIndex: index,
        books: 0,
        pages: 0,
      })
    );


  finishedBooksThisYear.forEach(
    (book) => {
      /*
        Si no tiene finishDate usamos
        el mes actual, igual que hacía
        tu implementación anterior.
      */

      const finishDate =
        toDate(book.finishDate);

      const monthIndex =
        finishDate
          ? finishDate.getMonth()
          : now.getMonth();

      if (
        monthIndex < 0 ||
        monthIndex > 11
      ) {
        return;
      }

      monthly[
        monthIndex
      ].books += 1;

      monthly[
        monthIndex
      ].pages +=
        getBookPages(book);
    }
  );


  /* =======================================================
     GÉNEROS
  ======================================================= */

  const genreMap =
    new Map();


  finishedBooksThisYear.forEach(
    (book) => {
      const genres =
        getBookGenres(book);

      genres.forEach((genre) => {
        genreMap.set(
          genre,
          (
            genreMap.get(genre) ||
            0
          ) + 1
        );
      });
    }
  );


  const genres = [
    ...genreMap.entries(),
  ]
    .map(
      ([name, count]) => ({
        name,
        count,
      })
    )
    .sort(
      (a, b) =>
        b.count - a.count
    );


  /* =======================================================
     RATINGS
  ======================================================= */

  const ratings = [
    5,
    4,
    3,
    2,
    1,
  ].map((rating) => ({
    rating,

    count:
      finishedBooksThisYear.filter(
        (book) =>
          Number(
            book.rating
          ) === rating
      ).length,
  }));


  /* =======================================================
     FIVE STAR BOOKS
  ======================================================= */

  const fiveStarBooks =
    finishedBooksThisYear.filter(
      (book) =>
        Number(
          book.rating
        ) === 5
    );


  const fiveStarReads =
    fiveStarBooks.length;


  const fiveStarTitles =
    fiveStarBooks
      .slice(0, 4)
      .map(
        (book) => book.title
      )
      .filter(Boolean);


  /* =======================================================
     LONGEST / SHORTEST
  ======================================================= */

  const booksWithPages =
    finishedBooksThisYear
      .map((book) => ({
        ...book,
        calculatedPages:
          getBookPages(book),
      }))
      .filter(
        (book) =>
          book.calculatedPages >
          0
      )
      .sort(
        (a, b) =>
          b.calculatedPages -
          a.calculatedPages
      );


  const longestBook =
    booksWithPages.length
      ? {
          id:
            booksWithPages[0].id,

          title:
            booksWithPages[0]
              .title ||
            "Untitled",

          author:
            booksWithPages[0]
              .author ||
            "",

          coverUrl:
            booksWithPages[0]
              .coverUrl ||
            "",

          pages:
            booksWithPages[0]
              .calculatedPages,
        }
      : null;


  const shortestSource =
    booksWithPages[
      booksWithPages.length - 1
    ];


  const shortestBook =
    shortestSource
      ? {
          id:
            shortestSource.id,

          title:
            shortestSource.title ||
            "Untitled",

          author:
            shortestSource.author ||
            "",

          coverUrl:
            shortestSource.coverUrl ||
            "",

          pages:
            shortestSource
              .calculatedPages,
        }
      : null;


  /* =======================================================
     ACTIVE READING DAYS
     
     Tu app actualmente no registra sesiones
     individuales de lectura.

     Por eso preservamos la lógica que ya
     tenías: todos los días entre startDate
     y finishDate cuentan como días activos.
  ======================================================= */

  const activityDaysSet =
    new Set();


  books.forEach((book) => {
    const startDate =
      toDate(book.startDate);

    if (!startDate) {
      return;
    }


    let endDate =
      toDate(book.finishDate) ||
      now;


    /*
      No permitir fechas posteriores
      al día actual.
    */

    if (endDate > now) {
      endDate = now;
    }


    /*
      Intersección del período del libro
      con el año actual.
    */

    const startOfYear =
      new Date(
        currentYear,
        0,
        1
      );

    const endOfYear =
      new Date(
        currentYear,
        11,
        31,
        23,
        59,
        59
      );


    const rangeStart =
      startDate < startOfYear
        ? startOfYear
        : startDate;


    const rangeEnd =
      endDate > endOfYear
        ? endOfYear
        : endDate;


    if (
      rangeStart >
      rangeEnd
    ) {
      return;
    }


    const cursor =
      new Date(
        rangeStart.getFullYear(),
        rangeStart.getMonth(),
        rangeStart.getDate()
      );


    const finalDay =
      new Date(
        rangeEnd.getFullYear(),
        rangeEnd.getMonth(),
        rangeEnd.getDate()
      );


    while (
      cursor <= finalDay
    ) {
      activityDaysSet.add(
        formatDateKey(cursor)
      );

      cursor.setDate(
        cursor.getDate() + 1
      );
    }
  });


  const activityDays = [
    ...activityDaysSet,
  ].sort();


  const readingDayCount =
    activityDays.length;


  /* =======================================================
     HORAS

     Solo usamos el dato si alguno de estos
     campos existe realmente en los libros.

     Si no existe, StatsCards muestra "—".
  ======================================================= */

  const trackedMinutes =
    books.reduce(
      (total, book) => {
        const minutes =
          Number(
            book.readingMinutes ??
              book.minutesRead ??
              book.readingTimeMinutes ??
              0
          );

        if (
          Number.isNaN(minutes) ||
          minutes <= 0
        ) {
          return total;
        }

        return (
          total + minutes
        );
      },
      0
    );


  const hoursRead =
    trackedMinutes > 0
      ? Math.round(
          (
            trackedMinutes /
            60
          ) * 10
        ) / 10
      : null;


  /* =======================================================
     AÑO ANTERIOR
  ======================================================= */

  const previousYearCount =
    finishedBooksPreviousYear.length;


  const differenceFromLastYear =
    totalBooksFinished -
    previousYearCount;


  /* =======================================================
     OBJETO QUE RECIBE STATSDASHBOARD
  ======================================================= */

  const stats = {
    year:
      currentYear,

    annualGoal:
      yearlyGoal,

    goalProgress,

    booksFinished:
      totalBooksFinished,

    pagesRead:
      totalPagesReadThisYear,

    hoursRead,

    monthly,

    genres,

    ratings,

    longest:
      longestBook,

    shortest:
      shortestBook,

    previousYear,

    previousYearCount,

    differenceFromLastYear,

    activityDays,

    readingDayCount,

    fiveStarReads,

    fiveStarTitles,
  };


  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f5f3eb] pb-28 text-[#34343b]">

      <StatsDashboard
        stats={stats}
      />

      <BottomNav
        active="stats"
      />

    </main>
  );
}