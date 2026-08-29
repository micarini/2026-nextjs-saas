import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import AddBookFlow from "@/components/books/AddBookFlow";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function NewBookPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] pb-24 text-[#20180f]" style={{ colorScheme: "light" }}>
      <div className="px-5 pt-8">
        <Link href="/dashboard/books" className="text-sm text-[#a89a7f]">
          ← Back to library
        </Link>
        <h1 className="mt-3 font-serif text-3xl font-bold">Add a book</h1>
      </div>

      <div className="px-5 py-6">
        <AddBookFlow />
      </div>

      <BottomNav active="add" />
    </main>
  );
}
