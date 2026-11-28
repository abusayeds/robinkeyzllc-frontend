"use client";

import { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { FreeAgent } from "@/lib/store/api/endpoints/freeAgencyApi";
import PlayerHeadshot from "@/components/ui/PlayerHeadshot";
import { shortMoney } from "./contract";

/** A stat the feed has published nothing for reads as a dash, never a zero. */
const stat = (value: number | undefined) =>
  value === undefined ? "—" : value.toFixed(1);

const pct = (value: number | undefined) =>
  value === undefined ? "—" : `${value.toFixed(1)}%`;

/** The approved design pages the board rather than scrolling it forever. */
const PAGE_SIZE = 25;

/** The per-game columns, in the order the approved design draws them. */
const STAT_COLUMNS: {
  key:
    "pts" | "fgPct" | "ftPct" | "threes" | "reb" | "ast" | "stl" | "blk" | "to";
  label: string;
  percent?: boolean;
  bold?: boolean;
}[] = [
  { key: "pts", label: "PTS", bold: true },
  { key: "fgPct", label: "FG%", percent: true },
  { key: "ftPct", label: "FT%", percent: true },
  { key: "threes", label: "3PM" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
];

export default function FreeAgentTable({
  players,
  canOffer,
  onOffer,
  onViewOffers,
  onViewPlayer,
}: {
  players: FreeAgent[];
  canOffer: boolean;
  onOffer: (player: FreeAgent) => void;
  onViewOffers: (player: FreeAgent) => void;
  onViewPlayer?: (player: FreeAgent) => void;
}) {
  const [page, setPage] = useState(1);

  const pageCount = Math.max(1, Math.ceil(players.length / PAGE_SIZE));

  // Filtering down to fewer players than the page you are on would otherwise
  // leave you looking at an empty table.
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);

  const start = (Math.min(page, pageCount) - 1) * PAGE_SIZE;
  const shown = players.slice(start, start + PAGE_SIZE);

  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
        No free agents match that filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-brand-border bg-white shadow-card">
        <table className="w-full min-w-[68rem] text-sm">
          <thead className="bg-brand-soft/60 text-left text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
            <tr>
              <th className="px-4 py-2.5">Player</th>
              <th className="px-2 py-2.5 text-center">Pos</th>
              <th className="px-2 py-2.5 text-center">Age</th>
              <th className="px-2 py-2.5 text-center">Type</th>
              {STAT_COLUMNS.map((column) => (
                <th key={column.key} className="px-2 py-2.5 text-center">
                  {column.label}
                </th>
              ))}
              <th className="px-2 py-2.5 text-center">Exp</th>
              <th className="px-4 py-2.5 text-right">Offers</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {shown.map((player) => {
              const top = player.offers[0] ?? null;
              const mine = player.offers.find((offer) => offer.isMine) ?? null;
              const line = player.stats;

              const identity = (
                <div className="flex min-w-0 items-center gap-2.5">
                  <PlayerHeadshot
                    name={player.name}
                    src={player.headshot}
                    className="h-9 w-9 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-brand-dark">
                      {player.name}
                    </p>
                    <p className="truncate text-[11px] text-brand-muted">
                      Free Agent
                      {player.position ? ` · ${player.position}` : ""}
                    </p>
                  </div>
                </div>
              );

              return (
                <tr key={player.leaguePlayerId}>
                  <td className="px-4 py-2.5">
                    {onViewPlayer ? (
                      <button
                        type="button"
                        onClick={() => onViewPlayer(player)}
                        className="block w-full text-left hover:opacity-80"
                      >
                        {identity}
                      </button>
                    ) : (
                      identity
                    )}
                  </td>

                  <td className="px-2 py-2.5 text-center text-brand-muted">
                    {player.position ?? "—"}
                  </td>
                  <td className="px-2 py-2.5 text-center text-brand-dark">
                    {player.age ?? "—"}
                  </td>

                  <td className="px-2 py-2.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          player.faType === "RFA"
                            ? "bg-amber-500"
                            : "bg-brand-muted"
                        }`}
                      />
                      {player.faType}
                    </span>
                  </td>

                  {STAT_COLUMNS.map((column) => (
                    <td
                      key={column.key}
                      className={`px-2 py-2.5 text-center ${
                        column.bold
                          ? "font-semibold text-brand-dark"
                          : "text-brand-muted"
                      }`}
                    >
                      {column.percent
                        ? pct(line?.[column.key])
                        : stat(line?.[column.key])}
                    </td>
                  ))}

                  <td className="px-2 py-2.5 text-center text-brand-muted">
                    {player.experience ?? "—"}
                    {player.experienceIsEstimated && player.experience !== null
                      ? "*"
                      : ""}
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    {player.offers.length === 0 ? (
                      <span className="text-brand-border">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onViewOffers(player)}
                        className="text-right"
                      >
                        <p className="text-xs font-semibold text-brand-cta-dark hover:underline">
                          {top ? shortMoney(top.totalValue) : "—"}
                        </p>
                        <p className="text-[11px] text-brand-muted">
                          {player.offers.length} offer
                          {player.offers.length === 1 ? "" : "s"}
                          {mine ? " · yours in" : ""}
                        </p>
                      </button>
                    )}
                  </td>

                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => onOffer(player)}
                      disabled={!canOffer}
                      className="whitespace-nowrap rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {mine ? "Change Offer" : "Offer Contract"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-brand-muted">
          Page {Math.min(page, pageCount)} of {pageCount} · {players.length}{" "}
          player{players.length === 1 ? "" : "s"}
        </p>

        {pageCount > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              aria-label="Previous page"
              className="rounded-lg border border-brand-border p-1.5 text-brand-muted transition hover:bg-brand-soft disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1).map(
              (number) => (
                <button
                  key={number}
                  type="button"
                  onClick={() => setPage(number)}
                  aria-current={number === page ? "page" : undefined}
                  className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    number === Math.min(page, pageCount)
                      ? "bg-brand-cta/15 text-brand-cta-dark"
                      : "border border-brand-border text-brand-muted hover:bg-brand-soft"
                  }`}
                >
                  {number}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page >= pageCount}
              aria-label="Next page"
              className="rounded-lg border border-brand-border p-1.5 text-brand-muted transition hover:bg-brand-soft disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
