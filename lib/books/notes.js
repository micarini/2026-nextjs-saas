import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { getUserBook } from "@/lib/books/books";

function serializeNote(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    text: data.text || "",
    page: typeof data.page === "number" ? data.page : null,
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
  };
}

export async function listBookNotes(userId, bookId) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  const snapshot = await getDb()
    .collection("books")
    .doc(bookId)
    .collection("notes")
    .get();

  return snapshot.docs
    .map(serializeNote)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export async function addBookNote(userId, bookId, data) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  await getDb().collection("books").doc(bookId).collection("notes").add({
    text: data.text,
    page: data.page,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteBookNote(userId, bookId, noteId) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  await getDb()
    .collection("books")
    .doc(bookId)
    .collection("notes")
    .doc(noteId)
    .delete();
}
