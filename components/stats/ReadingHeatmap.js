"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COLOR_OPTIONS = [
  { color: "#36366f", label: "Read", description: "I read this day." },
  { color: "#c8e75b", label: "Focused", description: "I had a longer or focused session." },
  { color: "#e47cae", label: "Favorite", description: "A memorable reading day." },
  { color: "#e8e6ee", label: "No reading", description: "Clear this day." },
];

function pad(value) {
  return String(value).padStart(2, "0");
}

export default function ReadingHeatmap({
  year,
  activityDays = [],
  updateReadingDayAction,
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].color);
  const [mobileMonth, setMobileMonth] = useState(new Date().getMonth());
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [localActivity, setLocalActivity] = useState(() => {
    const map = new Map();

    for (const entry of activityDays) {
      const date = typeof entry === "string" ? entry : entry.date;
      const color = typeof entry === "string" ? COLOR_OPTIONS[0].color : entry.color || COLOR_OPTIONS[0].color;

      if (date) {
        map.set(date, color);
      }
    }

    return map;
  });

  useEffect(() => {
    const nextMap = new Map();

    for (const entry of activityDays) {
      const date = typeof entry === "string" ? entry : entry.date;
      const color = typeof entry === "string" ? COLOR_OPTIONS[0].color : entry.color || COLOR_OPTIONS[0].color;

      if (date) {
        nextMap.set(date, color);
      }
    }

    setLocalActivity(nextMap);
  }, [activityDays]);

  function toggleDay(date) {
    if (!editing || !updateReadingDayAction || isPending) {
      return;
    }

    const currentColor = localActivity.get(date);
    const nextColor = selectedColor === "#e8e6ee" ? "" : selectedColor;
    const effectiveNextColor = currentColor === nextColor ? "" : nextColor;

    setLocalActivity((previous) => {
      const next = new Map(previous);

      if (effectiveNextColor) {
        next.set(date, effectiveNextColor);
      } else {
        next.delete(date);
      }

      return next;
    });

    setIsPending(true);
    setError("");

    Promise.resolve(updateReadingDayAction(date, effectiveNextColor))
      .then(() => router.refresh())
      .catch((err) => {
        setLocalActivity((previous) => {
          const next = new Map(previous);

          if (currentColor) {
            next.set(date, currentColor);
          } else {
            next.delete(date);
          }

          return next;
        });

        setError(err.message || "Could not save this reading day.");
      })
      .finally(() => setIsPending(false));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#77767f]">
          {editing ? "Choose a meaning, then tap a day." : "Days marked from completed reading sessions."}
        </p>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="shrink-0 rounded-full border border-[#dedbd2] px-3 py-1.5 text-xs font-semibold text-[#36366f]"
        >
          {editing ? "Done" : "✎ Edit"}
        </button>
      </div>

      {editing ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.color}
              type="button"
              onClick={() => setSelectedColor(option.color)}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left ${
                selectedColor === option.color
                  ? "border-[#36366f] bg-[#f4f2fa]"
                  : "border-[#dedbd2] bg-white"
              }`}
            >
              <span
                className="h-5 w-5 shrink-0 rounded-md"
                style={{ backgroundColor: option.color }}
              />
              <span>
                <span className="block text-[11px] font-semibold text-[#36366f]">{option.label}</span>
                <span className="block text-[10px] text-[#8c8991]">{option.description}</span>
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => setMobileMonth((value) => Math.max(0, value - 1))}
          disabled={mobileMonth === 0}
          aria-label="Previous month"
          className="rounded-full border border-[#dedbd2] px-3 py-1 text-sm text-[#36366f] disabled:opacity-30"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-[#77767f]">
          {MONTHS[mobileMonth]} · {mobileMonth + 1} / 12
        </span>
        <button
          type="button"
          onClick={() => setMobileMonth((value) => Math.min(11, value + 1))}
          disabled={mobileMonth === 11}
          aria-label="Next month"
          className="rounded-full border border-[#dedbd2] px-3 py-1 text-sm text-[#36366f] disabled:opacity-30"
        >
          →
        </button>
      </div>

      <div className="sm:hidden">
        {renderMonth(mobileMonth)}
      </div>

      <div className="hidden gap-5 sm:grid sm:grid-cols-2">
        {MONTHS.map((month, monthIndex) => renderMonth(monthIndex))}
      </div>
    </div>
  );

  function renderMonth(monthIndex) {
    const month = MONTHS[monthIndex];
          const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
          const firstDay = new Date(year, monthIndex, 1).getDay();
          const cells = Array.from({ length: firstDay + daysInMonth });

          return (
            <div key={month}>
              <p className="mb-2 text-xs font-semibold text-[#77767f]">{month}</p>
              <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[9px] text-[#aaa6ad]">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((_, index) => {
                  const day = index - firstDay + 1;
                  if (day < 1) {
                    return <span key={`empty-${index}`} className="aspect-square" />;
                  }

                  const key = `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
                  const color = localActivity.get(key);

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!editing || isPending}
                      onClick={() => toggleDay(key)}
                      aria-label={`${key}${color ? ", reading day" : ", no reading"}`}
                      className={`aspect-square min-h-8 rounded-md border text-[10px] transition ${
                        editing ? "cursor-pointer hover:ring-2 hover:ring-[#36366f]/40" : "cursor-default"
                      } ${color ? "font-semibold text-white" : "border-transparent text-[#8c8991]"}`}
                      style={{
                        backgroundColor: color || "#f1eff3",
                        borderColor: color || "transparent",
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          );
  }
}
