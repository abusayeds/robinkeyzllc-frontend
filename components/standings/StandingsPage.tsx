"use client";

import { useMemo, useState } from "react";
import { FiDownload } from "react-icons/fi";
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

export default function StandingsPage() {
  const standings = useAppSelector((state) => state.league.standings);
  const weeklyStats = useAppSelector((state) => state.league.weeklyStats);
  const seasonStats = useAppSelector((state) => state.league.seasonStats);
  const playoffs = useAppSelector((state) => state.league.playoffs);
  const week = useAppSelector((state) => state.league.week);

  const [tab, setTab] = useState<Tab>("Conference");
  const [period, setPeriod] = useState<Period>("YTD");

  const teamById = useMemo(() => {
    const map = new Map(standings.map((row) => [row.id, row]));
    return map;
  }, [standings]);

  const east = useMemo(
    () => standings.filter((r) => r.conference === "East").sort(byWins),
    [standings]
  );
  const west = useMemo(
    () => standings.filter((r) => r.conference === "West").sort(byWins),
    [standings]
  );
  const combined = useMemo(() => [...standings].sort(byWins), [standings]);

  const weeklyRows: StatRow[] = useMemo(
    () =>
      weeklyStats.map(({ teamId, wkPts, ...stats }) => ({
        id: teamId,
        team: teamById.get(teamId)?.team ?? teamId,
        yourTeam: teamById.get(teamId)?.yourTeam,
        primary: wkPts,
        stats,
      })),
    [weeklyStats, teamById]
  );

  const seasonRows: StatRow[] = useMemo(
    () =>
      seasonStats.map(({ teamId, h2hWins, ...stats }) => ({
        id: teamId,
        team: teamById.get(teamId)?.team ?? teamId,
        yourTeam: teamById.get(teamId)?.yourTeam,
        primary: h2hWins,
        stats,
      })),
    [seasonStats, teamById]
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Standings</h1>
        <p className="text-sm text-brand-muted">
          Conference and league standings, weekly and season stats, and the
          playoff picture.
        </p>
      </div>

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

        <div className="mb-2 flex items-center gap-2">
          {tab === "Weekly Stats" || tab === "Season Stats" ? (
            <PeriodToggle value={period} onChange={setPeriod} />
          ) : null}
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            <FiDownload className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

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
              <StandingsTable rows={group.rows} />
            </SectionCard>
          ))}
        </div>
      ) : null}

      {tab === "League" ? (
        <SectionCard title="Combined View" meta={`${combined.length} teams`}>
          <StandingsTable rows={combined} showConf />
        </SectionCard>
      ) : null}

      {tab === "Weekly Stats" ? (
        <SectionCard
          title={`Week ${week} Category Totals`}
          meta="May 17–19, 2025"
          legend
        >
          <StatTable rows={weeklyRows} primaryLabel="WK PTS" />
        </SectionCard>
      ) : null}

      {tab === "Season Stats" ? (
        <SectionCard
          title="Season Accumulated Totals"
          meta={`2024-25 · Weeks 1–${week}`}
          legend
        >
          <StatTable rows={seasonRows} primaryLabel="H2H W" />
        </SectionCard>
      ) : null}

      {tab === "Playoffs" ? <PlayoffBracket playoffs={playoffs} /> : null}
    </div>
  );
}
