"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

function numberWords(value) {
  if (value === 0) {
    return "Zero";
  }

  return value.toLocaleString();
}

export default function WrappedStory({
  stats,
}) {
  const slides =
    useMemo(
      () => [
        {
          kicker:
            "Books",

          value:
            stats.booksFinished,

          headline: `You finished ${
            stats.booksFinished
          } book${
            stats.booksFinished ===
            1
              ? ""
              : "s"
          }.`,

          body:
            stats.differenceFromLastYear >
            0
              ? `${
                  stats.differenceFromLastYear
                } more than last year. Your reading life is quietly accelerating.`
              : stats.differenceFromLastYear <
                    0
                ? `${Math.abs(
                    stats.differenceFromLastYear
                  )} fewer than last year — every reading year has its own rhythm.`
                : "Exactly the same number as last year — a beautifully steady reading rhythm.",
        },

        {
          kicker:
            "Pages",

          value:
            stats.pagesRead.toLocaleString(),

          headline: `${numberWords(
            stats.pagesRead
          )} pages read.`,

          body:
            "Page by page, shelf by shelf — this is the distance you travelled through books this year.",
        },

        {
          kicker:
            "Five-star reads",

          value:
            stats.fiveStarReads,

          headline: `${
            stats.fiveStarReads
          } book${
            stats.fiveStarReads ===
            1
              ? ""
              : "s"
          } earned five stars.`,

          body:
            stats.fiveStarTitles
              .length
              ? `${stats.fiveStarTitles.join(
                  ", "
                )}${
                  stats
                    .fiveStarTitles
                    .length >=
                  4
                    ? "…"
                    : "."
                }`
              : "Your next all-time favourite might still be waiting on the shelf.",
        },

        {
          kicker:
            "Top genre",

          value:
            stats.genres[0]
              ?.count || 0,

          headline:
            stats.genres[0]
              ?.name ||
            "Your reading taste",

          body:
            stats.genres[0]
              ? `Your most-read genre of ${
                  stats.year
                }, with ${
                  stats
                    .genres[0]
                    .count
                } finished book${
                  stats
                    .genres[0]
                    .count ===
                  1
                    ? ""
                    : "s"
                }.`
              : "Add genres to your books and your reading personality will appear here.",
        },

        {
          kicker: `${stats.year} wrapped`,

          value:
            stats.goalProgress >=
            100
              ? "✓"
              : `${stats.goalProgress}%`,

          headline:
            stats.goalProgress >=
            100
              ? "Goal reached."
              : "Your year in books.",

          body: `${
            stats.booksFinished
          } books, ${stats.pagesRead.toLocaleString()} pages and ${
            stats.readingDayCount
          } tracked reading days.`,
        },
      ],
      [stats]
    );

  const [
    index,
    setIndex,
  ] = useState(0);

  const slide =
    slides[index];

  const isLast =
    index ===
    slides.length - 1;

  function next() {
    if (isLast) return;

    setIndex(
      (value) =>
        value + 1
    );
  }

  function previous() {
    if (index === 0) {
      return;
    }

    setIndex(
      (value) =>
        value - 1
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#17171d] text-white">

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-5 pb-7 pt-6 sm:px-8">

        {/* TOP */}

        <header className="flex items-center gap-4">

          <button
            type="button"
            onClick={
              previous
            }
            disabled={
              index === 0
            }
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5 disabled:opacity-20"
            aria-label="Previous slide"
          >
            ←
          </button>

          {/* PROGRESS */}

          <div
            className="grid flex-1 gap-2"
            style={{
              gridTemplateColumns: `repeat(${slides.length}, minmax(0, 1fr))`,
            }}
          >

            {slides.map(
              (
                _,
                slideIndex
              ) => (
                <span
                  key={
                    slideIndex
                  }
                  className="h-[2px] rounded-full"
                  style={{
                    backgroundColor:
                      slideIndex <=
                      index
                        ? "#c8e75b"
                        : "rgba(255,255,255,.08)",
                  }}
                />
              )
            )}

          </div>

          <Link
            href="/dashboard/stats"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/45 transition hover:bg-white/5"
            aria-label="Close wrapped"
          >
            ×
          </Link>

        </header>

        {/* SLIDE */}

        <section
          key={index}
          className="flex flex-1 animate-[wrappedIn_.45s_cubic-bezier(.22,1,.36,1)] flex-col justify-center py-12"
        >

          <p className="text-[72px] font-semibold leading-none tracking-[-0.06em] text-[#c8e75b] sm:text-[96px]">
            {slide.value}
          </p>

          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/25">
            {slide.kicker}
          </p>

          <h1 className="mt-6 max-w-xl text-[28px] font-semibold leading-tight tracking-[-0.03em] sm:text-[36px]">
            {slide.headline}
          </h1>

          <p className="mt-3 max-w-lg text-sm leading-6 text-white/25">
            {slide.body}
          </p>

        </section>

        {/* NEXT */}

        {isLast ? (

          <Link
            href="/dashboard/stats"
            className="flex h-14 w-full items-center justify-center rounded-full bg-[#c8e75b] text-sm font-semibold text-[#2d3024] transition hover:scale-[1.01]"
          >
            Back to stats
          </Link>

        ) : (

          <button
            type="button"
            onClick={next}
            className="h-14 w-full rounded-full bg-[#c8e75b] text-sm font-semibold text-[#2d3024] transition hover:scale-[1.01]"
          >
            Next
          </button>

        )}

      </div>

      <style jsx global>{`
        @keyframes wrappedIn {
          from {
            opacity: 0;
            transform: translateY(
              18px
            );
          }

          to {
            opacity: 1;
            transform: translateY(
              0
            );
          }
        }
      `}</style>

    </main>
  );
}