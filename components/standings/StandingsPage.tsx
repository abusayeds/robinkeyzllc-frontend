"use client";

import { useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
import {
  useCategoryTotalsQuery,
  useGenerateScheduleMutation,
  useLeaguePlayoffsQuery,
  useLeagueStandingsQuery,
  useSettleWeeksMutation,
  type CategoryRange,
  type StandingRow,
} from "@/lib/store/api/endpoints/standingsApi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { getApiErrorMessage } from "@/lib/store/api";
import { useAppSelector } from "@/lib/store/hooks";
import StandingsTable from "./StandingsTable";
import StatTable, { type StatRow } from "./StatTable";
import PlayoffBracket from "./PlayoffBracket";
import { byWins } from "./utils";

const TABS = [
  "Conference",
  "League",
  "Weekly Stats",
  "Season Stats",
  "Playoffs",
] as const;
type Tab = (typeof TABS)[number];

const PERIODS = ["YTD", "By Period", "By Date"] as const;
type Period = (typeof PERIODS)[number];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

/** "May 17–19, 2025" — the meta line beside a week's title. */
const weekRange = (start: string, end: string) => {
  const from = new Date(start);
  const to = new Date(end);
  const month = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const day = (date: Date) => date.getUTCDate();

  return month(from) === month(to)
    ? `${month(from)} ${day(from)}–${day(to)}, ${to.getUTCFullYear()}`
    : `${month(from)} ${day(from)} – ${month(to)} ${day(to)}, ${to.getUTCFullYear()}`;
};

function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (value: Period) => void;
}) {
  return (
    <div className="flex rounded-lg border border-brand-border p-0.5">
      {PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
            value === period
              ? "bg-brand-cta text-white"
              : "text-brand-muted hover:text-brand-dark"
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  meta,
  legend,
  children,
}: {
  title: string;
  meta?: string;
  legend?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border px-4 py-3">
        <h2 className="text-sm font-semibold text-brand-dark">
          {title}
          {meta ? (
            <span className="ml-2 text-xs font-normal text-brand-muted">
              {meta}
            </span>
          ) : null}
        </h2>
        {legend ? (
          <div className="flex items-center gap-3 text-[11px] text-brand-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-cta" /> Above average
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Below average
            </span>
          </div>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Downloads what is on screen. The design has the button; this is its handler. */
function downloadCsv(name: string, header: string[], rows: (string | number)[][]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const csv = [header, ...rows]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function StandingsPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const role = useAppSelector((s) => s.auth.role);

  const [tab, setTab] = useState<Tab>("Conference");
  const [period, setPeriod] = useState<Period>("YTD");
  const [pickedWeek, setPickedWeek] = useState<number | null>(null);
  const [dates, setDates] = useState({ from: "", to: "" });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useLeagueStandingsQuery(
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

  const week = pickedWeek ?? data?.week ?? 0;

  // Which weeks the stat tables add up. The toggle picks one of the three and
  // the server does the totalling, because a range of weeks has to be summed
  // from makes and attempts rather than from percentages.
  const range: CategoryRange = useMemo(() => {
    if (period === "By Period" && week > 0) return { kind: "week", week };
    if (period === "By Date" && dates.from && dates.to) {
      return { kind: "dates", from: dates.from, to: dates.to };
    }
    return { kind: "ytd" };
  }, [period, week, dates]);

  const statsTabOpen = tab === "Weekly Stats" || tab === "Season Stats";

  const { data: totals } = useCategoryTotalsQuery(
    { leagueId: leagueId as number, range },
    { skip: !leagueId || !statsTabOpen },
  );

  const { data: playoffs } = useLeaguePlayoffsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId || tab !== "Playoffs" },
  );

  const [generate, { isLoading: generating }] = useGenerateScheduleMutation();
  const [settle, { isLoading: settling }] = useSettleWeeksMutation();

  // Memoised because `?? []` would be a fresh array on every render, which
  // would make every table below re-sort for nothing.
  const standings = useMemo(() => data?.standings ?? [], [data]);

  const teamById = useMemo(
    () => new Map(standings.map((row) => [row.id, row])),
    [standings],
  );

  const east = useMemo(
    () => standings.filter((r) => r.conference === "East").sort(byWins),
    [standings],
  );
  const west = useMemo(
    () => standings.filter((r) => r.conference === "West").sort(byWins),
    [standings],
  );
  const combined = useMemo(() => [...standings].sort(byWins), [standings]);

  const toStatRow = (
    row: NonNullable<typeof totals>["teams"][number],
    primary: number,
  ): StatRow => {
    const team = teamById.get(row.teamId);
    return {
      id: row.teamId,
      team: team?.team ?? `Team ${row.teamId}`,
      logo: team?.logo ?? null,
      yourTeam: row.teamId === myTeamId,
      primary,
      stats: {
        fgPct: row.fgPct,
        ftPct: row.ftPct,
        threes: row.threes,
        pts: row.pts,
        reb: row.reb,
        ast: row.ast,
        stl: row.stl,
        blk: row.blk,
        to: row.to,
      },
    };
  };

  // Highest first, the way a table of totals is read.
  const weeklyRows: StatRow[] = useMemo(
    () =>
      (totals?.teams ?? [])
        .map((row) => toStatRow(row, row.weekPoints))
        .sort((a, b) => b.primary - a.primary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totals, teamById, myTeamId],
  );

  const seasonRows: StatRow[] = useMemo(
    () =>
      (totals?.teams ?? [])
        .map((row) => toStatRow(row, row.h2hWins))
        .sort((a, b) => b.primary - a.primary),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totals, teamById, myTeamId],
  );

  const activeWeek = data?.weeks.find((w) => w.weekNumber === week);

  const periodMeta =
    period === "By Date" && dates.from && dates.to
      ? `${formatDate(dates.from)} – ${formatDate(dates.to)}`
      : activeWeek
        ? weekRange(activeWeek.startDate, activeWeek.endDate)
        : undefined;

  function exportCurrent() {
    if (tab === "Playoffs") {
      downloadCsv(
        "playoffs",
        ["Round", "Conference", "Home", "Home Cats", "Away", "Away Cats"],
        (playoffs?.series ?? []).map((series) => [
          series.round,
          series.conference,
          series.home?.team ?? "TBD",
          series.homeWins,
          series.away?.team ?? "TBD",
          series.awayWins,
        ]),
      );
      return;
    }

    if (statsTabOpen) {
      const rows = tab === "Weekly Stats" ? weeklyRows : seasonRows;
      downloadCsv(
        tab === "Weekly Stats" ? "weekly-stats" : "season-stats",
        [
          "Team",
          tab === "Weekly Stats" ? "WK PTS" : "H2H W",
          ...(totals?.categories ?? []).map((c) => c.label),
        ],
        rows.map((row) => [
          row.team,
          row.primary,
          row.stats.fgPct,
          row.stats.ftPct,
          row.stats.threes,
          row.stats.pts,
          row.stats.reb,
          row.stats.ast,
          row.stats.stl,
          row.stats.blk,
          row.stats.to,
        ]),
      );
      return;
    }

    const rows: StandingRow[] = tab === "League" ? combined : [...east, ...west];
    downloadCsv(
      "standings",
      ["Team", "Conf", "W", "L", "T", "Div", "L10", "Streak", "PF", "PA"],
      rows.map((row) => [
        row.team,
        row.conference,
        row.w,
        row.l,
        row.t,
        row.div,
        row.l10,
        row.streak,
        row.ptsFor,
        row.ptsAgainst,
      ]),
    );
  }

  async function run(action: () => Promise<unknown>, fallback: string) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(getApiErrorMessage(err, fallback));
    }
  }

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see its standings.
        </p>
      </div>
    );
  }

  const canManage = role === "commissioner" || role === "admin";
  const hasSchedule = (data?.weeks.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Standings</h1>
        <p className="text-sm text-brand-muted">
          Conference and league standings, weekly and season stats, and the
          playoff picture.
        </p>
      </div>

      {/* A state the design does not draw, because it only shows a league in
          mid-season: before a schedule exists there is nothing to stand. */}
      {!isLoading && !hasSchedule ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          <span>
            This season has no schedule yet, so there are no results to stand.
          </span>
          {canManage ? (
            <button
              type="button"
              disabled={generating}
              onClick={() =>
                run(
                  () => generate({ leagueId }).unwrap(),
                  "Could not generate the schedule.",
                )
              }
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {generating ? "Generating…" : "Generate Schedule"}
            </button>
          ) : null}
        </div>
      ) : null}

      {!isLoading && hasSchedule && data?.settledWeeks === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-brand-soft/60 px-4 py-2.5 text-sm text-brand-muted">
          <span>
            {data.weeks.length} weeks drawn. No week has finished and been
            settled yet, so every record reads 0-0.
          </span>
          {canManage ? (
            <button
              type="button"
              disabled={settling}
              onClick={() =>
                run(
                  () => settle({ leagueId }).unwrap(),
                  "Could not settle the finished weeks.",
                )
              }
              className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-60"
            >
              {settling ? "Settling…" : "Settle Finished Weeks"}
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border">
        <div className="flex flex-wrap gap-1">
          {TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`relative px-3 py-2.5 text-sm font-medium transition ${
                tab === item
                  ? "text-brand-dark"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {item}
              {tab === item ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
              ) : null}
            </button>
          ))}
        </div>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          {statsTabOpen ? (
            <PeriodToggle value={period} onChange={setPeriod} />
          ) : null}

          {statsTabOpen && period === "By Period" ? (
            <select
              value={week}
              onChange={(e) => setPickedWeek(Number(e.target.value))}
              className="rounded-lg border border-brand-border px-2 py-1.5 text-xs font-semibold text-brand-dark outline-none focus:border-brand-cta"
            >
              {(data?.weeks ?? []).map((option) => (
                <option key={option.weekNumber} value={option.weekNumber}>
                  Week {option.weekNumber}
                  {option.isSettled ? "" : " (open)"}
                </option>
              ))}
            </select>
          ) : null}

          {statsTabOpen && period === "By Date" ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dates.from}
                onChange={(e) =>
                  setDates((d) => ({ ...d, from: e.target.value }))
                }
                className="rounded-lg border border-brand-border px-2 py-1.5 text-xs text-brand-dark outline-none focus:border-brand-cta"
              />
              <span className="text-xs text-brand-muted">to</span>
              <input
                type="date"
                value={dates.to}
                onChange={(e) => setDates((d) => ({ ...d, to: e.target.value }))}
                className="rounded-lg border border-brand-border px-2 py-1.5 text-xs text-brand-dark outline-none focus:border-brand-cta"
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={exportCurrent}
            className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            <FiDownload className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {tab === "Conference" ? (
        <div className="space-y-6">
          {[
            { title: "Eastern Conference", rows: east },
            { title: "Western Conference", rows: west },
          ].map((group) => (
            <SectionCard
              key={group.title}
              title={group.title}
              meta={`${group.rows.length} teams`}
            >
              <StandingsTable rows={group.rows} myTeamId={myTeamId} />
            </SectionCard>
          ))}
        </div>
      ) : null}

      {tab === "League" ? (
        <SectionCard title="Combined View" meta={`${combined.length} teams`}>
          <StandingsTable rows={combined} showConf myTeamId={myTeamId} />
        </SectionCard>
      ) : null}

      {tab === "Weekly Stats" ? (
        <SectionCard
          title={
            period === "YTD"
              ? "Season Category Totals"
              : `Week ${week} Category Totals`
          }
          meta={period === "YTD" ? "Year to date" : periodMeta}
          legend
        >
          <StatTable rows={weeklyRows} primaryLabel="WK PTS" />
        </SectionCard>
      ) : null}

      {tab === "Season Stats" ? (
        <SectionCard
          title="Season Accumulated Totals"
          meta={
            period === "YTD"
              ? `${data?.season ?? ""} · Weeks 1–${data?.settledWeeks ?? 0}`
              : periodMeta
          }
          legend
        >
          <StatTable rows={seasonRows} primaryLabel="H2H W" />
        </SectionCard>
      ) : null}

      {tab === "Playoffs" && playoffs ? (
        <PlayoffBracket playoffs={playoffs} />
      ) : null}
    </div>
  );
}
