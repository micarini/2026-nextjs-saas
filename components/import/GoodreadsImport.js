"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

import {
  finishGoodreadsImportAction,
  importGoodreadsBatchAction,
} from "@/app/dashboard/import/actions";
import {
  GOODREADS_MAX_BATCH_SIZE,
  parseGoodreadsExport,
} from "@/lib/import/goodreadsCsv";

const SHELVES = [
  { value: "read", label: "Read" },
  { value: "reading", label: "Currently reading" },
  { value: "to_read", label: "Want to read" },
  { value: "dnf", label: "DNF" },
];

const EMPTY_COUNTS = { added: 0, updated: 0, skipped: 0, duplicate: 0, failed: 0 };

function Card({ children, className = "" }) {
  return (
    <section className={`mt-4 rounded-[28px] border border-[#deddd7] bg-[#f7f7f5] p-6 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

function Label({ children }) {
  return (
    <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
      {children}
    </p>
  );
}

export default function GoodreadsImport() {
  const inputRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [selectedShelves, setSelectedShelves] = useState(["read", "reading", "to_read", "dnf"]);
  const [includeReviews, setIncludeReviews] = useState(true);

  const [phase, setPhase] = useState("pick"); // pick → preview → importing → done
  const [progress, setProgress] = useState(0);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [problems, setProblems] = useState([]);

  const shelfCounts = useMemo(() => {
    const totals = { read: 0, reading: 0, to_read: 0, dnf: 0 };
    books.forEach((book) => {
      totals[book.status] = (totals[book.status] || 0) + 1;
    });
    return totals;
  }, [books]);

  const toImport = useMemo(
    () => books.filter((book) => selectedShelves.includes(book.status)),
    [books, selectedShelves],
  );

  const ratedCount = toImport.filter((book) => book.rating).length;
  const reviewCount = toImport.filter((book) => book.review || book.privateNotes).length;

  async function handleFile(file) {
    setError("");

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseGoodreadsExport(text);

      if (!parsed.books.length) {
        throw new Error("No books found in this file.");
      }

      setFileName(file.name);
      setBooks(parsed.books);
      setPhase("preview");
    } catch (err) {
      setBooks([]);
      setPhase("pick");
      setError(err.message || "Could not read that file.");
    }
  }

  function toggleShelf(value) {
    setSelectedShelves((current) =>
      current.includes(value) ? current.filter((shelf) => shelf !== value) : [...current, value],
    );
  }

  async function startImport() {
    const queue = toImport;

    if (!queue.length) return;

    setPhase("importing");
    setProgress(0);
    setCounts(EMPTY_COUNTS);
    setProblems([]);

    const totals = { ...EMPTY_COUNTS };
    const issues = [];

    for (let start = 0; start < queue.length; start += GOODREADS_MAX_BATCH_SIZE) {
      const batch = queue.slice(start, start + GOODREADS_MAX_BATCH_SIZE);

      try {
        const results = await importGoodreadsBatchAction(batch, { includeReviews });

        results.forEach((result) => {
          totals[result.outcome] = (totals[result.outcome] || 0) + 1;

          if (result.outcome === "failed") {
            issues.push({ title: result.title, reason: "Could not be saved" });
          } else if (result.missingCover) {
            issues.push({ title: result.title, reason: "Added without a cover" });
          }
        });
      } catch {
        totals.failed += batch.length;
        batch.forEach((book) => issues.push({ title: book.title, reason: "Could not be saved" }));
      }

      setProgress(Math.min(queue.length, start + batch.length));
      setCounts({ ...totals });
      setProblems([...issues]);
    }

    await finishGoodreadsImportAction().catch(() => {});
    setPhase("done");
  }

  function reset() {
    setBooks([]);
    setFileName("");
    setPhase("pick");
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  const percent = toImport.length ? Math.round((progress / toImport.length) * 100) : 0;

  return (
    <div className="mt-6">
      {/* ------------------------------------------------ STEP 1 */}
      {phase === "pick" && (
        <>
          <Card>
            <Label>1 · Export from Goodreads</Label>
            <ol className="mt-4 space-y-2 text-sm leading-6 text-[#55555c]">
              <li>
                Open{" "}
                <a
                  href="https://www.goodreads.com/review/import"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#322F7A] underline underline-offset-2"
                >
                  goodreads.com → My Books → Import and export
                </a>{" "}
                on a computer (the app doesn&apos;t have it).
              </li>
              <li>Click <b>Export Library</b> and wait until the download link appears.</li>
              <li>Download <b>goodreads_library_export.csv</b>.</li>
            </ol>
          </Card>

          <Card>
            <Label>2 · Upload the file</Label>

            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[22px] border-2 border-dashed border-[#cfcdc4] bg-white px-6 py-10 text-center transition hover:border-[#322F7A]"
            >
              <span className="text-3xl">📚</span>
              <span className="mt-3 text-sm font-semibold">Choose your CSV</span>
              <span className="mt-1 text-xs text-[#85858c]">or drop it here — it&apos;s read on your device</span>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </label>

            {error && <p className="mt-3 text-sm text-[#a34d45]">{error}</p>}
          </Card>
        </>
      )}

      {/* ------------------------------------------------ STEP 2 */}
      {phase === "preview" && (
        <Card>
          <Label>Ready to import</Label>

          <p className="mt-4 text-[28px] font-semibold leading-none">{books.length} books</p>
          <p className="mt-1 text-xs text-[#85858c]">from {fileName}</p>

          <p className="mt-6 text-sm font-semibold">Shelves to import</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SHELVES.map((shelf) => {
              const active = selectedShelves.includes(shelf.value);
              return (
                <button
                  key={shelf.value}
                  type="button"
                  onClick={() => toggleShelf(shelf.value)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    active ? "bg-[#322F7A] text-white" : "bg-white text-[#85858c] ring-1 ring-[#deddd7]"
                  }`}
                >
                  {shelf.label} · {shelfCounts[shelf.value] || 0}
                </button>
              );
            })}
          </div>

          <label className="mt-5 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={includeReviews}
              onChange={(event) => setIncludeReviews(event.target.checked)}
              className="h-4 w-4 accent-[#322F7A]"
            />
            Save my reviews and private notes as book notes ({reviewCount})
          </label>

          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-2xl font-semibold">{toImport.length}</p>
              <p className="text-xs text-[#85858c]">to import</p>
            </div>
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-2xl font-semibold">{ratedCount}</p>
              <p className="text-xs text-[#85858c]">with your rating</p>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 text-[#85858c]">
            Books already in your library are not duplicated — we only fill in a missing rating,
            status or finish date. Covers and descriptions come from Google Books / Open Library.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="h-12 flex-1 rounded-full bg-white text-sm font-semibold ring-1 ring-[#deddd7]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={startImport}
              disabled={!toImport.length}
              className="h-12 flex-[2] rounded-full bg-[#C9E265] text-sm font-semibold text-[#25271e] transition hover:scale-[1.01] disabled:opacity-40"
            >
              Import {toImport.length} books
            </button>
          </div>
        </Card>
      )}

      {/* ------------------------------------------------ STEP 3 / 4 */}
      {(phase === "importing" || phase === "done") && (
        <Card>
          <Label>{phase === "done" ? "Import finished" : "Importing…"}</Label>

          <p className="mt-4 text-[28px] font-semibold leading-none">
            {progress} / {toImport.length}
          </p>

          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-[#e6e5de]"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-[#322F7A] transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>

          {phase === "importing" && (
            <p className="mt-3 text-xs text-[#85858c]">
              Looking up covers for each book — keep this tab open.
            </p>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-2xl font-semibold">{counts.added}</p>
              <p className="text-xs text-[#85858c]">added</p>
            </div>
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-2xl font-semibold">{counts.updated}</p>
              <p className="text-xs text-[#85858c]">updated</p>
            </div>
            <div className="rounded-[20px] bg-white p-4">
              <p className="text-2xl font-semibold">{counts.skipped + counts.duplicate}</p>
              <p className="text-xs text-[#85858c]">already there</p>
            </div>
          </div>

          {problems.length > 0 && (
            <details className="mt-5 rounded-[20px] bg-white p-4 text-sm">
              <summary className="cursor-pointer font-semibold">
                {counts.failed > 0 ? `${counts.failed} failed · ` : ""}
                {problems.length} to review
              </summary>
              <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto text-xs text-[#6f6f76]">
                {problems.map((problem, index) => (
                  <li key={`${problem.title}-${index}`}>
                    <span className="font-medium text-[#34343b]">{problem.title}</span> — {problem.reason}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {phase === "done" && (
            <div className="mt-6 flex gap-3">
              <Link
                href="/dashboard/library"
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-white text-sm font-semibold ring-1 ring-[#deddd7]"
              >
                View library
              </Link>
              <Link
                href="/dashboard/recommendations"
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#C9E265] text-sm font-semibold text-[#25271e]"
              >
                Ask BookBot
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
