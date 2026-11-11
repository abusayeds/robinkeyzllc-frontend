import TeamLogo from "@/components/ui/TeamLogo";
import { INTEL_LABEL, INTEL_TONE } from "@/lib/store/api/endpoints/teamApi";
import { capStatusTextTone, money, ordinal, type LeagueTeamRow } from "./utils";

export default function TeamCard({
  team,
  onSelect,
}: {
  team: LeagueTeamRow;
  onSelect: (team: LeagueTeamRow) => void;
}) {
  const statusTone = capStatusTextTone(team.tier);

  return (
    <button
      type="button"
      onClick={() => onSelect(team)}
      className={`flex flex-col rounded-xl border bg-white p-5 text-left shadow-card transition hover:border-brand-cta/50 hover:shadow-md ${
        team.isMine ? "border-brand-cta/40" : "border-brand-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <TeamLogo
            name={team.name}
            src={team.logo}
            className="h-10 w-10"
            rounded="rounded-full"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-brand-dark">
              {team.name}
            </p>
            <p className="truncate text-xs text-brand-muted">{team.owner}</p>
          </div>
        </div>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {team.isMine ? (
            <span className="rounded-full bg-brand-cta/15 px-2 py-0.5 text-[10px] font-bold text-brand-cta-dark">
              Your Team
            </span>
          ) : null}
          {/* Read-only here. Only the team's own owner can set it, from My
              Team, which is what makes it worth reading. */}
          {team.intelStatus ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${INTEL_TONE[team.intelStatus]}`}
            >
              {INTEL_LABEL[team.intelStatus]}
            </span>
          ) : null}
        </span>
      </div>

      <div className="my-4 border-t border-brand-border" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Record" value={team.record} />
        <Stat
          label="Cap Space"
          value={money(team.capSpace)}
          tone={statusTone}
        />
        <Stat label="Cap Status" value={team.tierLabel} tone={statusTone} />
        <Stat
          label="Rank"
          value={team.leagueRank > 0 ? ordinal(team.leagueRank) : "—"}
        />
      </div>
    </button>
  );
}

function Stat({
  label,
  value,
  tone = "text-brand-dark",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div>
      <p className="text-xs text-brand-muted">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone}`}>{value}</p>
    </div>
  );
}
