import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/firebase/session";
import { getCurrentUserProfile } from "@/lib/users/users";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { finishOnboarding, skipGoal, checkOnboardingStatus } from "@/app/onboarding/actions";

export const dynamic = "force-dynamic";

function DatabaseUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F8FA] px-6 text-center text-[#2c3025]">
      <section className="max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#77766d]">
          Database temporarily unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold">
          We couldn&apos;t load your account
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#77766d]">
          Firebase has reached its current quota. Your account and books are
          safe. Please wait for the quota to reset before trying again.
        </p>
      </section>
    </main>
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    let profile;

    try {
      profile = await getCurrentUserProfile(user);
    } catch (error) {
      console.error("Home profile unavailable:", error);
      return <DatabaseUnavailable />;
    }

    if (profile?.onboardingCompletedAt) {
      redirect("/dashboard");
    }
  }

  return (
    <OnboardingFlow
      startAuthenticated={Boolean(user)}
      finishAction={finishOnboarding}
      skipAction={skipGoal}
      checkOnboardingStatusAction={checkOnboardingStatus}
    />
  );
}
