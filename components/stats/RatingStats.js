export default function RatingStats({
  ratings = [],
}) {
  const max =
    Math.max(
      1,
      ...ratings.map(
        (item) =>
          item.count
      )
    );

  return (
    <div className="space-y-3">

      {ratings.map(
        (item) => (
          <div
            key={
              item.rating
            }
            className="grid grid-cols-[28px_1fr_20px] items-center gap-3"
          >

            <span className="font-mono text-[9px] text-[#6f6d75]">
              {item.rating}★
            </span>

            <div className="h-[5px] overflow-hidden rounded-full bg-[#e9e7ef]">

              <div
                className="h-full rounded-full bg-[#36366f] transition-all duration-500"
                style={{
                  width: `${
                    (
                      item.count /
                      max
                    ) * 100
                  }%`,
                }}
              />

            </div>

            <span className="text-right font-mono text-[9px] text-[#8b8891]">
              {item.count}
            </span>

          </div>
        )
      )}

    </div>
  );
}