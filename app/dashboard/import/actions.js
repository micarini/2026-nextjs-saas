"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/lib/firebase/session";
import { importGoodreadsBatch } from "@/lib/import/goodreadsImport";
import { GOODREADS_MAX_BATCH_SIZE, GOODREADS_MAX_REVIEW_LENGTH } from "@/lib/import/goodreadsCsv";

const STATUSES = new Set(["read", "reading", "to_read", "dnf"]);

function text(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function intOrNull(value, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// Server actions are public endpoints — re-validate everything the browser sends.
function sanitizeRow(row) {
  const title = text(row?.title, 300);

  if (!title) {
    return null;
  }

  const status = STATUSES.has(row?.status) ? row.status : "to_read";

  return {
    goodreadsId: text(row?.goodreadsId, 40),
    title,
    author: text(row?.author, 200),
    additionalAuthors: (Array.isArray(row?.additionalAuthors) ? row.additionalAuthors : [])
      .slice(0, 10)
      .map((name) => text(name, 200))
      .filter(Boolean),
    isbn13: /^\d{13}$/.test(row?.isbn13 || "") ? row.isbn13 : "",
    isbn10: /^\d{9}[\dX]$/.test(row?.isbn10 || "") ? row.isbn10 : "",
    rating: intOrNull(row?.rating, 1, 5),
    averageRating: Number.isFinite(Number(row?.averageRating)) && row?.averageRating !== null
      ? Math.min(5, Math.max(0, Number(row.averageRating)))
      : null,
    totalPages: intOrNull(row?.totalPages, 1, 20000),
    status,
    finishDate: status === "read" ? isoOrNull(row?.finishDate) : null,
    dateAdded: isoOrNull(row?.dateAdded),
    shelves: (Array.isArray(row?.shelves) ? row.shelves : []).slice(0, 30).map((name) => text(name, 80)),
    review: text(row?.review, GOODREADS_MAX_REVIEW_LENGTH),
    privateNotes: text(row?.privateNotes, GOODREADS_MAX_REVIEW_LENGTH),
  };
}

export async function importGoodreadsBatchAction(rows, options = {}) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to import books.");
  }

  if (!Array.isArray(rows) || rows.length > GOODREADS_MAX_BATCH_SIZE) {
    throw new Error("Invalid import batch.");
  }

  const books = rows.map(sanitizeRow).filter(Boolean);

  if (!books.length) {
    return [];
  }

  return importGoodreadsBatch(user.uid, books, {
    includeReviews: options?.includeReviews !== false,
  });
}

export async function finishGoodreadsImportAction() {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  revalidatePath("/");
  revalidatePath("/dashboard", "layout");
}
