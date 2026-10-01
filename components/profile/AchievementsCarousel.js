"use client";

import { useState } from "react";

function Achievement({
  number,
  title,
  description,
  progress,
  unlocked,
  accent = "indigo",
}) {
  const accents = {
    indigo: {
      card: "border-[#c8c8d7] bg-[#e9e8f2]",
      icon: "bg-[#36366f] text-[#d8ed70]",
      label: "text-[#55557d]",
      bar: "bg-[#36366f]",
    },
    lime: {
      card: "border-[#d2e88a] bg-[#f1f6d9]",
      icon: "bg-[#c8e75b] text-[#303427]",
      label: "text-[#64752b]",
      bar: "bg-[#8ba83e]",
    },
    pink: {
      card: "border-[#ecc2d5] bg-[#f9e9f0]",
      icon: "bg-[#e47cae] text-white",
      label: "text-[#a6507d]",
      bar: "bg-[#c45f91]",
    },
    sand: {
      card: "border-[#ead8b6] bg-[#fbf2df]",
      icon: "bg-[#d79a4b] text-white",
      label: "text-[#9b6b2d]",
      bar: "bg-[#c58232]",
    },
  };
  const palette = accents[accent] || accents.indigo;

  return (
    <div
      className={`rounded-3xl border p-4 ${
        unlocked
          ? palette.card
          : "border-[#deddd7] bg-[#efeee9]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold ${
            unlocked
              ? palette.icon
              : "bg-[#deddd7] text-[#8a8890]"
          }`}
        >
          {number}
        </div>

        <span
          className={`font-mono text-[9px] uppercase tracking-[0.16em] ${
            unlocked ? palette.label : "text-[#9a9891]"
          }`}
        >
          {unlocked ? "Unlocked" : "In progress"}
        </span>
      </div>

      <p className="mt-5 text-base font-semibold tracking-tight text-[#34343b]">
        {title}
      </p>

      <p className="mt-1 min-h-8 text-xs leading-relaxed text-[#85858c]">
        {description}
      </p>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#e7e5de]">
        <div
          className={`h-full rounded-full ${
            unlocked ? palette.bar : "bg-[#bdbbb3]"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function AchievementsCarousel({ achievements }) {
  const [selected, setSelected] = useState(0);
  const last = achievements.length - 1;
  const achievement = achievements[selected];

  if (!achievements.length) {
    return null;
  }

  return (
    <>
      <div className="mt-5 sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelected((value) => Math.max(0, value - 1))}
            disabled={selected === 0}
            aria-label="Previous achievement"
            className="rounded-full border border-[#dedbd2] px-3 py-1 text-sm text-[#36366f] disabled:opacity-30"
          >
            ←
          </button>

          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#8c8991]">
            {selected + 1} / {achievements.length}
          </span>

          <button
            type="button"
            onClick={() => setSelected((value) => Math.min(last, value + 1))}
            disabled={selected === last}
            aria-label="Next achievement"
            className="rounded-full border border-[#dedbd2] px-3 py-1 text-sm text-[#36366f] disabled:opacity-30"
          >
            →
          </button>
        </div>

        <div className="mt-3">
          <Achievement {...achievement} />
        </div>
      </div>

      <div className="mt-5 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
        {achievements.map((item) => (
          <Achievement key={item.title} {...item} />
        ))}
      </div>
    </>
  );
}
