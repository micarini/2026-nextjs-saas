"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/firebase/session";
import {
  setUsername,
  updateUserTopFour,
} from "@/lib/users/users";

export async function saveUsername(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await setUsername(
    user.uid,
    String(formData.get("username") || "")
  );

  revalidatePath("/dashboard/profile");
}

export async function saveTopFour(bookIds) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await updateUserTopFour(user.uid, bookIds);

  revalidatePath("/dashboard/profile");
}