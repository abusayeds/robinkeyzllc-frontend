"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";
import type { LeagueTeam } from "@/lib/store/features/leagueSlice";
import type { RosterPlayer } from "@/lib/store/features/rostersSlice";
import TeamLogo from "@/components/ui/TeamLogo";
import { formatCategory, teamMap, weekRange } from "./utils";

function TeamHead({
  team,
  align,
}: {
  team?: LeagueTeam;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-1 items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo name={team?.name ?? "TBD"} src={team?.logo} className="h-12 w-12" />
      <div>
        <p className="text-base font-bold text-brand-dark">{team?.name}</p>
        <p className="text-xs text-brand-muted">
          {team?.yourTeam ? `${team.owner} (Manager)` : "Computer"} ·{" "}
          {team?.record}
        </p>
      </div>
    </div>
  );
}

function PlayerCell({
  player,
  align,
}: {
  player?: RosterPlayer;
  align: "left" | "right";
}) {
  if (!player) {
    return (
      <div
        className={`flex items-center gap-3 py-1 text-sm italic text-brand-muted ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        <span className="h-9 w-9 shrink-0 rounded-full bg-brand-soft" />
        [Empty Slot]
      </div>
    );
  }

  return (
    <div
      className={`flex items-start gap-3 py-1 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-brand-forest">
        <Image
          src="/image/randomuser.jpg"
          alt={player.name}
          fill
          sizes="36px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0">
        <div
          className={`flex items-center gap-2 ${
            align === "right" ? "flex-row-reverse" : ""
          }`}
        >
          <span className="truncate text-sm font-semibold text-brand-dark">
            {player.name}
          </span>
          <span className="text-[10px] font-semibold text-brand-muted">
            {player.nbaTeam}
          </span>
        </div>
        <p className="text-[11px] text-brand-muted">
          FG% {formatCategory(player.fgPct, true)} | 3PTM {player.threes} | FT%{" "}
          {formatCategory(player.ftPct, true)}
        </p>
        <p className="text-[11px] font-semibold text-brand-cta-dark">
          PTS {player.pts} REB {player.reb} AST {player.ast} STL {player.stl} BLK{" "}
          {player.blk} TO {player.to}
        </p>
      </div>
    </div>
  );
}

export default function FullMatchup() {
  const params = useParams<{ id: string }>();
  const matchup = useAppSelector((state) =>
    state.league.schedule.find((m) => m.id === params.id)
  );
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const rosters = useAppSelector((state) => state.rosters.byTeam);

  const teams = useMemo(() => teamMap(leagueTeams), [leagueTeams]);

  if (!matchup) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm text-brand-muted">Matchup not found.</p>
        <Link
          href="/league/schedule"
          className="mt-3 inline-block text-sm font-semibold text-brand-cta-dark"
        >
          Back to schedule
        </Link>
      </div>
    );
  }

  const home = teams.get(matchup.homeId);
  const away = teams.get(matchup.awayId);
  const homeRoster = rosters[matchup.homeId] ?? [];
  const awayRoster = rosters[matchup.awayId] ?? [];
  const rowCount = Math.max(homeRoster.length, awayRoster.length);
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  const pillLabel =
    matchup.status === "final"
      ? "Final"
      : matchup.status === "live"
        ? "Matchup In Progress"
        : "Matchup Not Started";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/league/schedule"
            aria-label="Back to schedule"
            className="rounded-lg bg-brand-forest p-2 text-white transition hover:bg-brand-dark"
          >
            <FiArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-bold text-brand-dark">
              Week {matchup.week}
            </p>
            <p className="text-xs text-brand-muted">{weekRange(matchup.week)}</p>
          </div>
        </div>
        <Link
          href="/league/schedule"
          className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
        >
          All Matchups
        </Link>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-4">
          <TeamHead team={home} align="left" />
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="flex items-center gap-2 text-2xl font-bold text-brand-dark">
              {matchup.status === "upcoming" ? (
                <>—<span className="text-base font-normal text-brand-muted">vs</span>—</>
              ) : (
                <>
                  {matchup.homeScore}
                  <span className="text-base font-normal text-brand-muted">
                    vs
                  </span>
                  {matchup.awayScore}
                </>
              )}
            </span>
            <StatusPillWrapper label={pillLabel} status={matchup.status} />
          </div>
          <TeamHead team={away} align="right" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-brand-border bg-brand-cta/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark/70">
          <span>{home?.name} Roster</span>
          <span className="text-center">Slot</span>
          <span className="text-right">{away?.name} Roster</span>
        </div>

        <ul className="divide-y divide-brand-border">
          {rows.map((i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3"
            >
              <PlayerCell player={homeRoster[i]} align="left" />
              <span className="flex h-6 w-8 items-center justify-center rounded bg-brand-soft text-[11px] font-bold text-brand-muted">
                {homeRoster[i]?.slot ?? awayRoster[i]?.slot ?? "BN"}
              </span>
              <PlayerCell player={awayRoster[i]} align="right" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StatusPillWrapper({
  label,
  status,
}: {
  label: string;
  status: "upcoming" | "live" | "final";
}) {
  const tone =
    status === "live"
      ? "bg-brand-cta/15 text-brand-cta-dark"
      : status === "final"
        ? "bg-brand-soft text-brand-muted"
        : "bg-amber-100 text-amber-700";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${tone}`}
    >
      {label}
    </span>
  );
}
