"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiSearch } from "react-icons/fi";
import {
  SLOT_LABEL,
  STATUS_LABEL,
  useLeagueRostersQuery,
  type RosterPlayer,
  type RosterTeam,
} from "@/lib/store/api/endpoints/rosterApi";
import { useAppSelector } from "@/lib/store/hooks";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** "2026-27" from 2026, the way the file and the screen both write it. */
const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

function PlayerRow({ player }: { player: RosterPlayer }) {
  const detail = [
    player.position,
    player.nbaTeam,
    player.experience !== null
      ? `${player.experience} yr${player.experience === 1 ? "" : "s"}${
          player.experienceIsEstimated ? "*" : ""
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <tr>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-dark">
            {initials(player.name)}
          </span>
          <div>
            <p className="flex items-center gap-1.5 font-medium text-brand-dark">
              {player.name}
              {player.slotType === "twoWay" ? (
                <span className="inline-flex rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
                  TW
                </span>
              ) : null}
            </p>
            {detail ? (
              <p className="text-[11px] text-brand-muted">{detail}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-center text-brand-muted">
        {player.birdYears}
      </td>
      <td className="px-4 py-2.5 text-center text-brand-muted">
        {player.contract ? player.contract.years : "—"}
      </td>
      <td className="px-4 py-2.5 text-center text-brand-muted">
        {player.status === "rostered"
          ? SLOT_LABEL[player.slotType]
          : STATUS_LABEL[player.status]}
      </td>
      <td className="px-4 py-2.5 text-right text-brand-dark">
        {player.capHit === null ? (
          <span className="text-brand-border">—</span>
        ) : (
          money(player.capHit)
        )}
      </td>
    </tr>
  );
}

function TeamCard({
  team,
  maxRosterSize,
}: {
  team: RosterTeam;
  maxRosterSize: number | null;
}) {
  const payroll = useMemo(
    () => team.players.reduce((total, p) => total + (p.capHit ?? 0), 0),
    [team.players],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-1.5 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <div>
            <p className="text-sm font-semibold text-brand-dark">{team.name}</p>
            <p className="text-[11px] text-brand-muted">
              {team.abbr} · {team.counts.standard}
              {maxRosterSize ? ` / ${maxRosterSize}` : ""} on the roster
              {team.counts.twoWay ? ` · ${team.counts.twoWay} two-way` : ""}
              {team.counts.injuredReserve
                ? ` · ${team.counts.injuredReserve} IR`
                : ""}
              {team.counts.rightsHeld
                ? ` · ${team.counts.rightsHeld} rights held`
                : ""}
            </p>
          </div>
        </div>
        <p className="text-sm font-semibold text-brand-dark">{money(payroll)}</p>
      </div>

      {team.warnings.length > 0 ? (
        <ul className="space-y-1 border-b border-brand-border bg-amber-50 px-4 py-2.5">
          {team.warnings.map((warning) => (
            <li
              key={warning}
              className="flex items-start gap-2 text-xs text-amber-700"
            >
              <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {warning}
            </li>
          ))}
        </ul>
      ) : null}

      {team.players.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-brand-muted">
          No players yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-2">Player</th>
                <th className="px-4 py-2 text-center">Bird</th>
                <th className="px-4 py-2 text-center">Yrs</th>
                <th className="px-4 py-2 text-center">Slot</th>
                <th className="px-4 py-2 text-right">Cap hit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {team.players.map((player) => (
                <PlayerRow key={player.id} player={player} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RosterManagementPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data, isLoading } = useLeagueRostersQuery(leagueId as number, {
    skip: !leagueId,
  });

  const [term, setTerm] = useState("");

  const teams = useMemo(() => {
    const all = data?.teams ?? [];
    const needle = term.trim().toLowerCase();
    if (!needle) return all;

    return all
      .map((team) => ({
        ...team,
        players: team.players.filter((player) =>
          player.name.toLowerCase().includes(needle),
        ),
      }))
      .filter(
        (team) =>
          team.players.length > 0 ||
          team.name.toLowerCase().includes(needle) ||
          team.abbr.toLowerCase().includes(needle),
      );
  }, [data, term]);

  const totals = useMemo(() => {
    const all = data?.teams ?? [];
    return {
      teams: all.length,
      players: all.reduce((n, team) => n + team.counts.total, 0),
    };
  }, [data]);

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to see its rosters.
      </p>
    );
  }

  const rules = data?.rules ?? null;
  const anyPlayers = totals.players > 0 || (data?.unassigned.length ?? 0) > 0;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Roster Management
          </h1>
          <p className="text-sm text-brand-muted">
            Every team&apos;s roster for{" "}
            {data ? seasonLabel(data.seasonStartYear) : "this season"}, measured
            against the league&apos;s roster rules.
          </p>
        </div>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search players or teams"
            className="w-60 rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm text-brand-dark outline-none focus:border-brand-cta"
          />
        </div>
      </div>

      {rules ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Teams", value: totals.teams },
            { label: "Players", value: totals.players },
            {
              label: "Roster size",
              value: `${rules.minRosterSize}–${rules.maxRosterSize}`,
            },
            { label: "Two-way allowed", value: rules.maxTwoWay },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-brand-border bg-white p-4 shadow-card"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-brand-dark">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {!isLoading && !anyPlayers ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">
            No players in this league yet.
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Rosters are filled by Player Import, and change after that through
            trades and free agency.
          </p>
        </div>
      ) : null}

      {teams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          maxRosterSize={rules?.maxRosterSize ?? null}
        />
      ))}

      {data && data.unassigned.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          <div className="border-b border-brand-border px-4 py-3">
            <p className="text-sm font-semibold text-brand-dark">
              Not on a team
            </p>
            <p className="text-[11px] text-brand-muted">
              {data.unassigned.length} player
              {data.unassigned.length === 1 ? "" : "s"} the league holds without
              a franchise.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                <tr>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2 text-center">Bird</th>
                  <th className="px-4 py-2 text-center">Yrs</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-right">Cap hit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {data.unassigned.map((player) => (
                  <PlayerRow key={player.id} player={player} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {data?.teams.some((team) =>
        team.players.some((p) => p.experienceIsEstimated),
      ) ? (
        <p className="text-[11px] text-brand-muted">
          * Experience estimated from the draft year, because no season history
          has been synced for that player yet.
        </p>
      ) : null}
    </div>
  );
}
