"use client";

import type { PayrollOutlook } from "@/lib/store/api/endpoints/salaryApi";
import type {
  ContractSeason,
  RosterPlayer,
} from "@/lib/store/api/endpoints/rosterApi";

/**
 * The three cards beside the contracts table.
 *
 * Every figure comes from the league's own books: the breakdown is totalled
 * from the contracts on screen, and the outlook is the payroll endpoint's own
 * projection rather than a second guess at it.
 */

const money = (value: number) => {
  const millions = value / 1_000_000;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(millions);
  return `${sign}$${abs >= 100 ? Math.round(abs) : abs.toFixed(1)}M`;
};

const seasonLabel = (year: number) =>
  `${year}-${String((year + 1) % 100).padStart(2, "0")}`;

function Donut({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg
      viewBox="0 0 140 140"
      className="h-32 w-32 shrink-0"
      role="img"
      aria-label={`Payroll of ${money(total)}, split by how it is guaranteed`}
    >
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="#E5EBE8"
        strokeWidth="14"
      />
      {segments.map((segment) => {
        const length = total ? (segment.value / total) * circumference : 0;
        const arc = (
          <circle
            key={segment.label}
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="14"
            strokeDasharray={`${length} ${circumference - length}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 70 70)"
          />
        );
        offset += length;
        return arc;
      })}
      <text
        x="70"
        y="66"
        textAnchor="middle"
        className="fill-brand-dark text-sm font-bold"
      >
        {money(total)}
      </text>
      <text
        x="70"
        y="82"
        textAnchor="middle"
        className="fill-brand-muted text-[8px] font-semibold"
      >
        TOTAL PAYROLL
      </text>
    </svg>
  );
}

/**
 * How much of the payroll a team is actually committed to.
 *
 * A player option counts separately from a guarantee because the team does
 * not control it, and dead cap counts because it is owed whatever happens.
 */
export function ContractBreakdownCard({
  players,
  deadCap,
  seasonStartYear,
}: {
  players: RosterPlayer[];
  deadCap: number;
  seasonStartYear: number;
}) {
  let guaranteed = 0;
  let playerOption = 0;
  let nonGuaranteed = 0;

  for (const player of players) {
    const season = player.contract?.seasons.find(
      (row: ContractSeason) => row.seasonStartYear === seasonStartYear,
    );
    if (!season) continue;

    if (season.optionType === "player") {
      playerOption += season.capHit;
    } else if (season.guaranteeType === "none") {
      nonGuaranteed += season.capHit;
    } else if (season.guaranteeType === "partial") {
      // Split where the contract splits: the guaranteed part is owed, the
      // rest is not.
      guaranteed += season.guaranteedAmount ?? 0;
      nonGuaranteed += Math.max(0, season.capHit - (season.guaranteedAmount ?? 0));
    } else {
      guaranteed += season.capHit;
    }
  }

  const segments = [
    { label: "Guaranteed", value: guaranteed, color: "#16A34A" },
    { label: "Player Option", value: playerOption, color: "#3B82F6" },
    { label: "Non-Guaranteed", value: nonGuaranteed, color: "#F59E0B" },
    { label: "Dead Cap", value: deadCap, color: "#EF4444" },
  ];
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="min-w-0 rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-brand-dark">
        Contract Breakdown
      </p>
      {total === 0 ? (
        <p className="mt-2 text-xs text-brand-muted">
          Nothing on the books for {seasonLabel(seasonStartYear)}.
        </p>
      ) : (
        <div className="mt-3 flex flex-col items-center gap-3">
          <Donut segments={segments} total={total} />
          <ul className="w-full space-y-1.5 text-xs">
            {segments.map((segment) => (
              <li key={segment.label} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: segment.color }}
                />
                <span className="text-brand-muted">{segment.label}</span>
                <span className="ml-auto font-bold text-brand-dark">
                  {money(segment.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function RosterSummaryCard({
  counts,
  rosterMax,
  maxTwoWay,
}: {
  counts: {
    standard: number;
    twoWay: number;
    injuredReserve: number;
    rightsHeld: number;
  };
  rosterMax: number;
  maxTwoWay: number;
}) {
  const rows: [string, string][] = [
    ["Standard Contracts", `${counts.standard}/${rosterMax}`],
    ["Two-Way Contracts", `${counts.twoWay}/${maxTwoWay}`],
    ["Open Roster Spots", String(Math.max(0, rosterMax - counts.standard))],
    [
      "Total Players",
      String(counts.standard + counts.twoWay + counts.injuredReserve),
    ],
  ];

  return (
    <div className="min-w-0 rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="mb-2 text-sm font-semibold text-brand-dark">
        Roster Summary
      </p>
      <dl className="space-y-1.5 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between">
            <dt className="text-brand-muted">{label}</dt>
            <dd className="font-semibold text-brand-dark">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Five seasons of payroll against the four thresholds.
 *
 * A negative figure means the team is over that line, which is why it is
 * coloured rather than relabelled.
 */
export function FutureOutlookCard({
  outlook,
}: {
  outlook: PayrollOutlook | null;
}) {
  const seasons = (outlook?.seasons ?? []).slice(0, 5);

  if (seasons.length === 0) {
    return (
      <div className="min-w-0 rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-semibold text-brand-dark">
          Future Outlook
        </p>
        <p className="text-xs text-brand-muted">
          The outlook appears once a salary cap is set for this league year.
        </p>
      </div>
    );
  }

  const cap = outlook?.salaryCap ?? 0;
  const rows: { label: string; of: (committed: number) => number }[] = [
    { label: "Proj. Payroll", of: (committed) => committed },
    { label: "Cap Space", of: (committed) => cap - committed },
  ];

  return (
    <div className="min-w-0 rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="mb-2 text-sm font-semibold text-brand-dark">
        Future Outlook ({seasons.length}{" "}
        {seasons.length === 1 ? "Year" : "Years"})
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-brand-border text-[9px] uppercase text-brand-muted">
              <th className="whitespace-nowrap bg-white py-1.5 text-left font-semibold">
                Category
              </th>
              {seasons.map((season) => (
                <th
                  key={season.seasonStartYear}
                  className="whitespace-nowrap border-l border-brand-border py-1.5 pl-2.5 text-right font-semibold"
                >
                  {seasonLabel(season.seasonStartYear)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="whitespace-nowrap bg-white py-1.5 pr-2 text-brand-muted">
                  {row.label}
                </td>
                {seasons.map((season) => {
                  const value = row.of(season.committed);
                  return (
                    <td
                      key={season.seasonStartYear}
                      className={`whitespace-nowrap border-l border-brand-border py-1.5 pl-2.5 text-right tabular-nums ${
                        value < 0 ? "text-red-500" : "text-brand-dark"
                      }`}
                    >
                      {money(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
