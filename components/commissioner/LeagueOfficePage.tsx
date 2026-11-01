"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiChevronRight,
  FiDollarSign,
  FiUsers,
} from "react-icons/fi";
import {
  PHASE_COLOR,
  PHASE_LABEL,
} from "@/lib/store/api/endpoints/calendarApi";
import {
  useLeagueOverviewQuery,
  type LeagueOverview,
} from "@/lib/store/api/endpoints/overviewApi";
import { useAppSelector } from "@/lib/store/hooks";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

function StatCard({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <div className="flex items-center gap-1.5 text-brand-muted">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em]">
          {label}
        </p>
      </div>
      <p className={`mt-1.5 text-2xl font-bold ${tone ?? "text-brand-dark"}`}>
        {value}
      </p>
      {sub ? <p className="text-[11px] text-brand-muted">{sub}</p> : null}
    </div>
  );
}

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-brand-border px-4 py-3">
        <h2 className="text-sm font-semibold text-brand-dark">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-cta-dark hover:underline"
          >
            Open
            <FiArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/**
 * What the commissioner still has to do, in the order it has to be done.
 *
 * Shown until the league is set up and then dropped entirely: a permanent row
 * of green ticks is noise on a page somebody opens every day.
 */
function SetupChecklist({ data }: { data: LeagueOverview }) {
  const steps = [
    {
      label: `Create teams (${data.setup.teamsCreated} of ${data.setup.teamCount})`,
      done: data.setup.teamsCreated >= data.setup.teamCount,
      href: "/league-office/teams",
    },
    {
      label: "Set the salary cap",
      done: data.setup.salaryCapSet,
      href: "/league-office/salary-cap",
    },
    {
      label: `Invite managers (${data.setup.membersJoined} joined)`,
      done: data.setup.membersJoined > 1,
      href: "/league-office/users",
    },
    {
      label: "Import players",
      done: data.setup.playersImported > 0,
      href: "/league-office/player-import",
    },
  ];

  if (steps.every((step) => step.done)) return null;

  return (
    <SectionCard title="Finish setting up">
      <ul className="divide-y divide-brand-border">
        {steps.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="flex items-center gap-2.5 py-2.5 transition hover:bg-brand-soft/60"
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  step.done
                    ? "bg-brand-cta text-white"
                    : "border border-brand-border text-brand-muted"
                }`}
              >
                {step.done ? <FiCheck className="h-3 w-3" /> : ""}
              </span>
              <span
                className={`flex-1 text-sm ${
                  step.done
                    ? "text-brand-muted line-through"
                    : "font-medium text-brand-dark"
                }`}
              >
                {step.label}
              </span>
              <FiChevronRight className="h-4 w-4 shrink-0 text-brand-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export default function LeagueOfficePage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data, isLoading } = useLeagueOverviewQuery(leagueId as number, {
    skip: !leagueId,
  });

  const alerts = useMemo(() => {
    if (!data) return [];
    const list: { label: string; sub: string; href: string; tone: string }[] = [];

    if (data.attention.pendingInvites > 0) {
      list.push({
        label: `${data.attention.pendingInvites} invite${data.attention.pendingInvites === 1 ? "" : "s"} awaiting a reply`,
        sub: "Nobody has accepted these yet.",
        href: "/league-office/users",
        tone: "bg-amber-400",
      });
    }
    if (data.attention.teamsWithoutOwner > 0) {
      list.push({
        label: `${data.attention.teamsWithoutOwner} team${data.attention.teamsWithoutOwner === 1 ? "" : "s"} without an owner`,
        sub: "Assign a manager from the users page.",
        href: "/league-office/users",
        tone: "bg-amber-400",
      });
    }
    if (data.attention.pendingOffers > 0) {
      list.push({
        label: `${data.attention.pendingOffers} free agency offer${data.attention.pendingOffers === 1 ? "" : "s"} pending`,
        sub: "Accept or decline them.",
        href: "/league-office/free-agency",
        tone: "bg-brand-cta",
      });
    }
    for (const team of data.attention.overRoster) {
      list.push({
        label: `${team.name} is over the roster limit`,
        sub: `${team.rosterCount} players${team.maxRosterSize ? ` against a limit of ${team.maxRosterSize}` : ""}.`,
        href: "/league-office/rosters",
        tone: "bg-red-500",
      });
    }
    // Rule 3.5 of the AVORA CBA: the salary floor is tracked and displayed,
    // and carries no penalty in Version 1. It used to sit here in red beside
    // real problems; it belongs under the cap snapshot instead.
    return list;
  }, [data]);

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to open its league office.
      </p>
    );
  }

  if (isLoading || !data) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const { payroll, players, teams, setup } = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark sm:text-3xl">
          {data.league.name} League Office
        </h1>
        <p className="text-sm text-brand-muted">
          {data.league.season} ·{" "}
          {data.league.setupMode === "startup" ? "Startup" : "Import"} league ·{" "}
          {data.league.visibility === "public" ? "Public" : "Private"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={<FiUsers className="h-3.5 w-3.5" />}
          label="Teams"
          value={`${teams.total} / ${teams.max}`}
          sub={`${teams.withOwner} with an owner`}
        />
        <StatCard
          icon={<FiUsers className="h-3.5 w-3.5" />}
          label="Managers"
          value={setup.membersJoined}
          sub={
            setup.pendingInvites
              ? `${setup.pendingInvites} invited, not joined`
              : "All invites answered"
          }
        />
        <StatCard
          icon={<FiUsers className="h-3.5 w-3.5" />}
          label="Players"
          value={players.total}
          sub={`${players.rostered} rostered · ${players.freeAgents + players.rightsHeld} free`}
        />
        <StatCard
          icon={<FiDollarSign className="h-3.5 w-3.5" />}
          label="Salary cap"
          value={payroll.salaryCap > 0 ? short(payroll.salaryCap) : "Not set"}
          sub={
            payroll.salaryFloor !== null
              ? `Floor ${short(payroll.salaryFloor)}`
              : "Set it in Salary Cap Settings"
          }
          tone={payroll.salaryCap > 0 ? undefined : "text-brand-muted"}
        />
        <StatCard
          icon={<FiAlertTriangle className="h-3.5 w-3.5" />}
          label="Needs attention"
          value={alerts.length}
          sub={alerts.length === 0 ? "Nothing outstanding" : "See below"}
          tone={alerts.length ? "text-red-500" : undefined}
        />
      </div>

      <SetupChecklist data={data} />

      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Needs attention">
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">
              Nothing needs you right now.
            </p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {alerts.map((alert) => (
                <li key={alert.label}>
                  <Link
                    href={alert.href}
                    className="flex items-start gap-2.5 py-2.5 transition hover:bg-brand-soft/60"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${alert.tone}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark">
                        {alert.label}
                      </p>
                      <p className="text-xs text-brand-muted">{alert.sub}</p>
                    </div>
                    <FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-brand-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="What is coming up" href="/league-office/calendar">
          {data.upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-brand-muted">
              No dates ahead on this league&apos;s calendar.
            </p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {data.upcoming.map((event) => (
                <li
                  key={event.id}
                  className="flex items-start gap-2.5 py-2.5"
                >
                  <FiCalendar className="mt-0.5 h-4 w-4 shrink-0 text-brand-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-brand-dark">
                      {event.title}
                    </p>
                    <p className="text-xs text-brand-muted">
                      {event.displayLabel ??
                        `${event.isApproximate ? "around " : ""}${formatDate(event.startDate)}${
                          event.endDate
                            ? ` – ${formatDate(event.endDate)}`
                            : ""
                        }`}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PHASE_COLOR[event.phase]}`}
                  >
                    {PHASE_LABEL[event.phase]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {data.tracking.belowFloor.length > 0 ? (
        <SectionCard title="Under the salary floor">
          {/* Rule 3.5 — tracked and shown, no penalty in Version 1. Kept apart
              from "needs attention" because it is not something to fix. */}
          <p className="text-[11px] text-brand-muted">
            Tracked only. There is no penalty for being under the floor.
          </p>
          <ul className="mt-2 space-y-1">
            {data.tracking.belowFloor.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-brand-dark">{team.name}</span>
                <span className="text-brand-muted">
                  {money(team.payroll)} of {money(team.salaryFloor)}
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}

      <SectionCard title="Salary snapshot" href="/league-office/salaries">
        {payroll.contractedPlayers === 0 ? (
          <p className="py-6 text-center text-sm text-brand-muted">
            No contracts yet, so there is nothing to measure.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
                  Average salary
                </p>
                <p className="mt-0.5 text-lg font-bold text-brand-dark">
                  {payroll.averagePlayerSalary !== null
                    ? money(payroll.averagePlayerSalary)
                    : "—"}
                </p>
                <p className="text-[11px] text-brand-muted">
                  {money(payroll.total)} over {payroll.contractedPlayers}{" "}
                  contract{payroll.contractedPlayers === 1 ? "" : "s"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
                  Average payroll
                </p>
                <p className="mt-0.5 text-lg font-bold text-brand-dark">
                  {payroll.averageTeamPayroll !== null
                    ? money(payroll.averageTeamPayroll)
                    : "—"}
                </p>
                <p className="text-[11px] text-brand-muted">
                  Across teams that have one
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
                  Highest
                </p>
                {payroll.highest ? (
                  <>
                    <p className="text-xs font-semibold text-brand-cta-dark">
                      {payroll.highest.name}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-brand-dark">
                      {money(payroll.highest.payroll)}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-lg font-bold text-brand-dark">—</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
                  Lowest
                </p>
                {payroll.lowest ? (
                  <>
                    <p className="text-xs font-semibold text-brand-muted">
                      {payroll.lowest.name}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-brand-dark">
                      {money(payroll.lowest.payroll)}
                    </p>
                  </>
                ) : (
                  <p className="mt-0.5 text-lg font-bold text-brand-dark">—</p>
                )}
              </div>
            </div>

            <ul className="mt-4 space-y-1.5">
              {data.teamTotals
                .filter((team) => team.payroll > 0)
                .sort((a, b) => b.payroll - a.payroll)
                .map((team) => {
                  const scale = payroll.highest?.payroll || 1;
                  return (
                    <li key={team.id} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-xs font-semibold text-brand-dark">
                        {team.abbr}
                      </span>
                      <span className="h-1.5 flex-1 rounded-full bg-brand-soft">
                        <span
                          className="block h-1.5 rounded-full"
                          style={{
                            width: `${(team.payroll / scale) * 100}%`,
                            backgroundColor: team.color,
                          }}
                        />
                      </span>
                      <span className="w-20 shrink-0 text-right text-xs text-brand-muted">
                        {short(team.payroll)}
                      </span>
                    </li>
                  );
                })}
            </ul>
          </>
        )}
      </SectionCard>
    </div>
  );
}
