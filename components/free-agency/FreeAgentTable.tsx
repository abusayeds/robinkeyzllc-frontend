"use client";

import {
  BIRD_LABEL,
  type FreeAgent,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import { shortMoney } from "./contract";

export default function FreeAgentTable({
  players,
  canOffer,
  onOffer,
  onViewOffers,
}: {
  players: FreeAgent[];
  canOffer: boolean;
  onOffer: (player: FreeAgent) => void;
  onViewOffers: (player: FreeAgent) => void;
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
        No free agents match that filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
          <tr>
            <th className="px-4 py-2.5">Player</th>
            <th className="px-4 py-2.5 text-center">Type</th>
            <th className="px-4 py-2.5 text-center">Bird</th>
            <th className="px-4 py-2.5 text-right">Last salary</th>
            <th className="px-4 py-2.5 text-center">Offers</th>
            <th className="px-4 py-2.5 text-right">Top offer</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-border">
          {players.map((player) => {
            const top = player.offers[0] ?? null;
            const mine = player.offers.find((offer) => offer.isMine) ?? null;

            return (
              <tr key={player.leaguePlayerId}>
                <td className="px-4 py-2.5">
                  <p className="font-medium text-brand-dark">{player.name}</p>
                  <p className="text-[11px] text-brand-muted">
                    {[
                      player.position,
                      player.nbaTeam,
                      player.experience !== null
                        ? `${player.experience} yr${player.experience === 1 ? "" : "s"}${
                            player.experienceIsEstimated ? "*" : ""
                          }`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      player.faType === "RFA"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-brand-soft text-brand-muted"
                    }`}
                    title={
                      player.faType === "RFA" && player.rightsTeam
                        ? `${player.rightsTeam.name} holds his rights`
                        : undefined
                    }
                  >
                    {player.faType}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-center text-brand-muted">
                  {BIRD_LABEL[player.birdRights]}
                </td>
                <td className="px-4 py-2.5 text-right text-brand-muted">
                  {player.previousSalary === null ? (
                    <span className="text-brand-border">—</span>
                  ) : (
                    shortMoney(player.previousSalary)
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {player.offers.length === 0 ? (
                    <span className="text-brand-border">—</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onViewOffers(player)}
                      className="text-xs font-semibold text-brand-cta-dark hover:underline"
                    >
                      {player.offers.length}
                      {mine ? " · yours in" : ""}
                    </button>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right text-brand-dark">
                  {top ? shortMoney(top.totalValue) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onOffer(player)}
                    disabled={!canOffer}
                    className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mine ? "Change offer" : "Make offer"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
