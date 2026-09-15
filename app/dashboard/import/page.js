import Link from "next/link";
import { redirect } from "next/navigation";

import BottomNav from "@/components/nav/BottomNav";
import GoodreadsImport from "@/components/import/GoodreadsImport";
import { getCurrentUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#f4f3ee] pb-28 text-[#34343b]" style={{ colorScheme: "light" }}>
      <div className="mx-auto max-w-2xl px-5 pt-8">
        <Link href="/dashboard/profile" className="text-sm text-[#85858c]">
          ← Back to profile
        </Link>

        <p className="mt-6 font-mono text-xs uppercase tracking-[0.25em] text-[#74747b]">
          Import
        </p>

        <h1 className="mt-2 text-[34px] font-semibold leading-[1.05] tracking-tight">
          Bring your Goodreads library
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-[#6f6f76]">
          Your shelves, star ratings, read dates and reviews come along — and BookBot uses them
          to recommend your next book.
        </p>

        <GoodreadsImport />
      </div>

      <BottomNav active="profile" />
    </main>
  );
}
