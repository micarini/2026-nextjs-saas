export default function ReadingGoalCard({
  completedBooks = 0,
  goal = 20,
}) {
  const percentage = Math.min(
    100,
    Math.round((completedBooks / goal) * 100)
  );

  return (
    <section className="rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Reading goal 2026
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-gray-900">
            <span className="text-amber-500">{completedBooks}</span> of {goal}
          </h2>

          <p className="mt-1 text-sm font-medium text-gray-500">
            books completed this year
          </p>
        </div>

        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full shadow-sm"
          style={{
            background: `conic-gradient(
              #fbbf24 ${percentage * 3.6}deg,
              #f3f4f6 ${percentage * 3.6}deg
            )`, // #fbbf24 = amber-400, #f3f4f6 = gray-100
          }}
        >
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-inner">
            <span className="text-lg font-extrabold text-gray-900">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Barra de progreso inferior */}
      <div className="mt-6 h-2.5 overflow-hidden rounded-full bg-gray-100 shadow-inner">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </section>
  );
}