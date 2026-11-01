"use client";

import type { MyTeamBudget } from "@/lib/store/api/endpoints/freeAgencyApi";
import { money, shortMoney } from "./contract";

/**
 * What the team has to spend. Rendered from the server's own figures rather
 * than recomputed here, so the number on this card and the number the offer is
 * judged against cannot disagree.
 */
export default function CapOverview({ team }: { team: MyTeamBudget | null }) {
  if (!team) {
    return (
      <div className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted shadow-card">
        You do not hold a team in this league, so there is nothing to spend.
      </div>
    );
  }

  const capNotSet = team.salaryCap <= 0;

  const stats = [
    { label: "Committed", value: money(team.committed) },
    {
      label: "Cap space",
      value: team.capSpace === null ? "—" : money(team.capSpace),
      tone:
        team.capSpace !== null && team.capSpace < 0
          ? "text-red-500"
          : "text-brand-dark",
    },
    {
      label: "Roster",
      value: `${team.rosterCount} / ${team.maxRosterSize}`,
      tone:
        team.rosterCount >= team.maxRosterSize
          ? "text-red-500"
          : "text-brand-dark",
    },
    {
      label: "Two-way",
      value: `${team.twoWayCount} / ${team.maxTwoWay}`,
    },
    {
      label: "Max player",
      value: capNotSet ? "—" : shortMoney(team.maxPlayerSalary),
    },
  ];

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <div className="flex items-center gap-2.5">
        <span
          className="h-6 w-1.5 rounded-full"
          style={{ backgroundColor: team.color }}
        />
        <p className="text-sm font-semibold text-brand-dark">{team.name}</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              {stat.label}
            </p>
            <p
              className={`mt-0.5 text-lg font-bold ${stat.tone ?? "text-brand-dark"}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {capNotSet ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          This league has no salary cap set, so offers are not measured against
          one.
        </p>
      ) : null}

      {team.hardCapEnabled && team.hardCapThreshold !== null ? (
        <p className="mt-3 text-[11px] text-brand-muted">
          Hard cap at {money(team.hardCapThreshold)}.
        </p>
      ) : null}
    </div>
  );
}
