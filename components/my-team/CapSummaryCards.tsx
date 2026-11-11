"use client";

import type { RosterRules } from "@/lib/store/api/endpoints/rosterApi";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

export default function CapSummaryCards({
  cap,
  counts,
  rules,
}: {
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
  const cards = [
    { label: "Payroll", value: short(cap.payroll), sub: "Active contracts" },
    {
      label: "Dead money",
      value: short(cap.deadMoney),
      sub: cap.deadMoney > 0 ? "Players no longer held" : "None",
      tone: cap.deadMoney > 0 ? "text-amber-600" : undefined,
    },
    {
      label: "Cap holds",
      value: short(cap.capHolds),
      sub: counts.rightsHeld
        ? `${counts.rightsHeld} player${counts.rightsHeld === 1 ? "" : "s"}`
        : "None",
    },
    {
      label: "Committed",
      value: short(cap.committed),
      sub:
        cap.salaryCap > 0
          ? `Against ${short(cap.salaryCap)}`
          : "No cap set for this league",
    },
    {
      label: "Cap space",
      value: cap.capSpace === null ? "—" : short(cap.capSpace),
      sub:
        cap.capSpace === null
          ? "Set a salary cap first"
          : cap.capSpace < 0
            ? `${money(Math.abs(cap.capSpace))} over`
            : "Available",
      tone:
        cap.capSpace !== null && cap.capSpace < 0 ? "text-red-500" : undefined,
    },
    {
      label: "Roster",
      value: rules
        ? `${counts.standard} / ${rules.maxRosterSize}`
        : String(counts.standard),
      sub: counts.twoWay ? `+ ${counts.twoWay} two-way` : "No two-way deals",
      tone:
        rules && counts.standard > rules.maxRosterSize
          ? "text-red-500"
          : undefined,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-brand-border bg-white p-4 shadow-card"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
            {card.label}
          </p>
          <p
            className={`mt-1 text-xl font-bold ${card.tone ?? "text-brand-dark"}`}
          >
            {card.value}
          </p>
          <p className="text-[11px] text-brand-muted">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
