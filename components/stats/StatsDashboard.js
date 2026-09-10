"use client";

import { useState } from "react";

import StatsCards from "@/components/stats/StatsCards";
import StatsWall from "@/components/stats/StatsWall";

export default function StatsDashboard({
  stats,
}) {
  const [view, setView] =
    useState("wall");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-8 pt-8 sm:px-6">

      <div className="mb-5 flex items-center justify-between gap-4">

        <h1 className="text-[38px] font-semibold tracking-[-0.05em] text-[#36366f] sm:text-[46px]">
          {stats.year}
        </h1>

        <div className="inline-flex rounded-full bg-[#e8e5ee] p-1">

          <button
            type="button"
            onClick={() =>
              setView("wall")
            }
            className={`
              rounded-full
              px-4
              py-2
              text-xs
              font-medium
              transition
              ${
                view === "wall"
                  ? "bg-[#36366f] text-white shadow-sm"
                  : "text-[#77737f]"
              }
            `}
          >
            Wall
          </button>

          <button
            type="button"
            onClick={() =>
              setView("cards")
            }
            className={`
              rounded-full
              px-4
              py-2
              text-xs
              font-medium
              transition
              ${
                view === "cards"
                  ? "bg-[#36366f] text-white shadow-sm"
                  : "text-[#77737f]"
              }
            `}
          >
            Cards
          </button>

        </div>

      </div>

      <div>
        {view === "wall" ? (
          <StatsWall stats={stats} />
        ) : (
          <StatsCards stats={stats} />
        )}
      </div>

    </div>
  );
}