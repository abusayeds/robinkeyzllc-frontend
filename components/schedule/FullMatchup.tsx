"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { avatarSrc } from "@/lib/avatar";
import {
  useMatchupDetailQuery,
  type MatchupPlayerLine,
  type MatchupSide,
} from "@/lib/store/api/endpoints/standingsApi";
import { useAppSelector } from "@/lib/store/hooks";
import TeamLogo from "@/components/ui/TeamLogo";
import { formatCategory, weekRange } from "./utils";

/** Season makes over season attempts, the way every percentage here is worked out. */
const percent = (makes: number, attempts: number) =>
  attempts > 0 ? makes / attempts : 0;

function TeamHead({
  side,
  record,
  align,
}: {
  side: MatchupSide;
  record: string;
  align: "left" | "right";
}) {
  const team = side?.team;

  return (
    <div
      className={`flex flex-1 items-center gap-3 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <TeamLogo
        name={team?.name ?? "TBD"}
        src={team?.logo}
        className="h-12 w-12"
      />
      <div>
        <p className="text-base font-bold text-brand-dark">
          {team?.name ?? "TBD"}
        </p>
        <p className="text-xs text-brand-muted">
          {team?.owner ? `${team.owner.name} (Manager)` : "Unclaimed"}
          {record ? ` · ${record}` : ""}
        </p>
      </div>
    </div>
  );
}

function PlayerCell({
  player,
  align,
}: {
  player?: MatchupPlayerLine;
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

  const headshot = avatarSrc(player.headshot);

  return (
    <div
      className={`flex items-start gap-3 py-1 ${
        align === "right" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-forest text-[11px] font-bold text-brand-accent">
        {headshot ? (
          <Image
            src={headshot}
            alt={player.name}
            fill
            sizes="36px"
            unoptimized
            className="object-cover"
          />
        ) : (
          player.name.charAt(0)
        )}
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
            {player.nbaTeam ?? ""}
          </span>
        </div>
        <p className="text-[11px] text-brand-muted">
          FG% {formatCategory(percent(player.fgm, player.fga), true)} | 3PTM{" "}
          {player.threes} | FT%{" "}
          {formatCategory(percent(player.ftm, player.fta), true)}
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
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const matchupId = Number(params.id);

  const { data: matchup, isLoading } = useMatchupDetailQuery(
    { leagueId: leagueId as number, matchupId },
    { skip: !leagueId || !Number.isInteger(matchupId) },
  );

  if (isLoading) {
    return <p className="text-sm text-brand-muted">Loading the matchup…</p>;
  }

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

  const homePlayers = matchup.home?.players ?? [];
  const awayPlayers = matchup.away?.players ?? [];
  const rowCount = Math.max(homePlayers.length, awayPlayers.length);
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
            <p className="text-xs text-brand-muted">
              {weekRange(matchup.startDate, matchup.endDate)}
            </p>
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
          <TeamHead
            side={matchup.home}
            record={`${matchup.home?.playerCount ?? 0} played`}
            align="left"
          />
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="flex items-center gap-2 text-2xl font-bold text-brand-dark">
              {matchup.status === "upcoming" ? (
                <>
                  —<span className="text-base font-normal text-brand-muted">vs</span>
                  —
                </>
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
          <TeamHead
            side={matchup.away}
            record={`${matchup.away?.playerCount ?? 0} played`}
            align="right"
          />
        </div>
      </div>

      {/* The nine categories, which is what actually decides the week. */}
      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-brand-border bg-brand-cta/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark/70">
          <span>{matchup.home?.team?.name ?? "TBD"}</span>
          <span className="text-center">Category</span>
          <span className="text-right">{matchup.away?.team?.name ?? "TBD"}</span>
        </div>
        <ul className="divide-y divide-brand-border">
          {matchup.categories.map((category) => (
            <li
              key={category.key}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-2"
            >
              <span
                className={`text-sm font-semibold tabular-nums ${
                  category.homeWins === true
                    ? "text-brand-cta-dark"
                    : category.homeWins === false
                      ? "text-red-500"
                      : "text-brand-muted"
                }`}
              >
                {formatCategory(
                  category.percent ? category.home / 100 : category.home,
                  category.percent,
                )}
              </span>
              <span className="w-14 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                {category.label}
              </span>
              <span
                className={`text-right text-sm font-semibold tabular-nums ${
                  category.homeWins === false
                    ? "text-brand-cta-dark"
                    : category.homeWins === true
                      ? "text-red-500"
                      : "text-brand-muted"
                }`}
              >
                {formatCategory(
                  category.percent ? category.away / 100 : category.away,
                  category.percent,
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-brand-border bg-brand-cta/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-dark/70">
          <span>{matchup.home?.team?.name ?? "TBD"} Roster</span>
          <span className="text-center">Pos</span>
          <span className="text-right">
            {matchup.away?.team?.name ?? "TBD"} Roster
          </span>
        </div>

        <ul className="divide-y divide-brand-border">
          {rows.map((i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-3"
            >
              <PlayerCell player={homePlayers[i]} align="left" />
              {/* AVORA has no lineup, so the slot badge carries the player's
                  position — the closest thing there is to put in it. */}
              <span className="flex h-6 w-10 items-center justify-center rounded bg-brand-soft text-[11px] font-bold text-brand-muted">
                {homePlayers[i]?.position ?? awayPlayers[i]?.position ?? "—"}
              </span>
              <PlayerCell player={awayPlayers[i]} align="right" />
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
