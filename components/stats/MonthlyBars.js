const BAR_COLORS = [
  "#789b87",
  "#d7b658",
  "#d8896c",
  "#a87993",
  "#6e89a8",
  "#d79755",
  "#8e7ba8",
  "#587c78",
  "#c2a68a",
  "#6d7082",
  "#c7788b",
  "#98ae74",
];

export default function MonthlyBars({
  monthly = [],
  compact = false,
}) {
  const maxBooks =
    Math.max(
      1,
      ...monthly.map(
        (item) => item.books
      )
    );

  const baseHeight =
    compact ? 96 : 150;

  return (
    <div className="flex h-full items-end gap-2 sm:gap-3">

      {monthly.map(
        (
          item,
          index
        ) => {
          const height =
            item.books === 0
              ? 10
              : Math.max(
                  24,
                  (
                    item.books /
                    maxBooks
                  ) *
                    baseHeight
                );

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >

              <div
                className="w-full max-w-[28px] rounded-t-[3px] transition-all duration-500"
                style={{
                  height,

                  backgroundColor:
                    BAR_COLORS[
                      index %
                        BAR_COLORS.length
                    ],

                  opacity:
                    item.books === 0
                      ? 0.2
                      : 1,
                }}
                title={`${item.books} book${
                  item.books === 1
                    ? ""
                    : "s"
                }`}
              />

              <span className="font-mono text-[8px] uppercase text-white/45">
                {item.label}
              </span>

            </div>
          );
        }
      )}

    </div>
  );
}