"use client";

import { useEffect, useRef, useState, useTransition } from "react";

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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 103 }, (_, i) => CURRENT_YEAR + 2 - i);

const FIELDS = [
  { key: "startDate", label: "Started", accent: "#60a5fa" },
  { key: "finishDate", label: "Finished", accent: "#34d399" },
  { key: "targetDate", label: "Target", accent: "#fbbf24" },
];

function toParts(value) {
  if (!value) {
    return { year: "", month: "", day: "" };
  }

  const [y, m, d] = value.slice(0, 10).split("-");
  return {
    year: y || "",
    month: m ? String(Number(m)) : "",
    day: d ? String(Number(d)) : "",
  };
}

function toISO({ year, month, day }) {
  if (!year || !month || !day) {
    return "";
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatSummary(value) {
  if (!value) {
    return "—";
  }

  const { year, month, day } = toParts(value);

  if (!year || !month || !day) {
    return "—";
  }

  return `${MONTHS[Number(month) - 1].slice(0, 3)} ${day}, ${year}`;
}

function DateChooser({ field, value, onChange, disabled }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: field.accent }} />
        <span className="text-sm font-bold text-[#20180f]">{field.label}</span>
        {value.year || value.month || value.day ? (
          <button
            type="button"
            onClick={() => onChange({ year: "", month: "", day: "" })}
            disabled={disabled}
            className="ml-auto text-xs font-semibold text-[#a09c8f] transition hover:text-red-500"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <select
          value={value.month}
          onChange={(event) => onChange({ ...value, month: event.target.value })}
          disabled={disabled}
          className="h-11 rounded-xl border-2 px-2 text-sm font-semibold text-[#20180f] outline-none transition disabled:opacity-60"
          style={{ borderColor: `${field.accent}55` }}
        >
          <option value="">Month</option>
          {MONTHS.map((name, index) => (
            <option key={name} value={index + 1}>
              {name}
            </option>
          ))}
        </select>

        <select
          value={value.day}
          onChange={(event) => onChange({ ...value, day: event.target.value })}
          disabled={disabled}
          className="h-11 rounded-xl border-2 px-2 text-sm font-semibold text-[#20180f] outline-none transition disabled:opacity-60"
          style={{ borderColor: `${field.accent}55` }}
        >
          <option value="">Day</option>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>

        <select
          value={value.year}
          onChange={(event) => onChange({ ...value, year: event.target.value })}
          disabled={disabled}
          className="h-11 rounded-xl border-2 px-2 text-sm font-semibold text-[#20180f] outline-none transition disabled:opacity-60"
          style={{ borderColor: `${field.accent}55` }}
        >
          <option value="">Year</option>
          {YEARS.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function BookDatesEditor({ startDate, finishDate, targetDate, action }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    startDate: toParts(startDate),
    finishDate: toParts(finishDate),
    targetDate: toParts(targetDate),
  });
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function openModal() {
    setValues({
      startDate: toParts(startDate),
      finishDate: toParts(finishDate),
      targetDate: toParts(targetDate),
    });
    setError("");
    setOpen(true);
  }

  function handleSave() {
    setError("");

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("startDate", toISO(values.startDate));
        formData.set("finishDate", toISO(values.finishDate));
        formData.set("targetDate", toISO(values.targetDate));
        await action(formData);
        setOpen(false);
      } catch (err) {
        setError(err.message || "Could not save dates.");
      }
    });
  }

  const hasAnyDate = [startDate, finishDate, targetDate].some(Boolean);

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={openModal}
        className="flex w-full items-center justify-between rounded-2xl border border-[#e7e3da] bg-white px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-50/40"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-[#20180f]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a09c8f" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="3" />
            <path d="M3 9h18M8 2v4M16 2v4" />
          </svg>
          Add or edit dates
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a09c8f" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {hasAnyDate ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-[#77766d]">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: FIELDS[0].accent }} />
            Started {formatSummary(startDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: FIELDS[1].accent }} />
            Finished {formatSummary(finishDate)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: FIELDS[2].accent }} />
            Target {formatSummary(targetDate)}
          </span>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0">
          <div
            ref={modalRef}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-[#20180f]">Reading dates</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full text-[#a09c8f] transition hover:bg-[#f8f8fa] hover:text-[#20180f]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-5 space-y-5">
              {FIELDS.map((field) => (
                <DateChooser
                  key={field.key}
                  field={field}
                  value={values[field.key]}
                  disabled={isPending}
                  onChange={(next) => setValues((prev) => ({ ...prev, [field.key]: next }))}
                />
              ))}
            </div>

            {error ? <p className="mt-4 text-xs text-red-600">{error}</p> : null}

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="mt-6 h-12 w-full rounded-2xl bg-amber-400 text-sm font-extrabold text-[#20180f] shadow-[0_8px_20px_rgba(251,191,36,0.3)] transition hover:bg-amber-500 disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save dates"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
