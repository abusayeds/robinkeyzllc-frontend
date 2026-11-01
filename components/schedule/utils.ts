import type {
  LeagueTeam,
  MatchupStatus,
  ScheduleMatchup,
} from "@/lib/store/features/leagueSlice";

export function teamMap(teams: LeagueTeam[]) {
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
  if (!matchup.categories) return [];
  return matchup.categories
    .filter((c) => (side === "home" ? c.homeWins === true : c.homeWins === false))
    .map((c) => c.label);
}

export function resultFor(matchup: ScheduleMatchup, teamId: string) {
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

export function weekRange(week: number) {
  const anchor = new Date(2025, 4, 12); // Week 20 starts Mon May 12, 2025
  const start = new Date(anchor);
  start.setDate(anchor.getDate() + (week - 20) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date, withYear = false) =>
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(withYear ? { year: "numeric" } : {}),
    });
  return `${fmt(start)} — ${fmt(end, true)}`;
}
