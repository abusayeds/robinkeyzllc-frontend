"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCalendar,
  FiInfo,
  FiRepeat,
  FiLayers,
  FiUserPlus,
  FiUserMinus,
} from "react-icons/fi";
import { Card, CardHeader } from "@/components/ui/Card";
import TeamLogo from "@/components/ui/TeamLogo";
import {
  PHASE_COLOR,
  PHASE_LABEL,
} from "@/lib/store/api/endpoints/calendarApi";
import {
  useTeamDashboardQuery,
  type ActivityItem,
  type AttentionItem,
  type AttentionSeverity,
  type DashboardEvent,
  type TeamDashboard,
} from "@/lib/store/api/endpoints/dashboardApi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import {
  useCategoryTotalsQuery,
  useLeagueMatchupsQuery,
  useLeagueStandingsQuery,
} from "@/lib/store/api/endpoints/standingsApi";
import { TIER_TONE } from "@/lib/store/api/endpoints/salaryApi";
import { useAppSelector } from "@/lib/store/hooks";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

/** 1st, 2nd, 3rd — the rank chip beside the record. */
const ordinal = (n: number) => {
  const suffix = ["th", "st", "nd", "rd"];
  const value = n % 100;
  return `${n}${suffix[(value - 20) % 10] ?? suffix[value] ?? suffix[0]}`;
};

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** "3 days ago" for the activity list, which is about recency, not dates. */
const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours >= 1) return `${hours}h ago`;
  return "just now";
};

const eventDate = (event: DashboardEvent) => {
  if (event.displayLabel) return event.displayLabel;
  const start = formatDate(event.startDate);
  return event.endDate ? `${start} – ${formatDate(event.endDate)}` : start;
};

function Tile({
  label,
  value,
  sub,
  tone = "text-brand-dark",
  href,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  tone?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-[11px] font-semibold tracking-[0.12em] text-brand-muted">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
      <div className="mt-2 text-xs text-brand-muted">{sub}</div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl border border-brand-border bg-white p-5 shadow-card transition hover:border-brand-cta/40 hover:shadow-md"
      >
        {body}
      </Link>
    );
  }

  return <Card>{body}</Card>;
}

const SEVERITY_STYLE: Record<
  AttentionSeverity,
  { box: string; icon: React.ReactNode }
> = {
  action: {
    box: "border-red-200 bg-red-50 text-red-700",
    icon: <FiAlertTriangle className="h-4 w-4" />,
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-700",
    icon: <FiAlertTriangle className="h-4 w-4" />,
  },
  info: {
    box: "border-brand-border bg-brand-soft/50 text-brand-dark",
    icon: <FiInfo className="h-4 w-4" />,
  },
};

/**
 * What only this owner can clear.
 *
 * Shown when there is something and dropped entirely when there is not: a card
 * reading "nothing needs your attention" is noise on a page opened every day.
 */
function Attention({ items }: { items: AttentionItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const style = SEVERITY_STYLE[item.severity];
        return (
          <Link
            key={item.kind}
            href={item.href}
            className={`flex items-start gap-3 rounded-xl border p-4 transition hover:shadow-card ${style.box}`}
          >
            <span className="mt-0.5 shrink-0">{style.icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{item.title}</span>
              <span className="mt-0.5 block text-xs opacity-80">
                {item.detail}
              </span>
            </span>
            <FiArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 opacity-60" />
          </Link>
        );
      })}
    </div>
  );
}

/**
 * The team's money on one scale, with the thresholds it has passed.
 *
 * Drawn against the second apron so the marks sit in the same place as they do
 * on the commissioner's cap sheet, and a hard cap is drawn heavier than the
 * lines a team may cross (Rule 4.1).
 */
function CapBar({ cap, hardCap }: { cap: TeamDashboard["cap"]; hardCap: TeamDashboard["hardCap"] }) {
  if (!cap.isSet) return null;

  const scale = cap.secondApron || cap.salaryCap;
  const mark = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;

  return (
    <div className="relative mt-3 h-2 w-full rounded-full bg-brand-soft">
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-brand-cta"
        style={{ width: mark(cap.teamSalary) }}
      />
      <span
        className="absolute inset-y-0 w-px bg-brand-muted/60"
        style={{ left: mark(cap.salaryCap) }}
        title={`Salary cap ${money(cap.salaryCap)}`}
      />
      <span
        className="absolute inset-y-0 w-px bg-orange-400"
        style={{ left: mark(cap.luxuryTax) }}
        title={`Luxury tax ${money(cap.luxuryTax)}`}
      />
      {hardCap.ceiling ? (
        <span
          className="absolute -inset-y-0.5 w-0.5 rounded bg-red-500"
          style={{ left: mark(hardCap.ceiling) }}
          title={`Hard cap ${money(hardCap.ceiling)}`}
        />
      ) : null}
    </div>
  );
}

