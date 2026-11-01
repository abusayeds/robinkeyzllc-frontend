"use client";

import type { RosterPlayer, RosterRules } from "@/lib/store/api/endpoints/rosterApi";

/**
 * How the roster sits against the league's own slot layout.
 *
 * The slots are not forced to add up to the roster size — leagues count bench
 * and injured spots differently, and the commissioner sets them freely — so
 * this reports both numbers rather than treating a difference as an error.
 */
export default function RosterComposition({
  players,
  rules,
}: {
  players: RosterPlayer[];
  rules: RosterRules;
}) {
  if (!rules) return null;

  const active = players.filter(
    (player) => player.status === "rostered" && player.slotType === "standard",
  );
  const twoWay = players.filter(
    (player) => player.status === "rostered" && player.slotType === "twoWay",
  );
  const ir = players.filter(
    (player) =>
      player.status === "rostered" && player.slotType === "injuredReserve",
  );

  const rows = [
    {
      label: "Active roster",
      used: active.length,
      limit: rules.maxRosterSize,
      min: rules.minRosterSize,
    },
    { label: "Two-way", used: twoWay.length, limit: rules.maxTwoWay },
    { label: "Injured reserve", used: ir.length, limit: rules.slotIr },
  ];

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-brand-dark">Roster shape</p>
      <div className="mt-3 space-y-2.5">
        {rows.map((row) => {
          const over = row.used > row.limit;
          const under = row.min !== undefined && row.used < row.min;
          const width = row.limit > 0 ? Math.min(100, (row.used / row.limit) * 100) : 0;

          return (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-brand-muted">{row.label}</span>
                <span
                  className={
                    over
                      ? "font-semibold text-red-500"
                      : under
                        ? "font-semibold text-amber-600"
                        : "text-brand-dark"
                  }
                >
                  {row.used} / {row.limit}
                  {row.min !== undefined ? ` · min ${row.min}` : ""}
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-brand-soft">
                <div
                  className={`h-1.5 rounded-full ${over ? "bg-red-500" : "bg-brand-cta"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-brand-muted">
        Position slots ({rules.slotGuard}G · {rules.slotForward}F ·{" "}
        {rules.slotCenter}C · {rules.slotFlex} flex · {rules.slotBench} bench)
        are enforced once lineups exist.
      </p>
    </div>
  );
}
