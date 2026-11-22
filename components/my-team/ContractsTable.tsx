"use client";

import { useMemo } from "react";
import type {
  ContractSeason,
  RosterPlayer,
} from "@/lib/store/api/endpoints/rosterApi";
import { money } from "@/lib/money";

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/** Frontend-phase legend — same dots/labels as old-design-reference. */
const LEGEND: { label: string; dot: string }[] = [
  { label: "Player Option", dot: "bg-blue-500" },
  { label: "Team Option", dot: "bg-brand-cta" },
  { label: "Non-Guaranteed", dot: "bg-amber-500" },
  { label: "Partial Guarantee", dot: "bg-amber-400" },
  { label: "Dead Cap", dot: "bg-red-500" },
  { label: "Cap Hold", dot: "bg-brand-muted" },
];

type SeasonTag = {
  label: string;
  text: string;
  chip: string;
};

/** The file's own shorthand, colored like the frontend-phase contracts page. */
const tagFor = (season: ContractSeason): SeasonTag | null => {
  if (season.optionType === "player")
    return {
      label: "PO",
      text: "text-blue-600",
      chip: "bg-blue-50 text-blue-700",
    };
  if (season.optionType === "team")
    return {
      label: "TO",
      text: "text-brand-cta-dark",
      chip: "bg-brand-soft text-brand-cta-dark",
    };
  if (season.optionType === "earlyTermination")
    return {
      label: "ETO",
      text: "text-brand-muted",
      chip: "bg-brand-soft text-brand-muted",
    };
  if (season.guaranteeType === "none")
    return {
      label: "NG",
      text: "text-amber-600",
      chip: "bg-amber-50 text-amber-700",
    };
  if (season.guaranteeType === "partial")
    return {
      label: "PG",
      text: "text-amber-600",
      chip: "bg-amber-50 text-amber-700",
    };
  return null;
};

function SeasonCell({ season }: { season: ContractSeason | undefined }) {
  if (!season) return <span className="text-brand-border">—</span>;
  const tag = tagFor(season);

  return (
    <span className={`whitespace-nowrap ${tag?.text ?? "text-brand-dark"}`}>
      {short(season.capHit)}
      {tag ? (
        <span
          className={`ml-1 rounded px-1 py-0.5 text-[9px] font-bold ${tag.chip}`}
        >
          {tag.label}
        </span>
      ) : null}
    </span>
  );
}

export default function ContractsTable({
  players,
  seasons,
  deadMoneyRows,
  capHoldRows,
  onView,
  onExtend,
}: {
  players: RosterPlayer[];
  seasons: number[];
  deadMoneyRows: { id: number; name: string; amount: number }[];
  capHoldRows: { id: number; name: string; amount: number }[];
  onView: (player: RosterPlayer) => void;
  /** Left out when looking at somebody else's team. */
  onExtend?: (player: RosterPlayer) => void;
}) {
  // Totals are summed from the same rows the table prints, so a column and its
  // footer cannot disagree.
  const totals = useMemo(
    () =>
      seasons.map((year) =>
        players.reduce((sum, player) => {
          const season = player.contract?.seasons.find(
            (s) => s.seasonStartYear === year,
          );
          return sum + (season?.capHit ?? 0);
        }, 0),
      ),
    [players, seasons],
  );

  return (
    <div className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-brand-muted">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${item.dot}`} />
            {item.label}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
          <tr>
            <th className="sticky left-0 z-10 bg-brand-soft px-4 py-2.5">
              Player
            </th>
            {seasons.map((year) => (
              <th key={year} className="px-3 py-2.5 text-right">
                {seasonLabel(year)}
              </th>
            ))}
            {/* V5 asked for this column, and asked that it not be frozen on a
                phone — so it is an ordinary last column rather than a second
                sticky one. */}
            {onExtend ? (
              <th className="px-3 py-2.5 text-right">Extension</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {players.map((player) => (
            <tr key={player.id}>
              <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onView(player)}
                  className="text-left"
                >
                  <span className="flex items-center gap-1.5 font-medium text-brand-dark hover:underline">
                    {player.name}
                    {player.slotType === "twoWay" ? (
                      <span className="inline-flex rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
                        TW
                      </span>
                    ) : null}
                    {player.contract?.rfaOnExpiry ? (
                      <span
                        className="inline-flex rounded bg-brand-soft px-1 py-0.5 text-[10px] font-bold text-brand-muted"
                        title="Restricted free agent when this contract expires"
                      >
                        RFA
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[11px] text-brand-muted">
                    {[player.position, `${player.birdYears} bird`]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              </td>
              {seasons.map((year) => (
                <td
                  key={year}
                  className="px-3 py-2.5 text-right text-brand-dark"
                >
                  <SeasonCell
                    season={player.contract?.seasons.find(
                      (s) => s.seasonStartYear === year,
                    )}
                  />
                </td>
              ))}
              {onExtend ? (
                <td className="px-3 py-2.5 text-right">
                  {/* Whether he is actually eligible is Rules 10.7/10.8, and
                      the modal asks the server. The button opens that answer
                      rather than guessing it from the row. */}
                  {player.contract ? (
                    <button
                      type="button"
                      onClick={() => onExtend(player)}
                      className="whitespace-nowrap rounded-lg border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
                    >
                      Offer
                    </button>
                  ) : (
                    <span className="text-brand-border">—</span>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-brand-border bg-brand-soft/40 text-sm font-semibold">
          <tr>
            <td className="sticky left-0 z-10 bg-brand-soft px-4 py-2.5 text-brand-muted">
              Total
            </td>
            {totals.map((total, index) => (
              <td
                key={seasons[index]}
                className="px-3 py-2.5 text-right text-brand-dark"
              >
                {short(total)}
              </td>
            ))}
            {onExtend ? <td /> : null}
          </tr>
        </tfoot>
      </table>

      {deadMoneyRows.length > 0 || capHoldRows.length > 0 ? (
        <div className="grid gap-4 border-t border-brand-border px-4 py-3 sm:grid-cols-2">
          {deadMoneyRows.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Dead money this season
              </p>
              <ul className="mt-1.5 space-y-1">
                {deadMoneyRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex justify-between text-xs text-brand-muted"
                  >
                    <span className="text-brand-dark">{row.name}</span>
                    <span className="font-medium text-red-600">
                      {money(row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {capHoldRows.length > 0 ? (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                <span className="h-2 w-2 rounded-full bg-brand-muted" />
                Cap holds this season
              </p>
              <ul className="mt-1.5 space-y-1">
                {capHoldRows.map((row) => (
                  <li
                    key={row.id}
                    className="flex justify-between text-xs text-brand-muted"
                  >
                    <span className="text-brand-dark">{row.name}</span>
                    <span>
                      {row.amount === 0 ? "to be set" : money(row.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      </div>
    </div>
  );
}
