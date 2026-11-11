import type { Tier } from "@/lib/store/api/endpoints/salaryApi";
import type { TeamIntelStatus } from "@/lib/store/api/endpoints/teamApi";

/**
 * One row of the Teams page, assembled from the three endpoints that own the
 * pieces: the team itself, its cap sheet, and the standings table.
 *
 * Built in one place so the card and the modal cannot disagree about a team.
 */
export type LeagueTeamRow = {
  id: number;
  name: string;
  abbr: string;
  logo: string | null;
  owner: string;
  conference: "East" | "West";
  isMine: boolean;
  record: string;
  leagueRank: number;
  rosterCount: number;
  rosterMax: number;
  payroll: number;
  deadMoney: number;
  teamSalary: number;
  tier: Tier;
  tierLabel: string;
  /** Room left under each threshold. Negative means the team is over it. */
  capSpace: number;
  taxRoom: number;
  firstApronRoom: number;
  secondApronRoom: number;
  /** League Intel, as that team's own owner set it. Null when unset. */
  intelStatus: TeamIntelStatus | null;
};

/** `$12.3M` from a figure in dollars, which is how the API sends money. */
export function money(value: number) {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}K`;
  return `${sign}$${abs}`;
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/**
 * The card's three colours, from Article 3's six tiers.
 *
 * Calm under the cap, amber once the tax is in play, red at an apron — the
 * same reading the commissioner's cap sheet gives.
 */
export function capStatusTone(tier: Tier) {
  if (tier === "belowCap") return "bg-brand-cta/15 text-brand-cta-dark";
  if (tier === "capNotSet") return "bg-brand-soft text-brand-muted";
  if (tier === "overCap") return "bg-amber-100 text-amber-700";
  if (tier === "luxuryTax") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

export function capStatusTextTone(tier: Tier) {
  if (tier === "belowCap") return "text-brand-cta-dark";
  if (tier === "capNotSet") return "text-brand-muted";
  if (tier === "overCap" || tier === "luxuryTax") return "text-amber-600";
  return "text-red-500";
}

export function moneyTone(value: number) {
  return value < 0 ? "text-red-500" : "text-brand-dark";
}
