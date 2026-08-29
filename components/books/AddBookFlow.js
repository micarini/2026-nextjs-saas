"use client";

import { useState, useTransition } from "react";
import BookForm from "@/components/books/BookForm";
import BookSearchResults from "@/components/books/BookSearchResults";
import { searchBooksAction } from "@/app/dashboard/books/new/actions";
import { createBook } from "@/app/dashboard/books/actions";

export default function AddBookFlow() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState("search");
  const [isPending, startTransition] = useTransition();

  function handleSearch(event) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      try {
        const found = await searchBooksAction(query);
        setResults(found);
        setSearched(true);
      } catch (err) {
        setError(err.message || "Search failed.");
      }
    });
  }

  if (mode === "form") {
    return (
      <BookForm action={createBook} initialValues={selected || {}} submitLabel="Add to library" />
    );
  }

  return (
    <div className="grid gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          className="h-11 flex-1 rounded-md border border-[#e7dfcf] bg-white px-3 outline-none focus:border-[#c96a1f]"
          placeholder="Search by title, author, or ISBN"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button
          className="h-11 rounded-md bg-[#20180f] px-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Searching..." : "Search"}
        </button>
      </form>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <BookSearchResults
        results={results}
        onSelect={(result) => {
          setSelected(result);
          setMode("form");
        }}
      />

      {searched && results.length === 0 && !isPending ? (
        <p className="text-sm text-[#a89a7f]">No matches found.</p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          setSelected(null);
          setMode("form");
        }}
        className="text-sm font-semibold text-[#c96a1f] underline"
      >
        Add manually instead
      </button>
    </div>
  );
}
