import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function MorePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentUserProfile(user);
  const isAdmin = profile?.user_type === "admin";

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-10 text-[#20180f]">
      <h1 className="font-serif text-3xl font-bold">More</h1>

      <div className="mt-6 grid gap-3">
        <div className="rounded-md border border-[#e7dfcf] bg-white p-4">
          <p className="text-sm font-semibold">Coming soon</p>
          <p className="mt-1 text-sm text-[#a89a7f]">
            Reading stats, custom shelves, and the AI librarian bot are on their way.
          </p>
        </div>

        {isAdmin ? (
          <Link
            href="/dashboard/users"
            className="rounded-md border border-[#e7dfcf] bg-white p-4 text-sm font-semibold"
          >
            Admin: manage users →
          </Link>
        ) : null}
      </div>

      <BottomNav active="more" />
    </main>
  );
}
