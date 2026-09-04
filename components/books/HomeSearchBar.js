"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { searchBooksAction } from "@/app/dashboard/books/new/actions";
import SelectSearchResultForm from "@/components/books/SelectSearchResultForm";

export default function HomeSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef(null);

  function handleQueryChange(event) {
    const value = event.target.value;
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      setSearched(false);
      setOpen(false);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);

      searchBooksAction(trimmed)
        .then((found) => {
          setResults(found.slice(0, 5));
          setSearched(true);
          setOpen(true);
        })
        .catch(() => {
          setResults([]);
          setSearched(true);
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative mb-6">
      <form action="/dashboard/books/new" method="GET">
        <div className="flex h-14 items-center gap-3 rounded-full border border-[#e7e3da] bg-white px-5 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#77766d" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>

          <input
            type="text"
            name="q"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Title, author or ISBN"
            aria-label="Search to add a book"
            autoComplete="off"
            className="flex-1 bg-transparent text-[15px] text-[#2c3025] outline-none placeholder:text-[#a09c8f]"
          />

          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="flex h-6 w-6 shrink-0 items-center justify-center text-[#a09c8f]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>
      </form>

      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-40 overflow-hidden rounded-2xl border border-[#e7e3da] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
          {loading ? (
            <p className="px-5 py-4 text-sm text-[#a09c8f]">Searching...</p>
          ) : results.length > 0 ? (
            <>
              {results.map((result, index) => (
                <SelectSearchResultForm
                  key={`${result.source}-${result.isbn || result.title}-${index}`}
                  result={result}
                  className="border-b border-[#f0eee8] last:border-b-0"
                >
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#f8f8fa]"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-[#ebe3d0]">
                      {result.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={result.coverUrl}
                          alt={result.title}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#20180f]">{result.title}</p>
                      <p className="truncate text-xs text-[#77766d]">{result.author}</p>
                    </div>
                  </button>
                </SelectSearchResultForm>
              ))}

              <Link
                href={`/dashboard/books/new?q=${encodeURIComponent(query)}`}
                className="block px-4 py-3 text-center text-sm font-semibold text-[#20180f] transition hover:bg-[#f8f8fa]"
              >
                View all results...
              </Link>
            </>
          ) : searched ? (
            <p className="px-5 py-4 text-sm text-[#a09c8f]">No matches found.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
