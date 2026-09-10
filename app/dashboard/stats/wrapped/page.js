import { redirect } from "next/navigation";

import WrappedStory from "@/components/stats/WrappedStory";
import { listUserBooks } from "@/lib/books/books";
import { getCurrentUser } from "@/lib/firebase/session";
import { buildReadingStats } from "@/lib/stats/buildReadingStats";

export const dynamic = "force-dynamic";

export default async function WrappedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const books = await listUserBooks(user.uid);

  const year =
    new Date().getFullYear();

  const annualGoal =
    Number(
      user?.readingGoal ||
        user?.annualGoal ||
        user?.bookGoal
    ) || 12;

  const stats =
    buildReadingStats(
      books,
      year,
      annualGoal
    );

  return (
    <WrappedStory stats={stats} />
  );
}