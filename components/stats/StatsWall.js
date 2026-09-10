import Link from "next/link";

import BookExtremes from "@/components/stats/BookExtremes";
import GenreStats from "@/components/stats/GenreStats";
import GoalRing from "@/components/stats/GoalRing";
import MonthlyBars from "@/components/stats/MonthlyBars";
import RatingStats from "@/components/stats/RatingStats";
import ReadingHeatmap from "@/components/stats/ReadingHeatmap";

function SectionCard({
  eyebrow,
  children,
  className = "",
}) {
  return (
    <section
      className={`
        rounded-[26px]
        border
        border-[#dedbd2]
        bg-[#fffefa]
        p-5
        shadow-[0_10px_30px_rgba(54,54,111,0.05)]
        ${className}
      `}
    >
      {eyebrow ? (
        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c8991]">
          {eyebrow}
        </p>
      ) : null}

      {children}
    </section>
  );
}

export default function StatsWall({
  stats,
}) {
  const remaining =
    Math.max(
      0,
      stats.annualGoal -
        stats.booksFinished
    );

  const difference =
    stats.differenceFromLastYear;

  return (
    <div className="space-y-4">

      {/* PRINCIPAL */}

      <section className="rounded-[28px] bg-[#36366f] p-5 text-white shadow-[0_18px_40px_rgba(54,54,111,0.16)]">

        <div className="grid grid-cols-2 gap-5">

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
              Books finished
            </p>

            <p className="mt-1 text-[34px] font-semibold leading-none">
              {stats.booksFinished}
            </p>
          </div>

          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
              Pages read
            </p>

            <p className="mt-1 text-[34px] font-semibold leading-none text-[#c8e75b]">
              {stats.pagesRead.toLocaleString()}
            </p>
          </div>

        </div>

        <div className="mt-7 h-[182px]">
          <MonthlyBars
            monthly={stats.monthly}
          />
        </div>

      </section>

      {/* GOAL */}

      <SectionCard>

        <div className="flex items-center gap-5">

          <GoalRing
            progress={
              stats.goalProgress
            }
          />

          <div>

            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#8c8991]">
              Annual goal
            </p>

            <h3 className="mt-1 text-lg font-semibold text-[#36366f]">
              {stats.booksFinished} of{" "}
              {stats.annualGoal} books
            </h3>

            <p className="mt-1 text-xs text-[#8f8b92]">
              {remaining > 0
                ? `${remaining} book${
                    remaining === 1
                      ? ""
                      : "s"
                  } left to reach your goal`
                : "Goal reached — keep going."}
            </p>

          </div>

        </div>

      </SectionCard>

      {/* READING DAYS */}

      <SectionCard eyebrow="Reading days">

        <ReadingHeatmap
          year={stats.year}
          activityDays={
            stats.activityDays
          }
        />

        <p className="mt-4 text-[11px] text-[#98949b]">
          {stats.readingDayCount} tracked
          day
          {stats.readingDayCount === 1
            ? ""
            : "s"}{" "}
          this year.
        </p>

      </SectionCard>

      {/* GENRES */}

      <SectionCard eyebrow="By genre">
        <GenreStats
          genres={stats.genres}
        />
      </SectionCard>

      {/* RATINGS */}

      <SectionCard eyebrow="Ratings">
        <RatingStats
          ratings={stats.ratings}
        />
      </SectionCard>

      {/* LONGEST / SHORTEST */}

      <SectionCard eyebrow="Longest vs shortest">
        <BookExtremes
          longest={stats.longest}
          shortest={stats.shortest}
        />
      </SectionCard>

      {/* VS LAST YEAR */}

      <SectionCard eyebrow="Vs last year">

        <div className="flex items-center gap-4">

          <div className="min-w-[56px]">

            <p className="font-mono text-[9px] text-[#99969d]">
              {stats.previousYear}
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#8f8aa5]">
              {stats.previousYearCount}
            </p>

          </div>

          <div className="relative flex flex-1 items-center">

            <div className="h-px w-full bg-[#ddd9e6]" />

            <span className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#c8e75b] px-3 py-1 text-[10px] font-semibold text-[#34382b]">
              {difference > 0
                ? `+${difference}`
                : difference}
            </span>

          </div>

          <div className="min-w-[56px] text-right">

            <p className="font-mono text-[9px] text-[#99969d]">
              {stats.year}
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#36366f]">
              {stats.booksFinished}
            </p>

          </div>

        </div>

      </SectionCard>

      {/* WRAPPED */}

      <Link
        href="/dashboard/stats/wrapped"
        className="
          group
          block
          overflow-hidden
          rounded-[28px]
          bg-[#17171d]
          p-5
          text-white
          shadow-[0_18px_45px_rgba(20,20,26,0.18)]
          transition
          hover:-translate-y-0.5
        "
      >

        <div className="flex items-end justify-between gap-5">

          <div>

            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
              Your year
            </p>

            <h3 className="mt-2 text-xl font-semibold">
              See your {stats.year} Wrapped
            </h3>

            <p className="mt-1 text-xs text-white/40">
              A story of your reading year.
            </p>

            <div className="mt-5 flex h-12 items-end gap-[5px]">

              {[
                30,
                46,
                38,
                28,
                42,
                32,
              ].map(
                (
                  height,
                  index
                ) => (
                  <span
                    key={index}
                    className="w-2 rounded-t-[2px]"
                    style={{
                      height,
                      backgroundColor:
                        [
                          "#789b87",
                          "#d7b658",
                          "#d8896c",
                          "#a87993",
                          "#c2a68a",
                          "#98ae74",
                        ][index],
                    }}
                  />
                )
              )}

            </div>

          </div>

          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#c8e75b] text-[#292c21] transition group-hover:scale-105">
            →
          </span>

        </div>

      </Link>

    </div>
  );
}