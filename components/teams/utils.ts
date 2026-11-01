import type { CapStatus } from "@/lib/store/features/leagueSlice";

export function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Number(Math.abs(value).toFixed(2));
  return `${sign}$${abs}M`;
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function capStatusTone(status: CapStatus) {
  if (status === "Under Cap") return "bg-brand-cta/15 text-brand-cta-dark";
  if (status === "Luxury Tax") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

export function capStatusTextTone(status: CapStatus) {
  if (status === "Under Cap") return "text-brand-cta-dark";
  if (status === "Luxury Tax") return "text-amber-600";
  return "text-red-500";
}

export function moneyTone(value: number) {
  return value < 0 ? "text-red-500" : "text-brand-dark";
}
