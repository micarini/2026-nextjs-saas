"use client";

import { useEffect, useState, useTransition } from "react";
import BookForm from "@/components/books/BookForm";
import BookSearchResults from "@/components/books/BookSearchResults";
import { searchBooksAction } from "@/app/dashboard/books/new/actions";
import { createBook } from "@/app/dashboard/books/actions";

export default function AddBookFlow({ initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("search");
  const [isPending, startTransition] = useTransition();

  function runSearch(term) {
    setError("");

    startTransition(async () => {
      try {
        const found = await searchBooksAction(term);
        setResults(found);
        setSearched(true);
      } catch (err) {
        setError(err.message || "Search failed.");
      }
    });
  }

  useEffect(() => {
    if (initialQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      runSearch(initialQuery);
    }
    // Only ever runs once, for whatever the page loaded with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    runSearch(query);
  }

  if (mode === "manual") {
    return (
      <BookForm action={createBook} initialValues={{}} submitLabel="Add to library" allowMetadataEditing />
    );
  }

  return (
    <div className="grid gap-5">
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          className="h-14 flex-1 w-full bg-gray-100/80 border-none rounded-2xl px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-400 outline-none transition-all shadow-inner"
          placeholder="Search by title, author, or ISBN"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="h-14 bg-amber-400 hover:bg-amber-500 text-white font-extrabold px-6 rounded-2xl shadow-[0_8px_20px_rgba(251,191,36,0.3)] transition-all disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

      <BookSearchResults results={results} />

      {searched && results.length === 0 && !isPending ? (
        <p className="text-sm font-medium text-gray-500">No matches found.</p>
      ) : null}

      <button
        type="button"
        onClick={() => setMode("manual")}
        className="text-sm font-bold text-amber-500 hover:text-amber-600 transition-colors mt-2 text-left"
      >
        Add manually instead
      </button>
    </div>
  );
}
