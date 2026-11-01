"use client";

import { useMemo, useState } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import type { LeagueTeam } from "@/lib/store/features/leagueSlice";
import TeamCard from "./TeamCard";
import TeamDetailModal from "./TeamDetailModal";

const FILTERS = ["All", "East", "West"] as const;
type Filter = (typeof FILTERS)[number];

export default function TeamsPage() {
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<LeagueTeam | null>(null);

  const teams = useMemo(
    () =>
      filter === "All"
        ? leagueTeams
        : leagueTeams.filter((team) => team.conference === filter),
    [leagueTeams, filter]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Teams</h1>
        <p className="text-sm text-brand-muted">
          {leagueTeams.length} teams · 2024-25 Season
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} onSelect={setSelected} />
        ))}
      </div>

      <TeamDetailModal team={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
