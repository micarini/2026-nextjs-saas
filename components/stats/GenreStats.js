const GENRE_COLORS = [
  "#36366f",
  "#5f6294",
  "#8e7ba8",
  "#b5acd0",
  "#ddd9e9",
];

export default function GenreStats({
  genres = [],
}) {
  const visible =
    genres.slice(0, 5);

  const total =
    visible.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.count,
      0
    ) || 1;

  return (
    <div>

      {/* BARRA */}

      <div className="flex h-3 overflow-hidden rounded-full bg-[#ebe9f0]">

        {visible.map(
          (
            genre,
            index
          ) => (
            <div
              key={
                genre.name
              }
              style={{
                width: `${
                  (
                    genre.count /
                    total
                  ) * 100
                }%`,

                backgroundColor:
                  GENRE_COLORS[
                    index %
                      GENRE_COLORS.length
                  ],
              }}
            />
          )
        )}

      </div>

      {/* LABELS */}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">

        {visible.length ? (

          visible.map(
            (
              genre,
              index
            ) => (
              <div
                key={
                  genre.name
                }
                className="flex items-center gap-2 text-[11px] text-[#6f6d75]"
              >

                <span
                  className="h-2 w-2 rounded-[2px]"
                  style={{
                    backgroundColor:
                      GENRE_COLORS[
                        index %
                          GENRE_COLORS.length
                      ],
                  }}
                />

                <span>
                  {genre.name} (
                  {genre.count})
                </span>

              </div>
            )
          )

        ) : (

          <p className="text-xs text-[#9a9790]">
            No genre data yet.
          </p>

        )}

      </div>

    </div>
  );
}