import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";
import { getUserBook } from "@/lib/books/books";

function serializeSession(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    startedAt: data.startedAt?.toDate?.().toISOString() || null,
    endedAt: data.endedAt?.toDate?.().toISOString() || null,
    secondsElapsed: typeof data.secondsElapsed === "number" ? data.secondsElapsed : 0,
    startPage: typeof data.startPage === "number" ? data.startPage : null,
    endPage: typeof data.endPage === "number" ? data.endPage : null,
    mood: data.mood || null,
  };
}

export async function getSessions(userId, bookId) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  const snapshot = await getDb()
    .collection("books")
    .doc(bookId)
    .collection("sessions")
    .get();

  return snapshot.docs
    .map(serializeSession)
    .sort((a, b) => new Date(b.startedAt || 0) - new Date(a.startedAt || 0));
}

export async function startSession(userId, bookId, { startPage }) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  const docRef = await getDb().collection("books").doc(bookId).collection("sessions").add({
    startedAt: FieldValue.serverTimestamp(),
    endedAt: null,
    secondsElapsed: 0,
    startPage: typeof startPage === "number" ? startPage : null,
    endPage: null,
    mood: null,
  });

  return docRef.id;
}

export async function endSession(userId, bookId, sessionId, { secondsElapsed, endPage, mood }) {
  const book = await getUserBook(userId, bookId);

  if (!book) {
    throw new Error("Book not found.");
  }

  await getDb()
    .collection("books")
    .doc(bookId)
    .collection("sessions")
    .doc(sessionId)
    .update({
      endedAt: FieldValue.serverTimestamp(),
      secondsElapsed: typeof secondsElapsed === "number" ? secondsElapsed : 0,
      endPage: typeof endPage === "number" ? endPage : null,
      mood: mood || null,
    });
}
