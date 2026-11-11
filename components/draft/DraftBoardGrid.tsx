"use client";

import { useMemo } from "react";
import type { DraftBoard } from "@/lib/store/api/endpoints/draftLiveApi";
import { initialLastName } from "./utils";

/**
 * The grid, one row per round and one column per team.
 *
 * It takes the board rather than reading the store, because the room already
 * holds it: a second subscription would poll the same endpoint twice and could
 * draw a round the clock card above it has already moved past.
 */
export default function DraftBoardGrid({ board }: { board: DraftBoard }) {
  const rounds = useMemo(
    () =>
      [...new Set(board.picks.map((slot) => slot.round))].sort((a, b) => a - b),
    [board.picks],
  );

  /**
   * Columns come from round one, in its pick order.
   *
   * A snake draft reverses later rounds, so taking the columns from any other
   * round would transpose the whole grid. Round one is also the round the
   * commissioner sets by hand (Rule 12.4), so it is the one that defines who
   * sits where.
   */
  const columns = useMemo(
    () =>
      board.picks
        .filter((slot) => slot.round === 1)
        .sort((a, b) => a.pickInRound - b.pickInRound)
        .map((slot) => slot.team),
    [board.picks],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
      <p className="border-b border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-dark">
        Draft Board
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-xs">
          <thead>
            <tr className="bg-brand-soft">
              <th className="px-3 py-2 text-left font-semibold text-brand-muted">
                Round
              </th>
              {columns.map((team) => (
                <th
                  key={team.id}
                  className="px-2 py-2 text-center font-semibold text-brand-dark"
                >
                  {team.abbr || team.name.split(" ").pop()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rounds.map((round) => {
              const rowSlots = board.picks.filter(
                (slot) => slot.round === round,
              );
              return (
                <tr key={round}>
                  <td className="px-3 py-2 font-bold text-brand-dark">
                    Round {round}
                  </td>
                  {columns.map((team) => {
                    const slot = rowSlots.find(
                      (row) => row.team.id === team.id,
                    );
                    const isCurrent =
                      slot !== undefined &&
                      slot.overall === board.onTheClock?.overall;

                    return (
                      <td
                        key={team.id}
                        className={`px-2 py-2 text-center ${
                          isCurrent
                            ? "bg-brand-cta/10 font-semibold text-brand-cta-dark"
                            : "text-brand-muted"
                        }`}
                      >
                        {isCurrent
                          ? "On the Clock"
                          : slot?.player
                            ? initialLastName(slot.player.name)
                            : "—"}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
