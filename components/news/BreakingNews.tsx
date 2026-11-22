"use client";

import type {
  NewsPayload,
  NewsTeamLeg,
} from "@/lib/store/api/endpoints/newsApi";
import TeamLogo from "@/components/ui/TeamLogo";

/**
 * The Breaking News label and the laid-out body of a transaction post.
 *
 * One format for every type, used by the feed, the detail page and the inbox,
 * so the same move never reads two different ways.
 */

/** Abbreviated, because a post is read at a glance. */
const money = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const millions = value / 1_000_000;
  return `${millions >= 100 ? Math.round(millions) : millions.toFixed(1)}M`;
};

const signed = (value: number) =>
  `${value >= 0 ? "+" : "-"}${money(Math.abs(value))}`;

/**
 * "Nov 12, 2026 · 7:44 PM" in the reader's own timezone. A raw ISO string is
 * never shown: it was the first thing the client flagged on this page.
 */
export const newsTime = (iso: string) => {
  const at = new Date(iso);
  return `${at.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} · ${at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;
};

/** "2 hours ago" for the feed list, which has no room for the full date. */
export const newsAgo = (iso: string) => {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [7, "day"],
    [4.35, "week"],
    [12, "month"],
  ];
  let value = seconds;
  let unit = "second";
  for (const [size, name] of steps) {
    if (value < size) {
      unit = name;
      break;
    }
    value /= size;
    unit = name;
  }
  const whole = Math.floor(value);
  if (unit === "second" && whole < 30) return "just now";
  return `${whole} ${unit}${whole === 1 ? "" : "s"} ago`;
};

export function BreakingLabel() {
  return (
    <span className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      {/* The emoji is labelled so a screen reader says "Breaking news"
          instead of "police car light". */}
      <span role="img" aria-label="Breaking news">
        🚨
      </span>
      Breaking News
    </span>
  );
}

function TeamColumn({ team }: { team: NewsTeamLeg }) {
  const pieces = team.players.length + team.picks.length;
  if (pieces === 0) return null;

  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
        <TeamLogo
          name={team.name}
          src={team.logo}
          className="h-4 w-4 shrink-0"
        />
        <span className="truncate">{team.name} receive</span>
      </p>
      <ul className="mt-1.5 space-y-1.5">
        {team.players.map((player) => (
          <li key={player.name} className="text-sm text-brand-dark">
            <span className="font-semibold">{player.name}</span>
            {player.position ? (
              <span className="ml-1.5 text-[10px] font-bold text-brand-muted">
                {player.position}
              </span>
            ) : null}
            {player.salary !== null || player.throughSeasonStartYear ? (
              <span className="block text-[11px] text-brand-muted">
                {[
                  player.salary !== null ? money(player.salary) : null,
                  player.throughSeasonStartYear
                    ? `thru ${player.throughSeasonStartYear}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            ) : null}
          </li>
        ))}
        {team.picks.map((pick) => (
          <li key={pick.label} className="text-sm text-brand-dark">
            <span className="font-semibold">{pick.label}</span>
            {pick.originalTeamAbbr ? (
              <span className="ml-1 text-[11px] text-brand-muted">
                ({pick.originalTeamAbbr})
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The body of a post.
 *
 * A section with no data is left out rather than shown with blanks: a post
 * from before the cap figures were captured should read as a short post, not
 * a broken one.
 */
export default function BreakingNews({ payload }: { payload: NewsPayload }) {
  const columns = payload.teams.filter(
    (team) => team.players.length + team.picks.length > 0,
  );
  const withCap = payload.teams.filter(
    (team) => team.capBefore !== null && team.capAfter !== null,
  );

  return (
    <div className="space-y-4">
      {payload.summary ? (
        <p className="text-sm leading-relaxed text-brand-dark">
          {payload.summary}
        </p>
      ) : null}

      {columns.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {columns.map((team) => (
            <TeamColumn key={team.teamId} team={team} />
          ))}
        </div>
      ) : null}

      {withCap.length > 0 ? (
        <div className="rounded-lg border border-brand-border">
          <p className="border-b border-brand-border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
            Cap Impact
          </p>
          <ul className="divide-y divide-brand-border">
            {withCap.map((team) => {
              const change =
                (team.capAfter as number) - (team.capBefore as number);
              return (
                <li
                  key={team.teamId}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs"
                >
                  <span className="min-w-0 truncate font-semibold text-brand-dark">
                    {team.name}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-brand-muted">
                    <span>
                      {money(team.capBefore as number)} →{" "}
                      {money(team.capAfter as number)}
                    </span>
                    <span
                      className={`font-semibold ${
                        change > 0 ? "text-red-500" : "text-brand-cta-dark"
                      }`}
                    >
                      ({signed(change)})
                    </span>
                    {team.capSpaceAfter !== null ? (
                      <span>Cap space: {money(team.capSpaceAfter)}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
