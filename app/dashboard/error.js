"use client";

export default function DashboardError({ reset }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F8FA] px-6 text-center text-[#2c3025]">
      <section className="max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#77766d]">
          Dashboard temporarily unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold">
          We couldn&apos;t load your reading data
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#77766d]">
          Firestore has temporarily reached its read quota. Your books are
          safe. Try again after the quota resets, or check the project usage
          in Firebase Console.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-full bg-[#322F7A] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
