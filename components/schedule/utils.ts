import type {
  MatchupTeam,
  MatchupStatus,
  ScheduleMatchup,
} from "@/lib/store/api/endpoints/standingsApi";

export function teamMap(teams: MatchupTeam[]) {
  return new Map(teams.map((team) => [team.id, team]));
}

export function statusMeta(status: MatchupStatus) {
  if (status === "live")
    return {
      label: "In Progress",
      short: "LIVE",
      dot: "bg-amber-500",
      text: "text-amber-600",
    };
  if (status === "final")
    return {
      label: "Final",
      short: "FINAL",
      dot: "bg-brand-cta",
      text: "text-brand-cta-dark",
    };
  return {
    label: "Upcoming",
    short: "",
    dot: "bg-brand-muted",
    text: "text-brand-muted",
  };
}

export function statusDetail(matchup: ScheduleMatchup) {
  if (matchup.status === "live") return "Ends Sunday 11:59 PM";
  if (matchup.status === "upcoming") return "Starts Monday";
  return null;
}

export function centerLabel(matchup: ScheduleMatchup) {
  if (matchup.status === "final") return "FINAL";
  if (matchup.status === "live") return "LIVE";
  return `WK ${matchup.week}`;
}

export function wonCategories(matchup: ScheduleMatchup, side: "home" | "away") {
  return side === "home"
    ? matchup.homeWonCategories
    : matchup.awayWonCategories;
}

export function resultFor(matchup: ScheduleMatchup, teamId: number | null) {
  if (matchup.status === "upcoming") return null;
  const isHome = matchup.homeId === teamId;
  const own = isHome ? matchup.homeScore : matchup.awayScore;
  const opp = isHome ? matchup.awayScore : matchup.homeScore;
  if (own === opp) return { outcome: "T" as const, own, opp };
  return { outcome: own > opp ? ("W" as const) : ("L" as const), own, opp };
}

export function formatCategory(value: number, percent?: boolean) {
  if (percent) {
    if (value >= 1) return "1.000";
    return value.toFixed(3).replace(/^0\./, ".");
  }
  return value.toLocaleString();
}

export function statLine(percent: boolean, value: number) {
  return formatCategory(value, percent);
}

/**
 * The week's dates, from the week itself.
 *
 * Used to be counted off a fixed anchor date, which only ever read right
 * for the one season the mock was written in.
 */
export function weekRange(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return "";

  const fmt = (value: string, withYear = false) =>
    new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
      ...(withYear ? { year: "numeric" } : {}),
    });

  return `${fmt(startDate)} — ${fmt(endDate, true)}`;
}
