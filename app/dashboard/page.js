import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import { listUserBooks } from "@/lib/books/books";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, books] = await Promise.all([
    getCurrentUserProfile(user),
    listUserBooks(user.uid),
  ]);

  const currentlyReading = books.filter((book) => book.status === "reading");

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-10 text-[#20180f]">
      <p className="font-serif text-[15px] text-[#6b5f4a]">Welcome back</p>
      <h1 className="mt-1 font-serif text-4xl font-bold">
        {profile?.displayName || "Reader"}
      </h1>

      <p className="mt-4 text-sm text-[#a89a7f]">
        {books.length} book{books.length === 1 ? "" : "s"} in your library
        {currentlyReading.length > 0 ? `, ${currentlyReading.length} currently reading` : ""}.
      </p>

      <Link
        href="/dashboard/books"
        className="mt-6 block rounded-full bg-[#20180f] py-3.5 text-center text-sm font-semibold text-white"
      >
        Go to my library
      </Link>

      <BottomNav active="home" />
    </main>
  );
}
