"use client";

import { useEffect, useMemo } from "react";
import { FiX } from "react-icons/fi";
import type {
  LeagueTeam,
  ScheduleMatchup,
} from "@/lib/store/features/leagueSlice";
import TeamLogo from "@/components/ui/TeamLogo";

export default function SeasonScheduleModal({
  open,
  onClose,
  team,
  schedule,
  teams,
}: {
  open: boolean;
  onClose: () => void;
  team?: LeagueTeam;
  schedule: ScheduleMatchup[];
  teams: Map<string, LeagueTeam>;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const weeks = useMemo(() => {
    const map = new Map<number, ScheduleMatchup[]>();
    for (const matchup of schedule) {
      const list = map.get(matchup.week) ?? [];
      list.push(matchup);
      map.set(matchup.week, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [schedule]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Full season schedule"
    >
      <div
        className="flex max-h-[85vh] supports-[height:100dvh]:max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="text-sm font-bold text-brand-dark">
            Full Season Schedule
            {team ? (
              <span className="ml-2 font-normal text-brand-muted">
                {team.name}
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-brand-soft/50 p-4">
          {weeks.map(([week, list]) => (
            <div
              key={week}
              className="overflow-hidden rounded-xl border border-brand-border bg-white"
            >
              <p className="border-b border-brand-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-brand-dark">
                Week {week}
              </p>
              <ul className="divide-y divide-brand-border">
                {list.map((matchup) => {
                  const home = teams.get(matchup.homeId);
                  const away = teams.get(matchup.awayId);
                  const mine =
                    team &&
                    (matchup.homeId === team.id || matchup.awayId === team.id);
                  return (
                    <li
                      key={matchup.id}
                      className={`flex items-center gap-2 px-4 py-2 text-sm ${
                        mine ? "bg-brand-cta/5" : ""
                      }`}
                    >
                      <div className="flex flex-1 items-center gap-2">
                        <TeamLogo
                          name={home?.name ?? "TBD"}
                          src={home?.logo}
                          className="h-5 w-5"
                        />
                        <span className="truncate font-medium text-brand-dark">
                          {home?.name}
                        </span>
                      </div>
                      <span className="shrink-0 text-xs text-brand-muted">
                        vs
                      </span>
                      <div className="flex flex-1 items-center justify-end gap-2 text-right">
                        <span className="truncate font-medium text-brand-dark">
                          {away?.name}
                        </span>
                        <TeamLogo
                          name={away?.name ?? "TBD"}
                          src={away?.logo}
                          className="h-5 w-5"
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
