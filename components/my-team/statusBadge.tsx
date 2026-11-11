import type { InjuryStatus } from "./playerDetail";

export function StatusBadge({ status }: { status: InjuryStatus }) {
  const map: Record<
    InjuryStatus,
    { label: string; dot: string; text: string }
  > = {
    Active: {
      label: "Active",
      dot: "bg-brand-cta",
      text: "text-brand-cta-dark",
    },
    Injured: {
      label: "Injured (O)",
      dot: "bg-red-500",
      text: "text-red-600",
    },
    "Day-to-Day": {
      label: "Day-to-Day",
      dot: "bg-amber-500",
      text: "text-amber-700",
    },
  };
  const s = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
