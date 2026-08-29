import { FieldValue } from "firebase-admin/firestore";
import { getDb } from "@/lib/firebase/firestore";

const COLLECTION = "books";

function serializeBook(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    title: data.title || "",
    author: data.author || "",
    genre: data.genre || "fantasy",
    status: data.status || "to_read",
    rating: typeof data.rating === "number" ? data.rating : null,
    coverUrl: data.coverUrl || "",
    isbn: data.isbn || "",
    totalPages: typeof data.totalPages === "number" ? data.totalPages : null,
    currentPage: typeof data.currentPage === "number" ? data.currentPage : null,
    startDate: data.startDate?.toDate?.().toISOString() || null,
    finishDate: data.finishDate?.toDate?.().toISOString() || null,
    targetDate: data.targetDate?.toDate?.().toISOString() || null,
    published: Boolean(data.published),
    createdAt: data.createdAt?.toDate?.().toISOString() || null,
    updatedAt: data.updatedAt?.toDate?.().toISOString() || null,
  };
}

function byNewest(a, b) {
  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
}

export async function listUserBooks(userId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map(serializeBook).sort(byNewest);
}

export async function listPublishedBooks() {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("published", "==", true)
    .get();

  return snapshot.docs.map(serializeBook).sort(byNewest);
}

export async function listPublishedBooksByUser(userId) {
  const snapshot = await getDb()
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .where("published", "==", true)
    .get();

  return snapshot.docs.map(serializeBook).sort(byNewest);
}

export async function getUserBook(userId, bookId) {
  const doc = await getDb().collection(COLLECTION).doc(bookId).get();

  if (!doc.exists) {
    return null;
  }

  const book = serializeBook(doc);

  return book.userId === userId ? book : null;
}

export async function getPublishedBook(bookId) {
  const doc = await getDb().collection(COLLECTION).doc(bookId).get();

  if (!doc.exists) {
    return null;
  }

  const book = serializeBook(doc);

  return book.published ? book : null;
}

export async function createUserBook(userId, data) {
  const now = FieldValue.serverTimestamp();

  const docRef = await getDb()
    .collection(COLLECTION)
    .add({
      userId,
      title: data.title,
      author: data.author,
      genre: data.genre,
      status: data.status,
      rating: data.rating,
      coverUrl: data.coverUrl,
      isbn: data.isbn,
      totalPages: data.totalPages,
      currentPage: data.currentPage,
      startDate: data.startDate,
      finishDate: data.finishDate,
      targetDate: data.targetDate,
      published: data.published,
      createdAt: now,
      updatedAt: now,
    });

  return docRef.id;
}

export async function updateUserBook(userId, bookId, data) {
  const docRef = getDb().collection(COLLECTION).doc(bookId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Book not found.");
  }

  await docRef.update({
    title: data.title,
    author: data.author,
    genre: data.genre,
    status: data.status,
    rating: data.rating,
    coverUrl: data.coverUrl,
    isbn: data.isbn,
    totalPages: data.totalPages,
    currentPage: data.currentPage,
    startDate: data.startDate,
    finishDate: data.finishDate,
    targetDate: data.targetDate,
    published: data.published,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function deleteUserBook(userId, bookId) {
  const docRef = getDb().collection(COLLECTION).doc(bookId);
  const doc = await docRef.get();

  if (!doc.exists || doc.data().userId !== userId) {
    throw new Error("Book not found.");
  }

  const notesSnapshot = await docRef.collection("notes").get();
  const batch = getDb().batch();
  notesSnapshot.docs.forEach((noteDoc) => batch.delete(noteDoc.ref));
  await batch.commit();

  await docRef.delete();
}
