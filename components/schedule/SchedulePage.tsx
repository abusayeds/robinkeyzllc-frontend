"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";
import type { ScheduleMatchup } from "@/lib/store/features/leagueSlice";
import MatchupCard from "./MatchupCard";
import MatchupDetailModal from "./MatchupDetailModal";
import SeasonScheduleModal from "./SeasonScheduleModal";
import { teamMap, weekRange } from "./utils";

export default function SchedulePage() {
  const router = useRouter();
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const schedule = useAppSelector((state) => state.league.schedule);
  const currentWeek = useAppSelector((state) => state.league.week);

  const teams = useMemo(() => teamMap(leagueTeams), [leagueTeams]);
  const yourTeam = useMemo(
    () => leagueTeams.find((team) => team.yourTeam),
    [leagueTeams]
  );

  const weeks = useMemo(
    () => Array.from(new Set(schedule.map((m) => m.week))).sort((a, b) => a - b),
    [schedule]
  );
  const maxWeek = weeks[weeks.length - 1] ?? currentWeek;
  const minWeek = weeks[0] ?? 1;

  const [week, setWeek] = useState(currentWeek);
  const [allMatchups, setAllMatchups] = useState(false);
  const [selected, setSelected] = useState<ScheduleMatchup | null>(null);
  const [seasonOpen, setSeasonOpen] = useState(false);

  const list = useMemo(() => {
    if (allMatchups || !yourTeam) {
      return schedule
        .filter((m) => m.week === week)
        .sort((a, b) => a.id.localeCompare(b.id));
    }
    return schedule
      .filter(
        (m) =>
          (m.homeId === yourTeam.id || m.awayId === yourTeam.id) &&
          m.week >= week - 1 &&
          m.week <= week + 1
      )
      .sort((a, b) => a.week - b.week);
  }, [schedule, week, allMatchups, yourTeam]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Schedule</h1>
        <p className="text-sm text-brand-muted">
          Weekly matchups across the league, week by week.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Previous week"
            disabled={week <= minWeek}
            onClick={() => setWeek((w) => Math.max(minWeek, w - 1))}
            className="rounded-lg bg-brand-forest p-2 text-white transition hover:bg-brand-dark disabled:opacity-40"
          >
            <FiArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <p className="text-sm font-bold text-brand-dark">Week {week}</p>
            <p className="text-xs text-brand-muted">{weekRange(week)}</p>
          </div>
          <button
            type="button"
            aria-label="Next week"
            disabled={week >= maxWeek}
            onClick={() => setWeek((w) => Math.min(maxWeek, w + 1))}
            className="rounded-lg bg-brand-forest p-2 text-white transition hover:bg-brand-dark disabled:opacity-40"
          >
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAllMatchups((v) => !v)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              allMatchups
                ? "border-brand-forest bg-brand-forest text-white"
                : "border-brand-border text-brand-dark hover:bg-brand-soft"
            }`}
          >
            All Matchups
          </button>
          <button
            type="button"
            onClick={() => setSeasonOpen(true)}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Full Season View
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {list.length === 0 ? (
          <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
            No matchups for this selection.
          </div>
        ) : (
          list.map((matchup) => (
            <MatchupCard
              key={matchup.id}
              matchup={matchup}
              home={teams.get(matchup.homeId)}
              away={teams.get(matchup.awayId)}
              perspectiveId={!allMatchups ? yourTeam?.id : undefined}
              onSelect={setSelected}
            />
          ))
        )}
      </div>

      <MatchupDetailModal
        matchup={selected}
        home={selected ? teams.get(selected.homeId) : undefined}
        away={selected ? teams.get(selected.awayId) : undefined}
        onClose={() => setSelected(null)}
        onViewFull={(id) => {
          setSelected(null);
          router.push(`/league/schedule/matchup/${id}`);
        }}
      />

      <SeasonScheduleModal
        open={seasonOpen}
        onClose={() => setSeasonOpen(false)}
        team={yourTeam}
        schedule={schedule}
        teams={teams}
      />
    </div>
  );
}
