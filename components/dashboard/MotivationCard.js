export default function MotivationCard() {
  return (
    <section className="rounded-[2rem] border border-gray-50 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">
          You&apos;re doing great!
        </h2>

        <p className="mt-1 text-sm font-medium leading-relaxed text-gray-500">
          Keep going and make a little progress with every page.
        </p>
      </div>

      <blockquote className="mt-6 border-t border-gray-100 pt-5 text-sm font-medium italic leading-relaxed text-gray-400">
        &quot;A reader lives a thousand lives before he dies.&quot;
      </blockquote>
    </section>
  );
}