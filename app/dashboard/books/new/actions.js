"use server";

import { getCurrentUser } from "@/lib/firebase/session";
import { searchBookCovers } from "@/lib/books/search";

export async function searchBooksAction(query) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in to search books.");
  }

  const trimmed = String(query || "").trim();

  if (!trimmed) {
    return [];
  }

  return searchBookCovers(trimmed);
}
