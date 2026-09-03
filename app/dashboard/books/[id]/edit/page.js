import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserBook } from "@/lib/books/books";
import { listBookNotes } from "@/lib/books/notes";
import BookForm from "@/components/books/BookForm";
import NotesList from "@/components/books/NotesList";
import BottomNav from "@/components/nav/BottomNav";
import { updateBook, deleteBook, addNote, deleteNote } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditBookPage({ params }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const book = await getUserBook(user.uid, id);

  if (!book) {
    notFound();
  }

  const notes = await listBookNotes(user.uid, id);

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]" style={{ colorScheme: "light" }}>
      <div className="px-5 pt-8">
        <Link href="/dashboard" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold">Edit book</h1>
      </div>

      <div className="px-5 py-6">
        <BookForm
          action={updateBook.bind(null, book.id)}
          book={book}
          submitLabel="Save changes"
          allowMetadataEditing
        />

        <form action={deleteBook.bind(null, book.id)} className="mt-4">
          <button
            type="submit"
            className="h-11 w-full rounded-md border border-red-300 text-sm font-semibold text-red-700"
          >
            Delete book
          </button>
        </form>

        <div className="mt-8">
          <h2 className="font-serif text-xl font-bold">Notes</h2>
          <NotesList
            notes={notes}
            addNoteAction={addNote.bind(null, book.id)}
            deleteNoteAction={deleteNote.bind(null, book.id)}
          />
        </div>
      </div>

      <BottomNav active="home" />
    </main>
  );
}
