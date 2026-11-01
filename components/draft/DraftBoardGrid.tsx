"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/lib/store/hooks";

function initialLastName(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length < 2) return name;
  return `${parts[0].charAt(0)}.${parts.slice(1).join(" ")}`;
}

export default function DraftBoardGrid() {
  const order = useAppSelector((state) => state.draft.order);
  const currentPick = useAppSelector((state) => state.draft.currentPick);
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const rookiePool = useAppSelector((state) => state.draft.rookie);
  const startupPool = useAppSelector((state) => state.draft.startup);
  const allProspects = useMemo(
    () => [...rookiePool, ...startupPool],
    [rookiePool, startupPool]
  );

  const teamById = useMemo(
    () => new Map(leagueTeams.map((t) => [t.id, t])),
    [leagueTeams]
  );
  const prospectById = useMemo(
    () => new Map(allProspects.map((p) => [p.id, p])),
    [allProspects]
  );

  const rounds = Array.from(new Set(order.map((s) => s.round))).sort();
  const columns = order
    .filter((s) => s.round === 1)
    .map((s) => s.teamId);

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <p className="border-b border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-dark">
        Draft Board
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-xs">
          <thead>
            <tr className="bg-brand-soft">
              <th className="px-3 py-2 text-left font-semibold text-brand-muted">
                Round
              </th>
              {columns.map((teamId) => (
                <th
                  key={teamId}
                  className="px-2 py-2 text-center font-semibold text-brand-dark"
                >
                  {(teamById.get(teamId)?.franchise ?? teamById.get(teamId)?.name ?? "")
                    .split(" ")
                    .pop()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rounds.map((round) => {
              const rowSlots = order.filter((s) => s.round === round);
              return (
                <tr key={round}>
                  <td className="px-3 py-2 font-bold text-brand-dark">
                    Round {round}
                  </td>
                  {columns.map((teamId) => {
                    const s = rowSlots.find((x) => x.teamId === teamId);
                    const isCurrent = s?.overall === order[currentPick]?.overall;
                    const prospect = s?.prospectId
                      ? prospectById.get(s.prospectId)
                      : undefined;
                    return (
                      <td
                        key={teamId}
                        className={`px-2 py-2 text-center ${
                          isCurrent
                            ? "bg-brand-cta/10 font-semibold text-brand-cta-dark"
                            : "text-brand-muted"
                        }`}
                      >
                        {isCurrent
                          ? "On the Clock"
                          : prospect
                            ? initialLastName(prospect.name)
                            : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
