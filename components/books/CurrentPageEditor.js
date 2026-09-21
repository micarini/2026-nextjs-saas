"use client";

import { useEffect, useState, useTransition } from "react";

export default function CurrentPageEditor({ currentPage, totalPages, action, onCompleted }) {
  const [value, setValue] = useState(currentPage ?? "");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const progress =
    totalPages > 0
      ? Math.min(100, Math.round(((Number(value) || 0) / totalPages) * 100))
      : null;

  useEffect(() => {
    if (!dirty) {
      setValue(currentPage ?? "");
    }
  }, [currentPage, dirty]);

  function handleBlur() {
    if (!dirty) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("currentPage", value);
        await action(formData);
        setDirty(false);
        if (
          Number(value) === Number(totalPages) &&
          Number(currentPage) !== Number(totalPages)
        ) {
          onCompleted?.();
        }
      } catch (err) {
        setError(err.message || "Could not save your progress.");
      }
    });
  }

  return (
    <div className="mt-4 flex flex-col items-center gap-1">
      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-gray-500">Page</span>

        <input
          type="number"
          min="0"
          max={totalPages || undefined}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setDirty(true);
          }}
          onBlur={handleBlur}
          disabled={isPending}
          className="h-9 w-16 rounded-lg border border-[#e7e3da] px-2 text-center font-semibold text-gray-900 outline-none focus:border-gray-900 disabled:opacity-60"
        />

        <span className="text-gray-500">of {totalPages || "?"}</span>
        {progress !== null ? (
          <span className="font-semibold text-[#4f6549]">{progress}%</span>
        ) : null}

        {isPending ? <span className="text-xs text-gray-400">Saving...</span> : null}
      </div>

      {progress !== null ? (
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[#e7e3da]">
          <div
            className="h-full rounded-full bg-[#4f6549] transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
