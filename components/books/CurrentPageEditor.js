"use client";

import { useState, useTransition } from "react";

export default function CurrentPageEditor({ currentPage, totalPages, action }) {
  const [value, setValue] = useState(currentPage ?? "");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

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

        {isPending ? <span className="text-xs text-gray-400">Saving...</span> : null}
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
