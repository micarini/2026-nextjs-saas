"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/firebase/session";
import { updateUserReadingDay } from "@/lib/users/users";

export async function changeReadingDay(date, color) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  await updateUserReadingDay(user.uid, date, color);
  revalidatePath("/dashboard/stats");
}
