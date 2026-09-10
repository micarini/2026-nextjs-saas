const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad(value) {
  return String(value).padStart(
    2,
    "0"
  );
}

export default function ReadingHeatmap({
  year,
  activityDays = [],
}) {
  const active =
    new Set(activityDays);

  return (
    <div className="space-y-[5px]">

      {MONTHS.map(
        (
          month,
          monthIndex
        ) => {
          const daysInMonth =
            new Date(
              year,
              monthIndex + 1,
              0
            ).getDate();

          return (
            <div
              key={month}
              className="flex items-center gap-2"
            >

              <span className="w-7 shrink-0 font-mono text-[8px] text-[#77767f]">
                {month}
              </span>

              <div
                className="grid flex-1 gap-[3px]"
                style={{
                  gridTemplateColumns:
                    "repeat(31, minmax(0, 1fr))",
                }}
              >

                {Array.from(
                  {
                    length: 31,
                  },
                  (
                    _,
                    index
                  ) => {
                    const day =
                      index + 1;

                    const valid =
                      day <=
                      daysInMonth;

                    const key = `${year}-${pad(
                      monthIndex +
                        1
                    )}-${pad(
                      day
                    )}`;

                    const isActive =
                      valid &&
                      active.has(
                        key
                      );

                    return (
                      <div
                        key={
                          day
                        }
                        className="aspect-square min-h-[4px] rounded-[2px]"
                        style={{
                          backgroundColor:
                            !valid
                              ? "transparent"
                              : isActive
                                ? "#36366f"
                                : "#e8e6ee",

                          opacity:
                            isActive
                              ? 1
                              : 0.95,
                        }}
                        title={
                          isActive
                            ? key
                            : undefined
                        }
                      />
                    );
                  }
                )}

              </div>

            </div>
          );
        }
      )}

    </div>
  );
}