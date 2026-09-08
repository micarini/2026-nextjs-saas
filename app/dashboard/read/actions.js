"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserBook, updateUserBookProgress, updateUserBookSpotifyUrl } from "@/lib/books/books";
import { startSession, endSession } from "@/lib/books/sessions";

function parseOptionalInt(value) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function beginSession(bookId) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const book = await getUserBook(user.uid, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  return startSession(user.uid, bookId, { startPage: book.currentPage });
}

export async function finishSession(bookId, sessionId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const endPage = parseOptionalInt(formData.get("endPage"));
  const secondsElapsed = parseOptionalInt(formData.get("secondsElapsed")) || 0;
  const mood = String(formData.get("mood") || "") || null;

  await endSession(user.uid, bookId, sessionId, { endPage, mood, secondsElapsed });

  if (endPage !== null) {
    await updateUserBookProgress(user.uid, bookId, endPage);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/books/${bookId}`);
  revalidatePath("/dashboard/read");
}

export async function setBookSpotifyUrl(bookId, formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const spotifyUrl = String(formData.get("spotifyUrl") || "").trim();

  await updateUserBookSpotifyUrl(user.uid, bookId, spotifyUrl);
  revalidatePath("/dashboard/read");
}
