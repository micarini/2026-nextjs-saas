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

// Called right after a successful sign-in, before the cover-wall exit
// animation plays. Lets OnboardingFlow tell returning users (who already
// finished onboarding once) apart from brand-new accounts, so returning
// users skip straight to the dashboard instead of repeating the
// genres/goal steps.
export async function checkOnboardingStatus() {
  const user = await getCurrentUser();

  if (!user) {
    return { completed: false };
  }

  const profile = await getCurrentUserProfile(user);
  return { completed: Boolean(profile?.onboardingCompletedAt) };
}

export async function finishOnboarding(formData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
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
    redirect("/");
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
