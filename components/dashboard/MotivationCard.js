export default function MotivationCard() {
  return (
    <section className="rounded-3xl border border-[#e7dfcf] bg-white p-5">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ece8dd] text-2xl">
          🌿
        </div>

        <div>
          <h2 className="font-serif text-xl text-[#2c3025]">
            You&apos;re doing great!
          </h2>

          <p className="mt-1 text-sm leading-relaxed text-[#77766d]">
            Keep going and make a little progress with every page.
          </p>
        </div>
      </div>

      <blockquote className="mt-5 border-t border-[#ece8dd] pt-4 text-sm italic leading-relaxed text-[#77766d]">
        &quot;A reader lives a thousand lives before he dies.&quot;
      </blockquote>
    </section>
  );
}