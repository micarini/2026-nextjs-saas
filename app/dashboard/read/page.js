import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getUserBook, listUserBooks } from "@/lib/books/books";
import { toSpotifyEmbedUrl, DEFAULT_FOCUS_PLAYLIST_URL } from "@/lib/spotify";
import FocusMode from "@/components/read/FocusMode";
import BottomNav from "@/components/nav/BottomNav";
import { beginSession, finishSession, setBookSpotifyUrl } from "./actions";
import { addNote } from "../books/actions";

export const dynamic = "force-dynamic";

export default async function FocusModePage({ searchParams }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { book: bookId } = await searchParams;

  const book = bookId
    ? await getUserBook(user.uid, bookId)
    : (await listUserBooks(user.uid)).find((b) => b.status === "reading") || null;

  if (!book) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[#1C1B1F] px-6 text-center text-white">
        <p className="font-[family-name:var(--font-jetbrains)] text-[10.5px] uppercase tracking-[0.14em] text-white/50">
          Focus mode
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-bricolage)] text-2xl font-bold">
          Nothing in progress yet.
        </h1>
        <p className="mt-2 max-w-xs font-[family-name:var(--font-instrument)] text-sm text-white/60">
          Mark a book as &quot;Currently reading&quot; to start a focus session.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 rounded-full bg-[#C9E265] px-6 py-3 font-[family-name:var(--font-instrument)] text-sm font-semibold text-[#1C1B1F]"
        >
          Back to library
        </Link>
        <BottomNav active="read" />
      </main>
    );
  }

  const hasOwnSpotifyUrl = Boolean(toSpotifyEmbedUrl(book.spotifyUrl));
  const spotifyEmbedUrl = toSpotifyEmbedUrl(book.spotifyUrl) || toSpotifyEmbedUrl(DEFAULT_FOCUS_PLAYLIST_URL);

  return (
    <>
      <FocusMode
        book={book}
        spotifyEmbedUrl={spotifyEmbedUrl}
        hasOwnSpotifyUrl={hasOwnSpotifyUrl}
        beginSessionAction={beginSession.bind(null, book.id)}
        finishSessionAction={finishSession.bind(null, book.id)}
        setSpotifyUrlAction={setBookSpotifyUrl.bind(null, book.id)}
        addNoteAction={addNote.bind(null, book.id)}
      />
      <BottomNav active="read" />
    </>
  );
}
