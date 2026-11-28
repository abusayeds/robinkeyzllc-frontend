"use client";

import { useEffect, useState } from "react";
import type { OutlookSeason } from "@/lib/store/api/endpoints/salaryApi";
import { money } from "@/lib/money";

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/** Room under a line, signed, with a dash for a year that has no figures. */
const room = (value: number | null) =>
  value === null ? "—" : `${value >= 0 ? "" : "−"}${money(Math.abs(value))}`;

const roomTone = (value: number | null) => {
  if (value === null) return "text-brand-muted";
  return value >= 0 ? "text-brand-cta-dark" : "text-red-500";
};

/** "room under $X" when there is room, "over $X" when there is not. */
const against = (room: number | null, line: number) => {
  if (room === null || line <= 0) return undefined;
  return room >= 0 ? `room under ${money(line)}` : `over ${money(line)}`;
};

/**
 * Where this payroll sits, in one line: the nearest line it is over and the
 * nearest it is still under. A season under everything says so plainly
 * rather than listing four amounts nobody is close to.
 */
function standingSentence(season: OutlookSeason): string | null {
  if (season.salaryCap <= 0) return null;

  const lines = [
    { label: "the cap", value: season.salaryCap },
    { label: "the tax line", value: season.luxuryTax },
    { label: "the 1st apron", value: season.firstApron },
    { label: "the 2nd apron", value: season.secondApron },
  ].filter((line) => line.value > 0);

  const over = lines.filter((line) => season.committed > line.value).pop();
  const under = lines.find((line) => season.committed <= line.value);

  const parts: string[] = [];
  if (over) {
    parts.push(`${money(season.committed - over.value)} over ${over.label}`);
  }
  if (under) {
    parts.push(`${money(under.value - season.committed)} under ${under.label}`);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Where a season's payroll stands, in the words the season cards use. */
function standing(season: OutlookSeason): { label: string; tone: string } {
  if (season.salaryCap <= 0)
    return { label: "No cap set", tone: "text-brand-muted" };
  if (season.committed === 0)
    return { label: "Open books", tone: "text-brand-muted" };
  if (season.committed > season.secondApron)
    return { label: "Over 2nd apron", tone: "text-red-600" };
  if (season.committed > season.firstApron)
    return { label: "Over 1st apron", tone: "text-red-500" };
  if (season.committed > season.luxuryTax)
    return { label: "Taxpayer", tone: "text-red-500" };
  if (season.committed < season.salaryFloor)
    return { label: "Below floor", tone: "text-amber-600" };
  return { label: "Cap room", tone: "text-brand-cta-dark" };
}

/**
 * The bar, drawn on one scale so every season can be compared with every
 * other: the widest thing on it is the second apron, plus a margin so a
 * payroll that clears it still has somewhere to be drawn.
 */
const SCALE_HEADROOM = 1.08;

function SalaryBar({ season }: { season: OutlookSeason }) {
  const scale = Math.max(
    season.secondApron * SCALE_HEADROOM,
    season.committed * SCALE_HEADROOM,
    1,
  );
  const at = (value: number) => `${Math.min(100, (value / scale) * 100)}%`;

  const parts = [
    { key: "guaranteed", value: season.guaranteed, color: "bg-emerald-700" },
    { key: "playerOptions", value: season.playerOptions, color: "bg-blue-600" },
    { key: "teamOptions", value: season.teamOptions, color: "bg-emerald-400" },
    {
      key: "notGuaranteed",
      value: season.notGuaranteed,
      color: "bg-emerald-300",
    },
    { key: "holds", value: season.capHolds, color: "bg-amber-400" },
    { key: "dead", value: season.deadMoney, color: "bg-red-600" },
  ].filter((part) => part.value > 0);

  const lines = [
    { label: "Floor", value: season.salaryFloor, color: "bg-brand-muted" },
    { label: "Cap", value: season.salaryCap, color: "bg-brand-dark" },
    { label: "Tax", value: season.luxuryTax, color: "bg-red-500" },
    { label: "Apron 1", value: season.firstApron, color: "bg-brand-dark" },
    { label: "Apron 2", value: season.secondApron, color: "bg-brand-dark" },
  ].filter((line) => line.value > 0);

  return (
    <div className="pt-6">
      <div className="relative h-4 w-full rounded-full bg-brand-soft">
        <div className="flex h-4 overflow-hidden rounded-full">
          {parts.map((part) => (
            <div
              key={part.key}
              className={part.color}
              style={{ width: at(part.value) }}
            />
          ))}
        </div>

        {lines.map((line) => (
          <div
            key={line.label}
            className="absolute -top-5 flex -translate-x-1/2 flex-col items-center"
            style={{ left: at(line.value) }}
          >
            <span className="whitespace-nowrap text-[9px] font-semibold text-brand-muted">
              {line.label}
            </span>
            <span className={`h-5 w-px ${line.color}`} />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-brand-muted">
        <span>$0</span>
        <span>{money(Math.round(scale))}</span>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-brand-soft/60 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-base font-bold ${tone ?? "text-brand-dark"}`}>
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[10px] text-brand-muted">{sub}</p>
      ) : null}
    </div>
  );
}

/**
 * The top half of the Contracts page: one card per league year, and the
 * whole picture for whichever one is open.
 *
 * Each card is a button rather than a link because the season it selects is
 * the page's own state — the table below it and this panel read the same
 * choice, which is what makes clicking 2029-30 mean anything.
 */
export default function SeasonCapOverview({
  seasons,
  selected,
  onSelect,
  capGrowthPct,
}: {
  seasons: OutlookSeason[];
  selected: number;
  onSelect: (seasonStartYear: number) => void;
  /** What future league years are projected at, for the footnote. */
  capGrowthPct: number | null;
}) {
  // A team whose seasons change under it — a different team picked in the
  // selector — should not keep showing a year that is no longer on screen.
  useEffect(() => {
    if (seasons.length === 0) return;
    if (!seasons.some((season) => season.seasonStartYear === selected)) {
      onSelect(seasons[0].seasonStartYear);
    }
  }, [seasons, selected, onSelect]);

  const open =
    seasons.find((season) => season.seasonStartYear === selected) ??
    seasons[0] ??
    null;

  if (!open) return null;

  const anyProjected = seasons.some((season) => season.capIsProjected);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {seasons.map((season) => {
          const state = standing(season);
          const isOpen = season.seasonStartYear === open.seasonStartYear;
          const fill =
            season.salaryCap > 0
              ? Math.min(100, (season.committed / season.salaryCap) * 100)
              : 0;

          return (
            <button
              key={season.seasonStartYear}
              type="button"
              onClick={() => onSelect(season.seasonStartYear)}
              aria-pressed={isOpen}
              className={`rounded-xl border px-3 py-2.5 text-left transition ${
                isOpen
                  ? "border-brand-dark bg-brand-dark text-white"
                  : "border-brand-border bg-white hover:border-brand-cta/50"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[11px] font-semibold ${
                    isOpen ? "text-white/70" : "text-brand-muted"
                  }`}
                >
                  {seasonLabel(season.seasonStartYear)}
                </span>
                {season.seasonStartYear === seasons[0].seasonStartYear ? (
                  <span
                    className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                      isOpen
                        ? "bg-white/20 text-white"
                        : "bg-brand-cta/15 text-brand-cta-dark"
                    }`}
                  >
                    NOW
                  </span>
                ) : null}
              </div>

              <p
                className={`mt-0.5 text-sm font-bold ${
                  isOpen ? "text-white" : "text-brand-dark"
                }`}
              >
                {money(season.committed)}
              </p>

              <div
                className={`mt-1.5 h-1 w-full rounded-full ${
                  isOpen ? "bg-white/20" : "bg-brand-soft"
                }`}
              >
                <div
                  className={`h-1 rounded-full ${
                    isOpen ? "bg-white" : "bg-brand-cta"
                  }`}
                  style={{ width: `${fill}%` }}
                />
              </div>

              <div className="mt-1 flex items-baseline justify-between gap-1">
                <span
                  className={`text-[10px] font-semibold ${
                    isOpen ? "text-white/80" : state.tone
                  }`}
                >
                  {state.label}
                </span>
                <span
                  className={`whitespace-nowrap text-[10px] ${
                    isOpen ? "text-white/60" : "text-brand-muted"
                  }`}
                >
                  {season.playerCount}
                  {season.twoWayCount > 0
                    ? ` + ${season.twoWayCount} TW`
                    : ""}{" "}
                  player{season.playerCount === 1 ? "" : "s"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              {seasonLabel(open.seasonStartYear)} · Team Salary
            </p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-2">
              <span className="text-2xl font-bold text-brand-dark">
                {money(open.committed)}
              </span>
              {standingSentence(open) ? (
                <span
                  className={`text-sm font-medium ${
                    (open.capSpace ?? 0) < 0
                      ? "text-red-500"
                      : "text-brand-cta-dark"
                  }`}
                >
                  {standingSentence(open)}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            {[
              {
                label: "Guaranteed",
                value: open.guaranteed,
                dot: "bg-emerald-700",
              },
              {
                label: "Player options",
                value: open.playerOptions,
                dot: "bg-blue-600",
              },
              {
                label: "Team options",
                value: open.teamOptions,
                dot: "bg-emerald-400",
              },
              {
                label: "Non-guaranteed",
                value: open.notGuaranteed,
                dot: "bg-emerald-300",
              },
              { label: "Cap holds", value: open.capHolds, dot: "bg-amber-400" },
              { label: "Dead cap", value: open.deadMoney, dot: "bg-red-600" },
            ]
              .filter((part) => part.value > 0)
              .map((part) => (
                <span key={part.label} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${part.dot}`} />
                  <span className="text-brand-muted">{part.label}</span>
                  <span className="font-semibold text-brand-dark">
                    {money(part.value)}
                  </span>
                </span>
              ))}
          </div>
        </div>

        <SalaryBar season={open} />

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <Tile
            label="Cap space"
            value={room(open.capSpace)}
            tone={roomTone(open.capSpace)}
            sub={against(open.capSpace, open.salaryCap)}
          />
          <Tile
            label="Tax line"
            value={room(open.luxuryTaxRoom)}
            tone={roomTone(open.luxuryTaxRoom)}
            sub={against(open.luxuryTaxRoom, open.luxuryTax)}
          />
          <Tile
            label="1st apron"
            value={room(open.firstApronRoom)}
            tone={roomTone(open.firstApronRoom)}
            sub={against(open.firstApronRoom, open.firstApron)}
          />
          <Tile
            label="2nd apron"
            value={room(open.secondApronRoom)}
            tone={roomTone(open.secondApronRoom)}
            sub={against(open.secondApronRoom, open.secondApron)}
          />
          <Tile
            label="Options & non-guaranteed"
            value={money(
              open.playerOptions + open.teamOptions + open.notGuaranteed,
            )}
            sub="not locked in yet"
          />
          <Tile
            label="Top 3 share of payroll"
            value={
              open.topThreeSharePct === null ? "—" : `${open.topThreeSharePct}%`
            }
            sub={
              open.topThreeNames.length > 0
                ? open.topThreeNames.join(", ")
                : undefined
            }
          />
        </div>

        {open.capIsProjected ? (
          <p className="mt-3 text-[11px] text-brand-muted">
            {seasonLabel(open.seasonStartYear)} has no figures entered yet, so
            every line above is projected
            {capGrowthPct === null
              ? ""
              : ` at ${capGrowthPct}% cap growth a year`}
            . The commissioner sets that rate in League Settings, and real
            figures replace it as soon as they are entered.
          </p>
        ) : anyProjected && capGrowthPct !== null ? (
          <p className="mt-3 text-[11px] text-brand-muted">
            Later seasons without entered figures are projected at{" "}
            {capGrowthPct}% cap growth a year.
          </p>
        ) : null}
      </div>
    </div>
  );
}
