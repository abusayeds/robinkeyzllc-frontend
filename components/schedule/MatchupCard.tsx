import type {
  LeagueTeam,
  ScheduleMatchup,
} from "@/lib/store/features/leagueSlice";
import TeamLogo from "@/components/ui/TeamLogo";
import {
  centerLabel,
  resultFor,
  statusDetail,
  statusMeta,
  wonCategories,
} from "./utils";

function TeamBlock({
  team,
  align,
}: {
  team?: LeagueTeam;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 sm:gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo
        name={team?.name ?? "TBD"}
        src={team?.logo}
        className="h-8 w-8 shrink-0 sm:h-10 sm:w-10 md:h-11 md:w-11"
      />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-brand-dark sm:text-sm">
          {team?.name ?? "TBD"}
        </p>
        <p className="truncate text-[11px] text-brand-muted sm:text-xs">
          {team?.record}
        </p>
      </div>
    </div>
  );
}

export default function MatchupCard({
  matchup,
  home,
  away,
  perspectiveId,
  onSelect,
}: {
  matchup: ScheduleMatchup;
  home?: LeagueTeam;
  away?: LeagueTeam;
  perspectiveId?: string;
  onSelect: (matchup: ScheduleMatchup) => void;
}) {
  const status = statusMeta(matchup.status);
  const showScore = matchup.status !== "upcoming";
  const homeWon = showScore && matchup.homeScore > matchup.awayScore;
  const awayWon = showScore && matchup.awayScore > matchup.homeScore;

  const viewId = perspectiveId ?? matchup.homeId;
  const result = resultFor(matchup, viewId);
  const wonCats = wonCategories(
    matchup,
    matchup.homeId === viewId ? "home" : "away"
  );
  const detail = statusDetail(matchup);

  return (
    <button
      type="button"
      onClick={() => onSelect(matchup)}
      className="flex w-full items-center gap-2 rounded-xl border border-brand-border bg-white p-3 text-left shadow-card transition hover:border-brand-cta/50 hover:shadow-md sm:gap-4 sm:p-4 md:gap-5 md:p-5"
    >
      <TeamBlock team={home} align="left" />

      <div className="flex shrink-0 flex-col items-center px-1">
        <span
          className={`text-base font-bold sm:text-lg md:text-xl ${
            homeWon ? "text-brand-cta-dark" : "text-brand-dark"
          } ${!showScore ? "text-brand-muted" : ""}`}
        >
          {showScore ? matchup.homeScore : "—"}
        </span>
        <span className="my-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-brand-muted sm:text-[10px] sm:tracking-[0.12em]">
          {centerLabel(matchup)}
        </span>
        <span
          className={`text-base font-bold sm:text-lg md:text-xl ${
            awayWon ? "text-brand-cta-dark" : "text-brand-dark"
          } ${!showScore ? "text-brand-muted" : ""}`}
        >
          {showScore ? matchup.awayScore : "—"}
        </span>
      </div>

      <TeamBlock team={away} align="right" />

      <div className="hidden w-44 shrink-0 flex-col items-end text-right md:flex">
        <span
          className={`flex items-center gap-1.5 text-xs font-semibold ${status.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
          {matchup.status === "final" && result
            ? `${result.outcome === "W" ? "Won" : result.outcome === "L" ? "Lost" : "Tied"} ${result.own}-${result.opp}`
            : status.label}
        </span>
        <span className="mt-1 text-[11px] text-brand-muted">
          {matchup.status === "final"
            ? wonCats.join(", ")
            : detail ?? ""}
        </span>
      </div>
    </button>
  );
}
