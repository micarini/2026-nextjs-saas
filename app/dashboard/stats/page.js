import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import BottomNav from "@/components/nav/BottomNav";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 pb-24 pt-10 text-[#20180f]" style={{ colorScheme: "light" }}>
      <h1 className="font-serif text-3xl font-bold">Stats</h1>

      <div className="mt-6 rounded-md border border-[#e7dfcf] bg-white p-4">
        <p className="text-sm font-semibold">Coming soon</p>
        <p className="mt-1 text-sm text-[#a89a7f]">
          Reading stats, genre breakdowns, and your yearly reading challenge are on their way.
        </p>
      </div>

      <BottomNav active="stats" />
    </main>
  );
}