const ACTIVITY_ICON: Record<ActivityItem["type"], React.ReactNode> = {
  "Trade Accepted": <FiRepeat className="h-4 w-4" />,
  "Draft Pick Traded": <FiLayers className="h-4 w-4" />,
  "Player Signed": <FiUserPlus className="h-4 w-4" />,
  "Free Agent Signed": <FiUserPlus className="h-4 w-4" />,
  "Player Waived": <FiUserMinus className="h-4 w-4" />,
  "Player Drafted": <FiLayers className="h-4 w-4" />,
};

export default function DashboardPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () => memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data, isLoading } = useTeamDashboardQuery(
    { leagueId: leagueId as number, teamId: myTeamId as number },
    { skip: !leagueId || !myTeamId },
  );

  // The record and this week's matchups come from the scoring engine, which
  // is a league-wide thing rather than a team one — hence two more queries
  // rather than more fields on the dashboard payload.
  const { data: table } = useLeagueStandingsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const { data: schedule } = useLeagueMatchupsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const { data: totals } = useCategoryTotalsQuery(
    { leagueId: leagueId as number, range: { kind: "ytd" } },
    { skip: !leagueId },
  );

  // Where this team sits, and how it stands in each of the nine.
  const myRow = useMemo(
    () => table?.standings.find((row) => row.id === myTeamId) ?? null,
    [table, myTeamId],
  );
  const myRank = useMemo(() => {
    const index = (table?.standings ?? []).findIndex(
      (row) => row.id === myTeamId,
    );
    return index < 0 ? null : index + 1;
  }, [table, myTeamId]);

  /**
   * This team's rank in each category, and a 0-100 bar to draw it with.
   *
   * Ranked here rather than on the server because it is a view of a table
   * the page already has, and a second endpoint returning the same numbers
   * ordered differently is a second thing that can disagree.
   */
  const categoryStandings = useMemo(() => {
    const teams = totals?.teams ?? [];
    if (!myTeamId || teams.length === 0) return [];

    return (totals?.categories ?? []).map((category) => {
      const ranked = [...teams].sort((a, b) =>
        category.lowerBetter
          ? a[category.key] - b[category.key]
          : b[category.key] - a[category.key],
      );
      const rank =
        ranked.findIndex((row) => row.teamId === myTeamId) + 1 || teams.length;

      return {
        label: category.label,
        rank,
        // Best is a full bar, worst is a short one.
        value: ((teams.length - rank + 1) / teams.length) * 100,
      };
    });
  }, [totals, myTeamId]);

  /** This week's matchups, whichever week the league is in. */
  const weekMatchups = useMemo(() => {
    const week = schedule?.currentWeek ?? 0;
    if (!week) return [];
    return (schedule?.matchups ?? []).filter((row) => row.week === week);
  }, [schedule]);

  const teamsById = useMemo(
    () => new Map((schedule?.teams ?? []).map((team) => [team.id, team])),
    [schedule],
  );

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see your front office.
        </p>
      </div>
    );
  }

  // A commissioner without a franchise, or a member who has not been assigned
  // one yet. There is no team to show rather than an empty one.
  if (!myTeamId && memberships.length > 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          You do not hold a team in this league
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Ask the commissioner to assign you one, and this page becomes your
          front office.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <p className="text-sm text-brand-muted">Loading your front office…</p>;
  }

  const { team, cap, hardCap, roster, attention, upcoming, activity } = data;
  const nextEvent = upcoming[0];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <TeamLogo name={team.name} src={team.logo} className="h-11 w-11" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-brand-dark sm:text-3xl">
            {team.name} Front Office
          </h1>
          <p className="text-xs text-brand-muted">
            {team.abbr} · {seasonLabel(data.seasonStartYear)} ·{" "}
            {data.league.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="RECORD"
          value={
            myRow
              ? `${myRow.w}-${myRow.l}${myRow.t > 0 ? `-${myRow.t}` : ""}`
              : "0-0"
          }
          href="/league/standings"
          sub={
            <span className="flex items-center gap-2">
              {myRank ? (
                <span className="rounded-full bg-brand-cta/15 px-2 py-0.5 text-[11px] font-semibold text-brand-cta-dark">
                  {ordinal(myRank)}
                </span>
              ) : null}
              <span>
                {(table?.settledWeeks ?? 0) > 0
                  ? `${table?.settledWeeks} week${table?.settledWeeks === 1 ? "" : "s"} played`
                  : "No week settled yet"}
              </span>
            </span>
          }
        />

        <Tile
          label="TEAM SALARY"
          value={cap.isSet ? short(cap.teamSalary) : money(cap.teamSalary)}
          href="/my-team/contracts"
          sub={
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIER_TONE[cap.tier]}`}
            >
              {cap.tierLabel}
            </span>
          }
        />

        <Tile
          label="CAP SPACE"
          value={cap.capSpace === null ? "—" : short(cap.capSpace)}
          tone={
            cap.capSpace !== null && cap.capSpace < 0
              ? "text-red-500"
              : "text-brand-cta-dark"
          }
          href="/my-team/payroll-simulator"
          sub={
            cap.isSet
              ? `Cap ${short(cap.salaryCap)} · Tax ${short(cap.luxuryTax)}`
              : "The commissioner has not set a salary cap."
          }
        />

        <Tile
          label="ROSTER"
          value={`${roster.rosterForMinimum}${roster.maxRosterSize > 0 ? ` / ${roster.maxRosterSize}` : ""}`}
          tone={
            roster.overMaximum || roster.belowMinimum
              ? "text-amber-600"
              : "text-brand-dark"
          }
          href="/my-team"
          sub={
            [
              roster.twoWay > 0 ? `${roster.twoWay} two-way` : null,
              roster.injuredReserve > 0 ? `${roster.injuredReserve} IR` : null,
              roster.rightsHeld > 0 ? `${roster.rightsHeld} rights held` : null,
            ]
              .filter(Boolean)
              .join(" · ") || `Minimum ${roster.minRosterSize}`
          }
        />

        <Tile
          label="UP NEXT"
          value={nextEvent ? eventDate(nextEvent) : "—"}
          sub={
            nextEvent ? (
              <span className="flex items-center gap-1.5">
                <span className="truncate">{nextEvent.title}</span>
                {nextEvent.isLive ? (
                  <span className="shrink-0 rounded bg-brand-cta/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-cta-dark">
                    LIVE
                  </span>
                ) : null}
              </span>
            ) : (
              "Nothing on the league calendar."
            )
          }
        />
      </div>

      {attention.length > 0 ? <Attention items={attention} /> : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={
              schedule?.currentWeek
                ? `Week ${schedule.currentWeek} Matchups`
                : "Matchups"
            }
            href="/league/schedule"
          />
          {weekMatchups.length === 0 ? (
            <p className="text-sm text-brand-muted">
              No matchups this week. A commissioner draws the schedule from
              Standings.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {weekMatchups.map((matchup) => (
                <div key={matchup.id} className="py-1">
                  {[
                    { id: matchup.awayId, score: matchup.awayScore },
                    { id: matchup.homeId, score: matchup.homeScore },
                  ].map((side) => {
                    const team = side.id ? teamsById.get(side.id) : undefined;
                    const won = matchup.winnerId === side.id;
                    return (
                      <div
                        key={`${matchup.id}-${side.id ?? "tbd"}`}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <TeamLogo
                            name={team?.name ?? "TBD"}
                            src={team?.logo}
                            className="h-8 w-8 text-xs"
                            rounded="rounded-full"
                          />
                          <span className="truncate text-sm font-medium text-brand-dark">
                            {team?.name ?? "TBD"}
                          </span>
                          <span className="shrink-0 text-xs text-brand-muted">
                            {team?.record ?? ""}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 text-sm font-semibold ${
                            won
                              ? "text-brand-cta-dark"
                              : matchup.status === "final"
                                ? "text-red-500"
                                : "text-brand-muted"
                          }`}
                        >
                          {matchup.status === "upcoming" ? "—" : side.score}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Category Standings" href="/league/standings" />
          {categoryStandings.length === 0 ? (
            <p className="text-sm text-brand-muted">
              Category ranks appear once a week has been settled.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {categoryStandings.map((category) => {
                const tone =
                  category.rank <= 3
                    ? "bg-brand-cta"
                    : category.rank <= 8
                      ? "bg-amber-400"
                      : "bg-red-400";
                return (
                  <div key={category.label} className="flex items-center gap-2">
                    <span className="w-9 shrink-0 text-xs font-semibold text-brand-dark">
                      {category.label}
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-border">
                      <span
                        className={`block h-full rounded-full ${tone}`}
                        style={{ width: `${category.value}%` }}
                      />
                    </span>
                    <span className="w-8 shrink-0 text-right text-xs text-brand-muted">
                      {ordinal(category.rank)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cap Sheet" href="/my-team/contracts" />
          <dl className="space-y-2 text-sm">
            {[
              { label: "Payroll", value: cap.payroll },
              { label: "Dead money", value: cap.deadMoney },
              { label: "Cap holds", value: cap.capHolds },
            ].map((row) => (
              <div key={row.label} className="flex justify-between">
                <dt className="text-brand-muted">{row.label}</dt>
                <dd className="font-medium text-brand-dark">
                  {money(row.value)}
                </dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-brand-border pt-2">
              <dt className="font-semibold text-brand-dark">Team salary</dt>
              <dd className="font-bold text-brand-dark">
                {money(cap.teamSalary)}
              </dd>
            </div>
          </dl>

          <CapBar cap={cap} hardCap={hardCap} />

          {hardCap.apron ? (
            <p
              className={`mt-3 text-xs font-medium ${
                hardCap.pass ? "text-brand-dark" : "text-red-600"
              }`}
            >
              <span className="font-semibold">
                Hard cap · {hardCap.apronLabel}.
              </span>{" "}
              {hardCap.message}
              {hardCap.triggerLabel ? ` ${hardCap.triggerLabel}.` : ""}
            </p>
          ) : null}

          {data.exceptions.length > 0 ? (
            <div className="mt-3 border-t border-brand-border pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Trade exceptions
              </p>
              <ul className="mt-1.5 space-y-1">
                {data.exceptions.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-brand-dark">
                      {row.label}
                      <span className="ml-1.5 text-brand-muted">
                        expires {formatDate(row.expiresAt)}
                      </span>
                    </span>
                    <span className="text-brand-muted">
                      {money(row.remaining)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Card>
          <CardHeader title="League Calendar" />
          {upcoming.length === 0 ? (
            <p className="text-sm text-brand-muted">
              The commissioner has not put any dates on the calendar.
            </p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {upcoming.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start justify-between gap-3 py-2.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-brand-muted">
                      <FiCalendar className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-dark">
                        {event.title}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${PHASE_COLOR[event.phase]}`}
                      >
                        {PHASE_LABEL[event.phase]}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-brand-muted">
                    {eventDate(event)}
                    {event.isApproximate ? " (approx.)" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Draft Assets" href="/my-team/draft-picks" />
          {data.draftAssets.total === 0 ? (
            <p className="text-sm text-brand-muted">
              No picks on the books. The commissioner generates them from Draft
              Picks.
            </p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {data.draftAssets.byYear.map((year) => (
                <li
                  key={year.seasonStartYear}
                  className="flex items-center justify-between py-2.5 text-sm"
                >
                  <span className="font-medium text-brand-dark">
                    {year.seasonStartYear}
                  </span>
                  <span className="text-brand-muted">
                    {[
                      year.firstRound > 0
                        ? `${year.firstRound} × 1st`
                        : null,
                      year.secondRound > 0
                        ? `${year.secondRound} × 2nd`
                        : null,
                      year.viaTrade > 0 ? `${year.viaTrade} via trade` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Recent Transactions" />
          {activity.length === 0 ? (
            <p className="text-sm text-brand-muted">
              Nothing has moved yet. Trades, signings and pick movements show up
              here.
            </p>
          ) : (
            <ul className="space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
                    {ACTIVITY_ICON[item.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-brand-dark">
                        {item.type}
                        {item.teams ? (
                          <span className="font-normal text-brand-muted">
                            {" "}— {item.teams}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-brand-muted">
                        {timeAgo(item.date)}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="mt-0.5 text-xs text-brand-muted">
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
