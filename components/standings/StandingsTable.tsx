import TeamLogo from "@/components/ui/TeamLogo";
import type { StandingRow } from "@/lib/store/api/endpoints/standingsApi";
import { gamesBack, pct, pctTone } from "./utils";

function StreakBadge({ streak }: { streak: string }) {
  const win = streak.startsWith("W");
  return (
    <span
      className={`inline-flex min-w-[34px] justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${
        win ? "bg-brand-cta/15 text-brand-cta-dark" : "bg-red-100 text-red-600"
      }`}
    >
      {streak}
    </span>
  );
}

function TeamCell({ row, mine }: { row: StandingRow; mine: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamLogo
        name={row.team}
        src={row.logo}
        className="h-7 w-7 text-[11px]"
        rounded="rounded-md"
      />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-brand-dark">
          {row.team}
        </p>
        {mine ? (
          <p className="text-[10px] font-semibold tracking-wide text-brand-cta-dark">
            YOUR TEAM
          </p>
        ) : null}
      </div>
    </div>
  );
}

const th =
  "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark/70";
const td = "px-3 py-3 text-sm text-brand-dark";

export default function StandingsTable({
  rows,
  showConf,
  myTeamId,
}: {
  rows: StandingRow[];
  showConf?: boolean;
  myTeamId?: number | null;
}) {
  const leader = rows[0];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="bg-brand-cta/10">
            <th className={`${th} text-left`}>#</th>
            <th className={`${th} text-left`}>Team</th>
            {showConf ? <th className={th}>Conf</th> : null}
            <th className={th}>W</th>
            <th className={th}>L</th>
            <th className={th}>T</th>
            <th className={th}>Pct</th>
            {showConf ? null : <th className={th}>Div</th>}
            <th className={th}>GB</th>
            <th className={th}>L10</th>
            <th className={th}>PF</th>
            <th className={th}>PA</th>
            <th className={th}>Strk</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={
                row.id === myTeamId
                  ? "bg-brand-cta/5"
                  : "transition hover:bg-brand-soft"
              }
            >
              <td className={`${td} w-10 text-brand-muted`}>{index + 1}</td>
              <td className={td}>
                <TeamCell row={row} mine={row.id === myTeamId} />
              </td>
              {showConf ? (
                <td className={`${td} text-center text-brand-muted`}>
                  {row.conference}
                </td>
              ) : null}
              <td className={`${td} text-center font-semibold`}>{row.w}</td>
              <td className={`${td} text-center`}>{row.l}</td>
              <td className={`${td} text-center text-brand-muted`}>{row.t}</td>
              <td className={`${td} text-center font-semibold ${pctTone(row)}`}>
                {pct(row)}
              </td>
              {showConf ? null : (
                <td className={`${td} text-center text-brand-muted`}>
                  {row.div}
                </td>
              )}
              <td className={`${td} text-center text-brand-muted`}>
                {gamesBack(row, leader)}
              </td>
              <td className={`${td} text-center text-brand-muted`}>{row.l10}</td>
              <td className={`${td} text-center`}>
                {row.ptsFor.toLocaleString()}
              </td>
              <td className={`${td} text-center`}>
                {row.ptsAgainst.toLocaleString()}
              </td>
              <td className={`${td} text-center`}>
                <StreakBadge streak={row.streak} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
