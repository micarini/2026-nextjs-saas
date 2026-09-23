"use client";

import Link from "next/link";
import { useState } from "react";

const BAR_COLORS = [
  "#789b87", "#d7b658", "#d8896c", "#a87993", "#6e89a8", "#d79755",
  "#8e7ba8", "#587c78", "#c2a68a", "#6d7082", "#c7788b", "#98ae74",
];

export default function MonthlyBars({ monthly = [], compact = false }) {
  const [selected, setSelected] = useState(null);
  const maxBooks = Math.max(1, ...monthly.map((item) => item.books));
  const baseHeight = compact ? 96 : 150;

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex min-h-0 flex-1 items-end gap-2 sm:gap-3">
        {monthly.map((item, index) => {
          const height =
            item.books === 0
              ? 10
              : Math.max(24, (item.books / maxBooks) * baseHeight);

          return (
            <div
              key={`${item.label}-${index}`}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
            >
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-label={`${item.books} books in ${item.label}`}
                className={`w-full max-w-[28px] rounded-t-[3px] transition-all duration-500 ${
                  selected === index ? "ring-2 ring-white" : ""
                }`}
                style={{
                  height,
                  backgroundColor: BAR_COLORS[index % BAR_COLORS.length],
                  opacity: item.books === 0 ? 0.2 : 1,
                }}
                title={`${item.books} book${item.books === 1 ? "" : "s"}`}
              />
              <span className="font-mono text-[8px] uppercase text-white/45">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {selected !== null ? (
        <div className="absolute inset-x-0 top-full z-10 mt-3 rounded-2xl border border-[#dedbd2] bg-white p-4 text-[#36366f] shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">
              Books read in {monthly[selected].label}
            </p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs text-[#8c8991]"
            >
              Close
            </button>
          </div>
          {monthly[selected].bookItems?.length ? (
            <div className="mt-3 space-y-2">
              {monthly[selected].bookItems.map((book) => (
                <Link
                  key={book.id}
                  href={`/dashboard/books/${book.id}`}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-[#f4f2fa]"
                >
                  <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-[#ebe3d0]">
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{book.title}</p>
                    <p className="truncate text-[11px] text-[#8c8991]">{book.author}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-[#8c8991]">No books finished this month.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
