export default function ReadingGoalCard({
  completedBooks = 0,
  goal = 20,
}) {
  const percentage = Math.min(
    100,
    Math.round((completedBooks / goal) * 100)
  );

  return (
    <section className="rounded-3xl border border-[#e7dfcf] bg-[#f0eee7] p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7566]">
            Reading goal 2026
          </p>

          <h2 className="mt-3 font-serif text-3xl text-[#2c3025]">
            {completedBooks} of {goal}
          </h2>

          <p className="mt-1 text-sm text-[#77766d]">
            books completed this year
          </p>
        </div>

        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: `conic-gradient(
              #4f6549 ${percentage * 3.6}deg,
              #dedbd3 ${percentage * 3.6}deg
            )`,
          }}
        >
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#f0eee7]">
            <span className="text-lg font-medium text-[#2c3025]">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#dedbd3]">
        <div
          className="h-full rounded-full bg-[#4f6549]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}