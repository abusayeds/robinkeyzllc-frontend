"use client";

import type { MyTeamBudget } from "@/lib/store/api/endpoints/freeAgencyApi";
import TeamLogo from "@/components/ui/TeamLogo";
import { money } from "./contract";

/**
 * Room under a line, written the way the rest of the app writes it: a plus
 * when the team is under, a minus when it is over, and a dash only when the
 * league year has no figures at all.
 */
const room = (value: number | null) => {
  if (value === null) return "—";
  return `${value >= 0 ? "+" : "-"}${money(Math.abs(value))}`;
};

const roomTone = (value: number | null) => {
  if (value === null) return "text-brand-muted";
  return value >= 0 ? "text-brand-cta-dark" : "text-red-500";
};

/**
 * What the team has to spend, as the approved design lays it out: the team
 * with its open spots, then one card per line in Article 3.
 *
 * Rendered from the server's own figures rather than recomputed here, so the
 * number on this card and the number an offer is judged against cannot
 * disagree.
 */
/**
 * Article 6's signing tools, as the one line the design puts opposite the
 * tabs. Exported on its own because that is where it belongs on the page,
 * not under the cap cards.
 */
export function CapExceptionStrip({ team }: { team: MyTeamBudget | null }) {
  const usable = (team?.exceptions ?? []).filter((one) => one.available);
  if (usable.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
        Available cap exceptions
      </span>
      {usable.map((one) => (
        <span
          key={one.key}
          className="rounded-lg border border-brand-border bg-white px-2.5 py-1 text-xs font-semibold text-brand-dark"
        >
          {one.label}: {money(one.amount)}
        </span>
      ))}
    </div>
  );
}

export default function CapOverview({
  team,
  subtitle,
}: {
  team: MyTeamBudget | null;
  /** "League · GM name", which the page knows and this card does not. */
  subtitle?: string | null;
}) {
  if (!team) {
    return (
      <div className="rounded-xl border border-brand-border bg-white px-4 py-3 text-sm text-brand-muted shadow-card">
        You do not hold a team in this league, so there is nothing to spend.
      </div>
    );
  }

  const cards = [
    {
      label: "Team Salary",
      value: money(team.committed),
      tone: "text-brand-dark",
    },
    {
      label: "Cap Space",
      value: room(team.capSpace),
      tone: roomTone(team.capSpace),
    },
    {
      label: "1st Apron",
      value: room(team.firstApronRoom),
      tone: roomTone(team.firstApronRoom),
    },
    {
      label: "2nd Apron",
      value: room(team.secondApronRoom),
      tone: roomTone(team.secondApronRoom),
    },
    {
      label: "Luxury Tax",
      value: room(team.luxuryTaxRoom),
      tone: roomTone(team.luxuryTaxRoom),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card">
        <div className="flex min-w-0 items-center gap-3">
          <TeamLogo
            name={team.name}
            src={team.logo}
            className="h-9 w-9 shrink-0"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-dark">
              {team.name}
            </p>
            <p className="truncate text-[11px] text-brand-muted">
              {subtitle ?? team.tierLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Roster Spots
            </p>
            <p
              className={`text-sm font-bold ${
                team.rosterSpotsFree === 0
                  ? "text-red-500"
                  : "text-brand-cta-dark"
              }`}
            >
              {team.rosterSpotsFree} Free
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Two-Way
            </p>
            <p className="text-sm font-bold text-brand-dark">
              {team.twoWayCount}/{team.maxTwoWay}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              {card.label}
            </p>
            <p className={`mt-1 text-lg font-bold ${card.tone}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {!team.capIsSet ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          This league year has no cap figures entered, so offers are not
          measured against one.
        </p>
      ) : null}

      {team.hardCapEnabled && team.hardCapThreshold !== null ? (
        <p className="text-[11px] text-brand-muted">
          Hard cap at {money(team.hardCapThreshold)}.
        </p>
      ) : null}
    </div>
  );
}
