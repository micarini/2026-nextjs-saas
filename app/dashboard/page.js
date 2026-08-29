import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-[#f6f1e7] px-5 py-10 text-[#20180f]">
      <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
    </main>
  );
}
