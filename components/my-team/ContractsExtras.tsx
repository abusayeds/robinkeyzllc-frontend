"use client";

import Link from "next/link";
import type { OutlookSeason } from "@/lib/store/api/endpoints/salaryApi";
import type { TradeExceptionRow } from "@/lib/store/api/endpoints/tradeApi";
import { money } from "@/lib/money";

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const dated = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

/** Rule 7.3 — how long an exception has left, in the words a page uses. */
function remainingLife(expiresAt: string): { label: string; tone: string } {
  const days = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 86_400_000,
  );
  if (days <= 0) return { label: "Expired", tone: "bg-red-100 text-red-600" };
  if (days <= 30) {
    return {
      label: `Expires in ${days} day${days === 1 ? "" : "s"}`,
      tone: "bg-red-100 text-red-600",
    };
  }
  if (days <= 120) {
    return {
      label: `${days} days left`,
      tone: "bg-amber-100 text-amber-700",
    };
  }
  return {
    label: `${days} days left`,
    tone: "bg-emerald-100 text-emerald-700",
  };
}

/**
 * Article 6 — what this payroll could still sign with, for the season the
 * page is showing.
 *
 * There is no Use button. Signing with an exception is Article 9, which is
 * not built, and a button that does nothing is worse than no button.
 */
export function SeasonExceptionsCard({ season }: { season: OutlookSeason }) {
  if (season.exceptions.length === 0) return null;

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="text-sm font-bold text-brand-dark">
        Exceptions · {seasonLabel(season.seasonStartYear)}
      </p>
      <p className="mt-0.5 text-[11px] text-brand-muted">
        Greyed out means not available at this payroll. Trade exceptions are
        listed below.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {season.exceptions.map((one) => (
          <div
            key={one.key}
            className={`rounded-lg border px-3 py-2.5 ${
              one.available
                ? "border-brand-border bg-white"
                : "border-dashed border-brand-border bg-brand-soft/40"
            }`}
          >
            <p
              className={`text-xs font-semibold ${
                one.available ? "text-brand-dark" : "text-brand-muted"
              }`}
            >
              {one.label}
            </p>
            <p
              className={`mt-0.5 text-base font-bold ${
                one.available ? "text-brand-dark" : "text-brand-muted"
              }`}
            >
              {one.amount === null
                ? "Always"
                : one.available
                  ? money(one.amount)
                  : "—"}
              {one.amount !== null && !one.available ? (
                <span className="ml-1 text-[11px] font-normal text-brand-muted">
                  of {money(one.amount)}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[10px] text-brand-muted">
              {one.why ??
                (one.amount === null
                  ? "Minimum contracts"
                  : "Full amount available")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The roster line, and what is being paid to players who have left. */
export function RosterAndDeadMoneyStrip({
  standard,
  twoWay,
  maxRosterSize,
  maxTwoWay,
  deadMoneyRows,
  seasonStartYear,
}: {
  standard: number;
  twoWay: number;
  maxRosterSize: number;
  maxTwoWay: number;
  deadMoneyRows: { id: number; name: string; amount: number }[];
  /** The season the strip is describing, for the dead-money line. */
  seasonStartYear: number;
}) {
  const open = Math.max(0, maxRosterSize - standard);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
          Roster
        </span>
        <span className="text-sm font-bold text-brand-dark">
          {standard} / {maxRosterSize}
        </span>
        <span className="flex gap-0.5" aria-hidden>
          {Array.from({ length: maxRosterSize }, (_, index) => (
            <span
              key={index}
              className={`h-3 w-1.5 rounded-sm ${
                index < standard ? "bg-brand-cta" : "bg-brand-soft"
              }`}
            />
          ))}
        </span>
        <span className="text-[11px] text-brand-muted">
          · {twoWay} / {maxTwoWay} two-way ·{" "}
          <span className={open === 0 ? "text-red-500" : "text-brand-cta-dark"}>
            {open} open spot{open === 1 ? "" : "s"}
          </span>
        </span>
      </div>

      {deadMoneyRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-red-500">
            Dead money
          </span>
          {deadMoneyRows.map((row) => (
            <span key={row.id} className="text-[11px] text-brand-muted">
              {row.name} · {seasonLabel(seasonStartYear)}{" "}
              <span className="font-semibold text-brand-dark">
                {money(row.amount)}
              </span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Article 7 — the exceptions this team holds.
 *
 * "Use in trade" opens the Trade Center rather than pretending to spend one
 * here: an exception is spent by building the trade it absorbs salary for.
 */
export function TradeExceptionsCard({
  exceptions,
  canTrade,
}: {
  exceptions: TradeExceptionRow[];
  canTrade: boolean;
}) {
  if (exceptions.length === 0) return null;

  const totalRemaining = exceptions.reduce(
    (sum, row) => sum + row.remaining,
    0,
  );

  return (
    <div className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-brand-dark">Trade exceptions</p>
          <p className="mt-0.5 max-w-xl text-[11px] text-brand-muted">
            Take in a player without sending salary back. Each one can be used
            across several trades until it runs out or expires, but two cannot
            be combined to absorb one player.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Active
            </p>
            <p className="text-lg font-bold text-brand-dark">
              {exceptions.length}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Total remaining
            </p>
            <p className="text-lg font-bold text-brand-dark">
              {money(totalRemaining)}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-brand-border">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="text-left text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
            <tr className="border-b border-brand-border">
              <th className="px-4 py-2">Exception</th>
              <th className="px-4 py-2 text-right">Original</th>
              <th className="px-4 py-2">Remaining</th>
              <th className="px-4 py-2">Created</th>
              <th className="px-4 py-2">Expires</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {exceptions.map((row) => {
              const life = remainingLife(row.expiresAt);
              const spent = row.amount - row.remaining;
              const left =
                row.amount > 0 ? (row.remaining / row.amount) * 100 : 0;

              return (
                <tr
                  key={row.id}
                  className="border-b border-brand-border/60 last:border-0"
                >
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-brand-dark">{row.label}</p>
                    <p className="text-[11px] text-brand-muted">
                      {spent > 0
                        ? `Partly used · ${money(spent)} spent`
                        : "Unused"}
                    </p>
                  </td>
                  <td className="px-4 py-2.5 text-right text-brand-muted">
                    {money(row.amount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-bold text-brand-dark">
                      {money(row.remaining)}
                    </p>
                    <span className="mt-1 block h-1 w-40 max-w-full rounded-full bg-brand-soft">
                      <span
                        className={`block h-1 rounded-full ${
                          left > 60
                            ? "bg-emerald-500"
                            : left > 25
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${Math.max(2, left)}%` }}
                      />
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-brand-muted">
                    {dated(row.createdAt)}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="text-brand-muted">{dated(row.expiresAt)}</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${life.tone}`}
                    >
                      {life.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canTrade ? (
                      <Link
                        href="/my-team/trade-center"
                        className="inline-flex whitespace-nowrap rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                      >
                        Use in trade
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
