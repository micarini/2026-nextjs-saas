import { statusLabel } from "@/lib/books/statuses";

export default function StatusBadge({ status, currentPage, totalPages, className = "" }) {
  const label = statusLabel(status).toUpperCase();
  const progress =
    status === "reading" && totalPages
      ? Math.min(100, Math.round(((Number(currentPage) || 0) / totalPages) * 100))
      : null;
  const dark = status === "read";

  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-bold ${
        dark ? "bg-[#20180f] text-white" : "bg-white/90 text-[#6b5f4a]"
      } ${className}`}
    >
      {label}
      {progress !== null ? ` · ${progress}%` : ""}
    </span>
  );
}
