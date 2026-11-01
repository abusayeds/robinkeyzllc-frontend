import type { StandingRow } from "@/lib/store/features/leagueSlice";

export function pct(row: StandingRow) {
  const games = row.w + row.l;
  if (!games) return "0.0%";
  return `${((row.w / games) * 100).toFixed(1)}%`;
}

export function gamesBack(row: StandingRow, leader: StandingRow) {
  if (row.id === leader.id) return "—";
  const gb = (leader.w - row.w + (row.l - leader.l)) / 2;
  return gb.toFixed(1);
}

export function pctTone(row: StandingRow) {
  const value = row.w / (row.w + row.l);
  if (value >= 0.5) return "text-brand-cta-dark";
  if (value < 0.45) return "text-red-500";
  return "text-brand-dark";
}

export function byWins(a: StandingRow, b: StandingRow) {
  return b.w - a.w || a.l - b.l;
}
