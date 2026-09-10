import GenreStats from "@/components/stats/GenreStats";
import GoalRing from "@/components/stats/GoalRing";
import MonthlyBars from "@/components/stats/MonthlyBars";
import RatingStats from "@/components/stats/RatingStats";

function MetricCard({
  eyebrow,
  value,
  caption,
  variant = "light",
  children,
}) {
  const variants = {
    light:
      "border-[#dedbd2] bg-[#fffefa] text-[#36366f]",

    purple:
      "border-[#36366f] bg-[#36366f] text-white",

    lime:
      "border-[#c8e75b] bg-[#c8e75b] text-[#303427]",
  };

  return (
    <section
      className={`
        min-h-[146px]
        rounded-[24px]
        border
        p-4
        shadow-[0_9px_25px_rgba(54,54,111,0.05)]
        ${variants[variant]}
      `}
    >

      <p
        className={`
          font-mono
          text-[8px]
          uppercase
          tracking-[0.18em]
          ${
            variant === "purple"
              ? "text-white/45"
              : "opacity-60"
          }
        `}
      >
        {eyebrow}
      </p>

      {children || (
        <>
          <p className="mt-4 text-[38px] font-semibold leading-none tracking-[-0.04em]">
            {value}
          </p>

          <p
            className={`
              mt-2
              text-[11px]
              ${
                variant === "purple"
                  ? "text-white/45"
                  : "opacity-60"
              }
            `}
          >
            {caption}
          </p>
        </>
      )}

    </section>
  );
}

export default function StatsCards({
  stats,
}) {
  return (
    <div className="space-y-4">

      <div className="grid grid-cols-2 gap-3">

        <MetricCard
          eyebrow="Books"
          value={
            stats.booksFinished
          }
          caption={`finished in ${stats.year}`}
          variant="purple"
        />

        <MetricCard
          eyebrow="Pages"
          value={
            stats.pagesRead >= 1000
              ? `${(
                  stats.pagesRead /
                  1000
                ).toFixed(1)}k`
              : stats.pagesRead
          }
          caption="total pages read"
          variant="lime"
        />

        <MetricCard eyebrow="Goal">

          <div className="mt-4 flex items-center gap-3">

            <GoalRing
              progress={
                stats.goalProgress
              }
              size={58}
              stroke={7}
            />

            <div>

              <p className="text-sm font-semibold">
                {stats.booksFinished}/
                {stats.annualGoal} books
              </p>

              <p className="mt-1 text-[10px] text-[#88858d]">
                annual goal
              </p>

            </div>

          </div>

        </MetricCard>

        <MetricCard
          eyebrow="Hours"
          value={
            stats.hoursRead ??
            "—"
          }
          caption={
            stats.hoursRead == null
              ? "not tracked yet"
              : "of reading"
          }
        />

      </div>

      {/* MONTHS */}

      <section className="rounded-[28px] bg-[#36366f] p-5 text-white shadow-[0_16px_40px_rgba(54,54,111,0.14)]">

        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">
          {stats.year} shelf
        </p>

        <div className="mt-4 h-[130px]">

          <MonthlyBars
            monthly={stats.monthly}
            compact
          />

        </div>

      </section>

      {/* GENRES */}

      <section className="rounded-[26px] border border-[#dedbd2] bg-[#fffefa] p-5 shadow-[0_10px_30px_rgba(54,54,111,0.05)]">

        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c8991]">
          By genre
        </p>

        <GenreStats
          genres={stats.genres}
        />

      </section>

      {/* RATINGS */}

      <section className="rounded-[26px] border border-[#dedbd2] bg-[#fffefa] p-5 shadow-[0_10px_30px_rgba(54,54,111,0.05)]">

        <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#8c8991]">
          Ratings
        </p>

        <RatingStats
          ratings={stats.ratings}
        />

      </section>

    </div>
  );
}