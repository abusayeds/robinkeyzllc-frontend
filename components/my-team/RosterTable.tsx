"use client";

import Image from "next/image";
import { avatarSrc } from "@/lib/avatar";
import {
  SLOT_LABEL,
  type RosterPlayer,
} from "@/lib/store/api/endpoints/rosterApi";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const initials = (name: string) =>
  name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function RosterTable({
  players,
  showIrAction,
  irLabel,
  busy,
  onView,
  onMove,
  onWaive,
}: {
  players: RosterPlayer[];
  showIrAction: boolean;
  irLabel: string;
  busy: boolean;
  onView: (player: RosterPlayer) => void;
  onMove: (player: RosterPlayer) => void;
  /** Left out on the Rights Held tab: there is no contract to waive. */
  onWaive?: (player: RosterPlayer) => void;
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
        Nobody here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
          <tr>
            <th className="px-4 py-2.5">Player</th>
            <th className="px-4 py-2.5 text-center">Slot</th>
            <th className="px-4 py-2.5 text-center">Bird</th>
            <th className="px-4 py-2.5 text-center">Yrs left</th>
            <th className="px-4 py-2.5 text-right">Cap hit</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {players.map((player) => (
            <tr key={player.id}>
              <td className="px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onView(player)}
                  className="flex items-center gap-2.5 text-left"
                >
                  <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-[10px] font-bold text-brand-dark">
                    {avatarSrc(player.headshot) ? (
                      <Image
                        src={avatarSrc(player.headshot) as string}
                        alt={player.name}
                        fill
                        sizes="28px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      initials(player.name)
                    )}
                  </span>
                  <span>
                    <span className="flex items-center gap-1.5 font-medium text-brand-dark hover:underline">
                      {player.name}
                      {player.slotType === "twoWay" ? (
                        <span className="inline-flex rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
                          TW
                        </span>
                      ) : null}
                      {player.injury ? (
                        <span
                          className="inline-flex rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-600"
                          title={
                            player.injury.returnDate
                              ? `Expected back ${new Date(player.injury.returnDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}`
                              : undefined
                          }
                        >
                          {player.injury.status}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[11px] text-brand-muted">
                      {[player.position, player.nbaTeam]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </span>
                  </span>
                </button>
              </td>
              <td className="px-4 py-2.5 text-center text-brand-muted">
                {SLOT_LABEL[player.slotType]}
              </td>
              <td className="px-4 py-2.5 text-center text-brand-muted">
                {player.birdYears}
              </td>
              <td className="px-4 py-2.5 text-center text-brand-muted">
                {player.contract ? player.contract.years : "—"}
              </td>
              <td className="px-4 py-2.5 text-right text-brand-dark">
                {player.capHit === null ? (
                  <span className="text-brand-border">—</span>
                ) : (
                  money(player.capHit)
                )}
              </td>
              <td className="px-4 py-2.5 text-right">
                <span className="flex items-center justify-end gap-2">
                  {showIrAction && player.slotType !== "twoWay" ? (
                    <button
                      type="button"
                      onClick={() => onMove(player)}
                      disabled={busy}
                      className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
                    >
                      {irLabel}
                    </button>
                  ) : null}
                  {onWaive ? (
                    <button
                      type="button"
                      onClick={() => onWaive(player)}
                      disabled={busy}
                      className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      Waive
                    </button>
                  ) : null}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
