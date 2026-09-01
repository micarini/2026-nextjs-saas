import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/firebase/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAFAFA]">
      {/* Decorative background */}

      <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl pointer-events-none" />

      <div className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl pointer-events-none" />

      <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-amber-200/30 blur-3xl pointer-events-none" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-5 py-10 z-10">
        {/* Brand */}

        <div className="mb-10 text-center">
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-gray-900">
            Your reading space.
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm font-medium leading-6 text-gray-500">
            Keep track of everything you read, discover your next favorite
            book and make your reading journey your own.
          </p>
        </div>

        <LoginForm />

      </div>
    </main>
  );
}