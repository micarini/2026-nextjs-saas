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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f7ff]">
      {/* Decorative background */}

      <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-pink-300/60 blur-3xl" />

      <div className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-violet-300/60 blur-3xl" />

      <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-sky-300/50 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-10">
        {/* Brand */}

        <div className="mb-8 text-center">

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-900">
            Your reading space.
          </h1>

          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-500">
            Keep track of everything you read, discover your next favorite
            book and make your reading journey your own.
          </p>
        </div>

        <LoginForm />

        <p className="mt-8 text-center text-xs leading-5 text-zinc-400">
          Your personal reading library, all in one place.
        </p>
      </div>
    </main>
  );
}