export const STATUSES = [
  { value: "to_read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "read", label: "Read" },
  { value: "abandoned", label: "Abandoned" },
];

export function statusLabel(value) {
  return STATUSES.find((status) => status.value === value)?.label || STATUSES[0].label;
}
