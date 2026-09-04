"use client";

import { useState, useTransition } from "react";
import { STATUSES } from "@/lib/books/statuses";

export default function ChangeStatusModal({ currentStatus, action }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handlePick(status) {
    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("status", status);
        await action(formData);
        setOpen(false);
      } catch (err) {
        setError(err.message || "Could not update the status.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-14 w-full items-center justify-center rounded-2xl bg-[#20180f] text-base font-semibold text-white transition hover:bg-[#33261a]"
      >
        Change status
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl bg-white p-5 pb-8 sm:rounded-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-4 text-center text-sm font-semibold text-[#77766d]">
              Set reading status
            </p>

            <div className="grid gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => handlePick(status.value)}
                  className={`flex h-12 items-center justify-between rounded-xl border px-4 text-sm font-medium transition disabled:opacity-60 ${
                    status.value === currentStatus
                      ? "border-[#20180f] bg-[#f8f8fa] text-[#20180f]"
                      : "border-[#e7e3da] text-[#2c3025] hover:bg-[#f8f8fa]"
                  }`}
                >
                  {status.label}
                  {status.value === currentStatus ? <span>✓</span> : null}
                </button>
              ))}
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 h-11 w-full text-sm font-medium text-[#77766d]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
