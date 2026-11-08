"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import {
  useLeagueMatchupsQuery,
  type ScheduleMatchup,
} from "@/lib/store/api/endpoints/standingsApi";
import MatchupCard from "./MatchupCard";
import MatchupDetailModal from "./MatchupDetailModal";
import SeasonScheduleModal from "./SeasonScheduleModal";
import { teamMap, weekRange } from "./utils";

export default function SchedulePage() {
  const router = useRouter();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data, isLoading } = useLeagueMatchupsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () => memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const schedule = useMemo(() => data?.matchups ?? [], [data]);
  const teams = useMemo(() => teamMap(data?.teams ?? []), [data]);
  const yourTeam = myTeamId ? teams.get(myTeamId) : undefined;

  const weeks = useMemo(
    () => Array.from(new Set(schedule.map((m) => m.week))).sort((a, b) => a - b),
    [schedule],
  );
  const maxWeek = weeks[weeks.length - 1] ?? 1;
  const minWeek = weeks[0] ?? 1;

  const [week, setWeek] = useState(1);
  const [allMatchups, setAllMatchups] = useState(false);
  const [selected, setSelected] = useState<ScheduleMatchup | null>(null);
  const [seasonOpen, setSeasonOpen] = useState(false);

  // Opens on the live week once the schedule has loaded. Held in state rather
  // than derived, because the arrows have to be able to move off it.
  const currentWeek = data?.currentWeek ?? 0;
  useEffect(() => {
    if (currentWeek > 0) setWeek(currentWeek);
  }, [currentWeek]);

  const list = useMemo(() => {
    if (allMatchups || !yourTeam) {
      return schedule
        .filter((m) => m.week === week)
        .sort((a, b) => a.id - b.id);
    }
    return schedule
      .filter(
        (m) =>
          (m.homeId === yourTeam.id || m.awayId === yourTeam.id) &&
          m.week >= week - 1 &&
          m.week <= week + 1,
      )
      .sort((a, b) => a.week - b.week);
  }, [schedule, week, allMatchups, yourTeam]);

  const activeWeek = schedule.find((m) => m.week === week);

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see its schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Schedule</h1>
        <p className="text-sm text-brand-muted">
          Weekly matchups across the league, week by week.
        </p>
      </div>

      {/* A state the design does not draw, because it only shows a league in
          mid-season. The Standings page is where a schedule is drawn. */}
      {!isLoading && schedule.length === 0 ? (
        <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          This season has no schedule yet. A commissioner draws one from the
          Standings page.
        </div>
      ) : null}

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
            <p className="text-xs text-brand-muted">
              {weekRange(activeWeek?.startDate, activeWeek?.endDate)}
            </p>
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
        {isLoading ? (
          <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
            Loading the schedule…
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
            No matchups for this selection.
          </div>
        ) : (
          list.map((matchup) => (
            <MatchupCard
              key={matchup.id}
              matchup={matchup}
              home={matchup.homeId ? teams.get(matchup.homeId) : undefined}
              away={matchup.awayId ? teams.get(matchup.awayId) : undefined}
              perspectiveId={!allMatchups ? yourTeam?.id : undefined}
              onSelect={setSelected}
            />
          ))
        )}
      </div>

      <MatchupDetailModal
        matchup={selected}
        home={
          selected?.homeId ? teams.get(selected.homeId) : undefined
        }
        away={
          selected?.awayId ? teams.get(selected.awayId) : undefined
        }
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
