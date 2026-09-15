// Parses the CSV that Goodreads gives you in My Books → Import and Export →
// Export Library. Runs in the browser (so the file never has to be uploaded
// whole) and has no dependencies.
//
// Goodreads quirks handled here:
// - ISBNs come wrapped as ="9780000000000" (an Excel formula) and are often empty.
// - "My Rating" 0 means "not rated", not zero stars.
// - Titles carry the series: "The Final Empire (Mistborn, #1)".
// - "Exclusive Shelf" is read / currently-reading / to-read, or a custom
//   exclusive shelf (people often make one for DNF).
// - Reviews can contain commas, quotes, newlines and <br/> tags.

export const GOODREADS_MAX_REVIEW_LENGTH = 5000;
export const GOODREADS_MAX_BATCH_SIZE = 20;

// RFC 4180 CSV: quoted fields, "" escapes, newlines inside quotes, CRLF.
export function parseCsv(text) {
  const input = String(text || "").replace(/^﻿/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ""));
}

export function cleanIsbn(value) {
  const digits = String(value || "").toUpperCase().replace(/[^0-9X]/g, "");
  return digits.length === 10 || digits.length === 13 ? digits : "";
}

// "The Final Empire (Mistborn, #1)" → { title: "The Final Empire", series: "Mistborn, #1" }
export function splitSeries(rawTitle) {
  const title = String(rawTitle || "").trim();
  const match = /^(.*\S)\s*\(([^()]*#\s*[\d.]+[^()]*)\)\s*$/.exec(title);

  if (!match) {
    return { title, series: "" };
  }

  return { title: match[1].trim(), series: match[2].trim() };
}

// Goodreads dates look like 2024/03/15 (sometimes 2024/03 or just 2024).
export function parseGoodreadsDate(value) {
  const match = /^(\d{4})(?:[/-](\d{1,2}))?(?:[/-](\d{1,2}))?/.exec(String(value || "").trim());

  if (!match) {
    return null;
  }

  const [, year, month = "1", day = "1"] = match;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00.000Z`;

  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
}

const DNF_SHELF = /(^|[-_ ])(dnf|did[-_ ]?not[-_ ]?finish|abandon|abandoned|gave[-_ ]?up)([-_ ]|$)/i;

export function mapGoodreadsStatus(exclusiveShelf, shelves = []) {
  const shelf = String(exclusiveShelf || "").trim().toLowerCase();

  if (shelf === "read") return "read";
  if (shelf === "currently-reading") return "reading";
  if (DNF_SHELF.test(shelf) || shelves.some((name) => DNF_SHELF.test(name))) return "dnf";

  return "to_read";
}

function htmlToText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, GOODREADS_MAX_REVIEW_LENGTH);
}

function toInt(value) {
  const number = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(number) ? number : null;
}

function toFloat(value) {
  const number = Number.parseFloat(String(value || "").trim());
  return Number.isFinite(number) ? number : null;
}

const REQUIRED_COLUMNS = ["Title", "Author", "Exclusive Shelf"];

// Returns { books, skipped } or throws if the file isn't a Goodreads export.
export function parseGoodreadsExport(text) {
  const rows = parseCsv(text);

  if (!rows.length) {
    throw new Error("The file is empty.");
  }

  const header = rows[0].map((name) => name.trim());
  const missing = REQUIRED_COLUMNS.filter((name) => !header.includes(name));

  if (missing.length) {
    throw new Error("This doesn't look like a Goodreads export (goodreads_library_export.csv).");
  }

  const column = (cells, name) => {
    const index = header.indexOf(name);
    return index === -1 ? "" : String(cells[index] ?? "").trim();
  };

  const books = [];
  let skipped = 0;

  for (const cells of rows.slice(1)) {
    const { title, series } = splitSeries(column(cells, "Title"));

    if (!title) {
      skipped += 1;
      continue;
    }

    const shelves = column(cells, "Bookshelves")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);

    const myRating = toInt(column(cells, "My Rating"));
    const status = mapGoodreadsStatus(column(cells, "Exclusive Shelf"), shelves);

    books.push({
      goodreadsId: column(cells, "Book Id"),
      title,
      series,
      author: column(cells, "Author"),
      additionalAuthors: column(cells, "Additional Authors")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
      isbn13: cleanIsbn(column(cells, "ISBN13")),
      isbn10: cleanIsbn(column(cells, "ISBN")),
      rating: myRating >= 1 && myRating <= 5 ? myRating : null,
      averageRating: toFloat(column(cells, "Average Rating")),
      totalPages: toInt(column(cells, "Number of Pages")),
      publishedYear:
        toInt(column(cells, "Original Publication Year")) || toInt(column(cells, "Year Published")),
      publisher: column(cells, "Publisher"),
      status,
      finishDate: status === "read" ? parseGoodreadsDate(column(cells, "Date Read")) : null,
      dateAdded: parseGoodreadsDate(column(cells, "Date Added")),
      shelves,
      review: htmlToText(column(cells, "My Review")),
      privateNotes: htmlToText(column(cells, "Private Notes")),
    });
  }

  return { books, skipped };
}
