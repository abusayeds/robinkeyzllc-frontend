"use client";

import { useMemo, useState } from "react";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useLeagueSalariesQuery } from "@/lib/store/api/endpoints/salaryApi";
import { useLeagueStandingsQuery } from "@/lib/store/api/endpoints/standingsApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import { useAppSelector } from "@/lib/store/hooks";
import TeamCard from "./TeamCard";
import TeamDetailModal from "./TeamDetailModal";
import type { LeagueTeamRow } from "./utils";

const FILTERS = ["All", "East", "West"] as const;
type Filter = (typeof FILTERS)[number];

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

export default function TeamsPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: teamList, isLoading } = useLeagueTeamsQuery(
    leagueId as number,
    { skip: !leagueId },
  );
  const { data: salaries } = useLeagueSalariesQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );
  const { data: table } = useLeagueStandingsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );
  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });

  const myTeamId = useMemo(
    () =>
      memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<LeagueTeamRow | null>(null);

  /**
   * One row per team, from the three endpoints that own the pieces.
   *
   * Assembled here rather than asked for as a fourth endpoint: every figure is
   * already served to some other screen, and a page-shaped endpoint returning
   * the same numbers is one more thing that can fall out of step.
   */
  const rows: LeagueTeamRow[] = useMemo(() => {
    const teams = teamList?.teams ?? [];
    if (teams.length === 0) return [];

    const cap = salaries?.cap;
    const salaryByTeam = new Map(
      (salaries?.teams ?? []).map((row) => [row.id, row]),
    );
    const standings = table?.standings ?? [];
    const rankByTeam = new Map(
      standings.map((row, index) => [row.id, index + 1]),
    );
    const standingByTeam = new Map(standings.map((row) => [row.id, row]));

    return teams.map((team) => {
      const salary = salaryByTeam.get(team.id);
      const standing = standingByTeam.get(team.id);
      const teamSalary = salary?.totalCommitted ?? 0;
      const room = (threshold: number | undefined) =>
        threshold && threshold > 0 ? threshold - teamSalary : 0;

      return {
        id: team.id,
        name: team.name,
        abbr: team.abbr,
        logo: team.logo,
        owner: team.owner?.name ?? "Unclaimed",
        conference: standing?.conference ?? "East",
        isMine: team.id === myTeamId,
        record: standing
          ? `${standing.w}-${standing.l}${standing.t > 0 ? `-${standing.t}` : ""}`
          : "0-0",
        leagueRank: rankByTeam.get(team.id) ?? 0,
        rosterCount: salary?.contractCount ?? 0,
        rosterMax: teamList?.maxRosterSize ?? 0,
        payroll: salary?.payroll ?? 0,
        deadMoney: salary?.deadMoney ?? 0,
        teamSalary,
        tier: salary?.tier ?? "capNotSet",
        tierLabel: salary?.tierLabel ?? "Cap not set",
        capSpace: salary?.capSpace ?? 0,
        taxRoom: room(cap?.luxuryTax),
        firstApronRoom: room(cap?.firstApron),
        secondApronRoom: room(cap?.secondApron),
        // Carried straight off the team row: it is this team's own statement,
        // not something assembled from the cap sheet or the standings.
        intelStatus: team.intelStatus,
      };
    });
  }, [teamList, salaries, table, myTeamId]);

  const teams = useMemo(
    () =>
      filter === "All"
        ? rows
        : rows.filter((team) => team.conference === filter),
    [rows, filter],
  );

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see its teams.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Teams</h1>
        <p className="text-sm text-brand-muted">
          {rows.length} teams
          {salaries ? ` · ${seasonLabel(salaries.seasonStartYear)} Season` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-brand-border p-0.5">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                filter === item
                  ? "bg-brand-cta text-white"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-brand-muted">Loading teams…</p>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">
            No teams in this view
          </p>
          <p className="mt-1 text-xs text-brand-muted">
            A commissioner creates the league&apos;s franchises from Team
            Management.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} onSelect={setSelected} />
          ))}
        </div>
      )}

      <TeamDetailModal team={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
