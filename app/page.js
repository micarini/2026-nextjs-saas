import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { finishOnboarding, skipGoal } from "@/app/onboarding/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    const profile = await getCurrentUserProfile(user);

    if (profile?.onboardingCompletedAt) {
      redirect("/dashboard");
    }
  }

  return (
    <OnboardingFlow
      startAuthenticated={Boolean(user)}
      finishAction={finishOnboarding}
      skipAction={skipGoal}
    />
  );
}
