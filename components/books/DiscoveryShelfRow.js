"use client";

import { useRef } from "react";

export default function DiscoveryShelfRow({
  label,
  books = [],
  emptyMessage,
  accentColor = "rgba(245, 158, 11, 0.65)",
}) {
  const scrollRef = useRef(null);

  function scrollByAmount(amount) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold text-[#20180f]">{label}</h2>

        {books.length > 0 ? (
          <div className="flex items-center gap-1">
            <span className="mr-1 text-[11px] text-[#a89a7f]">
              {books.length} book{books.length === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              onClick={() => scrollByAmount(-260)}
              aria-label="Scroll left"
              className="flex size-6 items-center justify-center rounded-full text-[#cfc4ac] transition hover:text-[#20180f]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollByAmount(260)}
              aria-label="Scroll right"
              className="flex size-6 items-center justify-center rounded-full text-[#20180f] transition hover:text-[#c96a1f]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      {books.length === 0 ? (
        <p className="text-sm text-[#a89a7f]">{emptyMessage}</p>
      ) : (
        <div className="relative">
          {/* Fixed shelf ledge — spans the full row width, stays put while covers scroll under it */}
          <div
            className="pointer-events-none absolute inset-x-0 -bottom-2 h-[52px] rounded-md"
            style={{ backgroundColor: accentColor }}
          >
            <span className="absolute left-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/80" />
            <span className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white/80" />
          </div>

          {/* Scrollable covers */}
          <div ref={scrollRef} className="overflow-x-auto pb-2">
            <div className="flex gap-1.5">
              {books.map((book, index) => (
                <div key={`${book.title}-${index}`} className="w-24 shrink-0">
                  <div className="aspect-[0.68] overflow-hidden rounded-sm bg-[#ebe3d0] shadow-[0_10px_18px_rgba(0,0,0,0.22)]">
                    {book.coverUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
