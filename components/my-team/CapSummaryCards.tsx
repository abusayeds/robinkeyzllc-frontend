"use client";

import { FiBarChart2, FiDollarSign, FiFileText, FiInfo } from "react-icons/fi";
import type { RosterRules } from "@/lib/store/api/endpoints/rosterApi";
import { useLeagueSettingsQuery } from "@/lib/store/api/endpoints/leagueSettingsApi";
import { useTradeExceptionsQuery } from "@/lib/store/api/endpoints/tradeApi";
import { money } from "@/lib/money";

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

function CardHeader({
  icon,
  title,
  info,
}: {
  icon: React.ReactNode;
  title: string;
  info?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
        {icon}
      </span>
      <span className="flex items-center gap-1 text-sm font-semibold text-brand-dark">
        {title}
        {info ? <FiInfo className="h-3.5 w-3.5 text-brand-muted" /> : null}
      </span>
    </div>
  );
}

function ThresholdColumn({
  label,
  value,
  caption,
  alwaysGood = false,
}: {
  label: string;
  value: number | null;
  caption: string;
  alwaysGood?: boolean;
}) {
  return (
    <div className="min-w-0 px-2 py-2 text-center">
      <p className="truncate text-[10px] font-medium text-brand-muted">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-bold ${
          value === null
            ? "text-brand-muted"
            : !alwaysGood && value < 0
              ? "text-red-500"
              : "text-brand-cta-dark"
        }`}
      >
        {value === null ? "—" : short(value)}
      </p>
      <p className="mt-0.5 break-words text-[10px] text-brand-muted">
        {caption}
      </p>
    </div>
  );
}

/**
 * Frontend-phase Contracts top cards: Team Salary · Cap/Tax/Apron · Exceptions.
 * Figures come from the live roster + league settings, not the old dummy constants.
 */
export default function CapSummaryCards({
  leagueId,
  teamId,
  cap,
  counts,
  rules,
}: {
  leagueId: number;
  teamId: number;
  cap: {
    salaryCap: number;
    payroll: number;
    deadMoney: number;
    capHolds: number;
    committed: number;
    capSpace: number | null;
  };
  counts: {
    standard: number;
    twoWay: number;
    injuredReserve: number;
    rightsHeld: number;
  };
  rules: RosterRules;
}) {
  const { data: settings } = useLeagueSettingsQuery(leagueId);
  const { data: exceptions = [] } = useTradeExceptionsQuery({
    leagueId,
    teamId,
  });

  // Roster API already went through CapService — prefer it over settings so a
  // stale LeagueSettings.salaryCap of 0 cannot blank Cap Space again.
  const salaryCap = cap.salaryCap || settings?.salaryCap || 0;
  const thresholds = settings?.thresholds;
  const committed = cap.committed;
  const capSpace =
    cap.capSpace !== null && cap.capSpace !== undefined
      ? cap.capSpace
      : salaryCap > 0
        ? salaryCap - committed
        : null;
  const toTax =
    thresholds && salaryCap > 0 ? thresholds.luxuryTax - committed : null;
  const toFirst =
    thresholds && salaryCap > 0 ? thresholds.firstApron - committed : null;
  const toSecond =
    thresholds && salaryCap > 0 ? thresholds.secondApron - committed : null;
  const salaryFloor = thresholds?.salaryFloor ?? null;

  const activeExceptions = exceptions;
  const rosterLabel = rules
    ? `${counts.standard} / ${rules.maxRosterSize}`
    : String(counts.standard);
  const rosterSub = counts.twoWay
    ? `+ ${counts.twoWay} two-way`
    : `${counts.standard} active contracts`;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_2fr_1fr]">
      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <CardHeader
          icon={<FiDollarSign className="h-4 w-4" />}
          title="Team Salary"
        />
        <p className="mt-3 text-xl font-bold text-brand-dark">
          {short(committed)}
        </p>
        <p className="text-[11px] text-brand-muted">
          {rosterLabel} roster · {rosterSub}
        </p>
        {cap.deadMoney > 0 ? (
          <p className="mt-1 text-[11px] text-amber-600">
            Dead money {short(cap.deadMoney)}
          </p>
        ) : null}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <CardHeader
          icon={<FiBarChart2 className="h-4 w-4" />}
          title="Cap, Tax & Apron Thresholds"
        />
        <div className="mt-2 grid grid-cols-2 gap-y-3 sm:grid-cols-3 sm:divide-x sm:divide-brand-border md:grid-cols-5">
          <ThresholdColumn
            label="Cap Space"
            value={capSpace}
            caption={
              salaryCap > 0 ? `vs Cap: ${short(salaryCap)}` : "No cap set"
            }
          />
          <ThresholdColumn
            label="Salary Floor"
            value={salaryFloor}
            caption="Minimum required"
            alwaysGood
          />
          <ThresholdColumn
            label="Luxury Tax"
            value={toTax}
            caption={
              thresholds ? `Line: ${short(thresholds.luxuryTax)}` : "—"
            }
          />
          <ThresholdColumn
            label="1st Apron"
            value={toFirst}
            caption={
              thresholds ? `Line: ${short(thresholds.firstApron)}` : "—"
            }
          />
          <ThresholdColumn
            label="2nd Apron"
            value={toSecond}
            caption={
              thresholds ? `Line: ${short(thresholds.secondApron)}` : "—"
            }
          />
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <CardHeader
          icon={<FiFileText className="h-4 w-4" />}
          title="Available Exceptions"
          info
        />
        {activeExceptions.length === 0 ? (
          <p className="mt-3 text-xs text-brand-muted">No active TPEs.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {activeExceptions.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-brand-muted">{row.label}</span>
                <span className="shrink-0 font-semibold text-brand-cta-dark">
                  {money(row.remaining ?? row.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
