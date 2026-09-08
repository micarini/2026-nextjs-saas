"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile, completeOnboarding } from "@/lib/users/users";

function parseGoal(value) {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export async function finishOnboarding(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Make sure the Firestore doc exists before .update()-ing it — a brand
  // new Google sign-in reaches this action before anything else has
  // touched their profile.
  await getCurrentUserProfile(user);

  await completeOnboarding(user.uid, {
    genres: formData.getAll("genres"),
    yearlyGoal: parseGoal(formData.get("goal")),
  });

  redirect("/dashboard");
}

export async function skipGoal(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  await getCurrentUserProfile(user);

  // "Skip for now" only skips the goal step — genres picked on the
  // previous step are still saved, and onboarding still counts as done.
  await completeOnboarding(user.uid, {
    genres: formData.getAll("genres"),
    yearlyGoal: null,
  });

  redirect("/dashboard");
}
