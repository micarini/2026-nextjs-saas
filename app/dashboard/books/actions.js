"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { createUserBook, deleteUserBook, updateUserBook } from "@/lib/books/books";
import { addBookNote, deleteBookNote } from "@/lib/books/notes";
import { GENRES } from "@/lib/books/genres";
import { STATUSES } from "@/lib/books/statuses";

function parseOptionalInt(value) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseDateInput(value) {
  const trimmed = String(value || "").trim();
  return trimmed ? new Date(trimmed) : null;
}

function parseBookForm(formData) {
  const title = String(formData.get("title") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const genre = String(formData.get("genre") || "");
  const status = String(formData.get("status") || "to_read");
  const ratingRaw = String(formData.get("rating") || "").trim();
  const published = formData.get("published") === "on";

  if (!title) {
    throw new Error("Title is required.");
  }

  if (!author) {
    throw new Error("Author is required.");
  }

  if (!GENRES.some((entry) => entry.value === genre)) {
    throw new Error("Choose a valid genre.");
  }

  if (!STATUSES.some((entry) => entry.value === status)) {
    throw new Error("Choose a valid status.");
  }

  return {
    title,
    author,
    genre,
    status,
    rating: ratingRaw ? Number(ratingRaw) : null,
    coverUrl: String(formData.get("coverUrl") || "").trim(),
    isbn: String(formData.get("isbn") || "").trim(),
    totalPages: parseOptionalInt(formData.get("totalPages")),
    currentPage: parseOptionalInt(formData.get("currentPage")),
    startDate: parseDateInput(formData.get("startDate")),
    finishDate: parseDateInput(formData.get("finishDate")),
    targetDate: parseDateInput(formData.get("targetDate")),
    published,
  };
}

export async function createBook(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await createUserBook(user.uid, parseBookForm(formData));
  revalidatePath("/");
  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

export async function updateBook(bookId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await updateUserBook(user.uid, bookId, parseBookForm(formData));
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

export async function deleteBook(bookId) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await deleteUserBook(user.uid, bookId);
  revalidatePath("/");
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/dashboard/books");
  redirect("/dashboard/books");
}

export async function addNote(bookId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const text = String(formData.get("text") || "").trim();

  if (!text) {
    throw new Error("Note text is required.");
  }

  await addBookNote(user.uid, bookId, {
    text,
    page: parseOptionalInt(formData.get("page")),
  });
  revalidatePath(`/dashboard/books/${bookId}/edit`);
}

export async function deleteNote(bookId, noteId) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await deleteBookNote(user.uid, bookId, noteId);
  revalidatePath(`/dashboard/books/${bookId}/edit`);
}
