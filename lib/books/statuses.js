export const STATUSES = [
  {
    value: "to_read",
    label: "Want to read",
  },
  {
    value: "reading",
    label: "Currently reading",
  },
  {
    value: "read",
    label: "Finished",
  },
  {
    value: "dnf",
    label: "DNF",
  },
];

export function statusLabel(value) {
  // Compatibilidad con libros antiguos
  if (value === "abandoned") {
    return "DNF";
  }

  return (
    STATUSES.find((status) => status.value === value)?.label ||
    STATUSES[0].label
  );
}