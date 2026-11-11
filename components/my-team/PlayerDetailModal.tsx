"use client";

import { useEffect } from "react";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import { avatarSrc } from "@/lib/avatar";
import {
  usePlayerProfileQuery,
  type PlayerContract,
  type PlayerGameLogRow,
} from "@/lib/store/api/endpoints/playerApi";
import { SLOT_LABEL, STATUS_LABEL } from "@/lib/store/api/endpoints/rosterApi";

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const money = (dollars: number) =>
  `$${Math.round(dollars).toLocaleString("en-US")}`;

const dash = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "—" : String(value);

const gameDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * What a contract year is called on screen.
 *
 * An option or a missing guarantee is the headline, because that is the thing
 * an owner is looking for; a plain guaranteed year is labelled by where it
 * sits relative to the league's own season.
 */
function seasonStatus(
  season: PlayerContract["seasons"][number],
  seasonStartYear: number,
) {
  if (season.optionType === "player") return "Player Option";
  if (season.optionType === "team") return "Team Option";
  if (season.optionType === "earlyTermination") return "Early Termination";
  if (season.guaranteeType === "none") return "Non-Guaranteed";
  if (season.guaranteeType === "partial") return "Partial Guarantee";

  if (season.seasonStartYear < seasonStartYear) return "Completed";
  if (season.seasonStartYear === seasonStartYear) return "Active";
  return "Guaranteed";
}

/** "W 108-104", or null for a game still being played. */
function resultLabel(row: PlayerGameLogRow) {
  if (
    row.won === null ||
    row.teamScore === null ||
    row.opponentScore === null
  ) {
    return null;
  }
  return `${row.won ? "W" : "L"} ${row.teamScore}-${row.opponentScore}`;
}

/**
 * The shared player card.
 *
 * Reads `GET /leagues/:leagueId/players/:playerId/profile`, which carries the
 * bio, the league's own contract, season averages, the career table and the
 * game log in one request.
 *
 * It used to generate the game log and the career history from a hash of the
 * player id, so every player showed five fictional games and five fictional
 * seasons. Anything the API cannot answer for reads as a dash now.
 */
export default function PlayerDetailModal({
  playerId,
  leagueId,
  onClose,
  onAddToBlock,
  actionLabel = "Add to Trade Block",
}: {
  playerId: number | null;
  leagueId: number | undefined;
  onClose: () => void;
  onAddToBlock?: (playerId: number) => void;
  actionLabel?: string;
}) {
  useEffect(() => {
    if (playerId === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [playerId, onClose]);

  const { data, isLoading, isError } = usePlayerProfileQuery(
    { leagueId: leagueId as number, playerId: playerId as number },
    { skip: playerId === null || !leagueId },
  );

  if (playerId === null) return null;

  const player = data?.player ?? null;
  const contract = data?.contract ?? null;
  const averages = data?.seasonAverages ?? null;
  const headshot = avatarSrc(player?.headshot);

  // The deal's average annual value, which is what the card calls AAV. Worked
  // out from the years it actually pays rather than stored.
  const aav =
    contract && contract.seasons.length > 0
      ? contract.seasons.reduce((sum, season) => sum + season.salary, 0) /
        contract.seasons.length
      : null;

  const facts: [string, string][] = [
    ["HT", dash(player?.height)],
    ["WT", player?.weight ? `${player.weight} lbs` : "—"],
    ["AGE", dash(player?.age)],
    [
      "EXP",
      player?.experience === null || player?.experience === undefined
        ? "—"
        : `${player.experience} yr${player.experience === 1 ? "" : "s"}${
            player.experienceIsEstimated ? "*" : ""
          }`,
    ],
    ["DRAFT", dash(player?.draftInfo)],
    [
      "CONTRACT",
      contract
        ? `${contract.yearsRemaining} yr${contract.yearsRemaining === 1 ? "" : "s"} left`
        : "—",
    ],
    ["AAV", aav === null ? "—" : money(aav)],
    // Bird years decide which exception can re-sign him (Article 9), so an
    // owner looking at his own player needs them on the card.
    ["BIRD", data?.league ? String(data.league.birdYears) : "—"],
    [
      "POS SLOT",
      data?.league
        ? data.league.status === "rostered"
          ? SLOT_LABEL[data.league.slotType]
          : STATUS_LABEL[data.league.status]
        : "—",
    ],
  ];

  const averageTiles: [string, string][] = averages
    ? [
        ["PTS", averages.pts.toFixed(1)],
        ["REB", averages.reb.toFixed(1)],
        ["AST", averages.ast.toFixed(1)],
        ["STL", averages.stl.toFixed(1)],
        ["BLK", averages.blk.toFixed(1)],
        ["FG%", averages.fgPct.toFixed(1)],
        ["3PM", averages.threes.toFixed(1)],
        ["FT%", averages.ftPct.toFixed(1)],
        ["TO", averages.to.toFixed(1)],
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={player?.name ?? "Player"}
    >
      <div
        className="flex max-h-[92vh] supports-[height:100dvh]:max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-brand-dark">
              {player?.name ?? (isLoading ? "Loading…" : "Player")}
            </h2>
            {player?.position ? (
              <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted">
                {player.position}
              </span>
            ) : null}
            {player?.nbaTeam ? (
              <span className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted">
                {player.nbaTeam}
              </span>
            ) : null}
            {data?.league?.slotType === "twoWay" ? (
              <span className="rounded bg-brand-dark/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">
                TW
              </span>
            ) : null}
            {contract?.rfaOnExpiry ? (
              <span
                className="rounded bg-brand-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-muted"
                title="Restricted free agent when this contract expires"
              >
                RFA
              </span>
            ) : null}
            {data?.injury ? (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                {data.injury.status}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {isError ? (
            <p className="py-8 text-center text-sm text-brand-muted">
              This player could not be loaded.
            </p>
          ) : isLoading || !data ? (
            <p className="py-8 text-center text-sm text-brand-muted">
              Loading player…
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                <span className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-forest text-xl font-bold text-brand-accent">
                  {headshot ? (
                    <Image
                      src={headshot}
                      alt={player?.name ?? ""}
                      fill
                      sizes="80px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    (player?.name ?? "?").charAt(0)
                  )}
                </span>
                <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
                  {facts.map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[10px] font-semibold uppercase text-brand-muted">
                        {key}
                      </p>
                      <p className="font-semibold text-brand-dark">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {data.injury?.description ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {data.injury.description}
                  {data.injury.returnDate
                    ? ` · Expected back ${gameDate(data.injury.returnDate)}`
                    : ""}
                </p>
              ) : null}

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                  Season Averages
                  {averages ? ` (${seasonLabel(averages.season)})` : ""}
                </p>
                {averageTiles.length === 0 ? (
                  <p className="text-xs text-brand-muted">
                    No games have been synced for this player yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {averageTiles.map(([key, value]) => (
                      <span key={key} className="text-center">
                        <span className="block text-lg font-bold text-brand-dark">
                          {value}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-brand-muted">
                          {key}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                    Contract Breakdown
                  </p>
                  {!contract ? (
                    <p className="text-xs text-brand-muted">
                      This league holds no contract for him.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase text-brand-muted">
                          <th className="text-left font-semibold">Year</th>
                          <th className="text-right font-semibold">
                            Base Salary
                          </th>
                          <th className="text-right font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {contract.seasons.map((season) => {
                          const status = seasonStatus(
                            season,
                            data.seasonStartYear,
                          );
                          return (
                            <tr key={season.seasonStartYear}>
                              <td className="py-1.5 text-brand-dark">
                                {seasonLabel(season.seasonStartYear)}
                              </td>
                              <td className="py-1.5 text-right text-brand-dark">
                                {money(season.salary)}
                              </td>
                              <td
                                className={`py-1.5 text-right font-medium ${
                                  status === "Active"
                                    ? "text-brand-cta-dark"
                                    : "text-brand-muted"
                                }`}
                              >
                                {status}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                    Game Log (Last {data.gameLog.length || 5})
                  </p>
                  {data.gameLog.length === 0 ? (
                    <p className="text-xs text-brand-muted">
                      No games synced yet.
                    </p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase text-brand-muted">
                          <th className="text-left font-semibold">Date</th>
                          <th className="text-left font-semibold">Opp</th>
                          <th className="text-center font-semibold">PTS</th>
                          <th className="text-center font-semibold">REB</th>
                          <th className="text-center font-semibold">AST</th>
                          <th className="text-right font-semibold">Result</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {data.gameLog.map((row) => {
                          const result = resultLabel(row);
                          return (
                            <tr key={`${row.date}-${row.opponent ?? "?"}`}>
                              <td className="py-1.5 text-brand-dark">
                                {gameDate(row.date)}
                              </td>
                              <td className="py-1.5 text-brand-muted">
                                {row.opponent
                                  ? `${row.isHome ? "vs" : "@"} ${row.opponent}`
                                  : "—"}
                              </td>
                              <td className="py-1.5 text-center">{row.pts}</td>
                              <td className="py-1.5 text-center">{row.reb}</td>
                              <td className="py-1.5 text-center">{row.ast}</td>
                              <td
                                className={`py-1.5 text-right font-medium ${
                                  result === null
                                    ? "text-brand-muted"
                                    : row.won
                                      ? "text-brand-cta-dark"
                                      : "text-red-500"
                                }`}
                              >
                                {result ?? "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-muted">
                  Career Stats
                </p>
                {data.career.length === 0 ? (
                  <p className="text-xs text-brand-muted">
                    No seasons have been synced for this player yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead>
                        <tr className="text-[10px] uppercase text-brand-muted">
                          <th className="text-left font-semibold">Season</th>
                          <th className="text-left font-semibold">Team</th>
                          <th className="text-center font-semibold">GP</th>
                          <th className="text-center font-semibold">GS</th>
                          <th className="text-center font-semibold">PPG</th>
                          <th className="text-center font-semibold">RPG</th>
                          <th className="text-center font-semibold">APG</th>
                          <th className="text-center font-semibold">SPG</th>
                          <th className="text-center font-semibold">FG%</th>
                          <th className="text-center font-semibold">3P%</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {data.career.map((season) => (
                          <tr key={season.season}>
                            <td className="py-1.5 font-medium text-brand-dark">
                              {seasonLabel(season.season)}
                            </td>
                            <td className="py-1.5 text-brand-muted">
                              {season.team ?? "—"}
                            </td>
                            <td className="py-1.5 text-center">
                              {season.gamesPlayed}
                            </td>
                            {/* Games started is in no tier of the stats feed,
                                so there is nothing to put here. */}
                            <td className="py-1.5 text-center text-brand-muted">
                              —
                            </td>
                            <td className="py-1.5 text-center">
                              {season.pts.toFixed(1)}
                            </td>
                            <td className="py-1.5 text-center">
                              {season.reb.toFixed(1)}
                            </td>
                            <td className="py-1.5 text-center">
                              {season.ast.toFixed(1)}
                            </td>
                            <td className="py-1.5 text-center">
                              {season.stl.toFixed(1)}
                            </td>
                            <td className="py-1.5 text-center">
                              {season.fgPct.toFixed(1)}%
                            </td>
                            <td className="py-1.5 text-center">
                              {season.fg3Pct.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Close
          </button>
          {onAddToBlock ? (
            <button
              type="button"
              onClick={() => {
                onAddToBlock(playerId);
                onClose();
              }}
              className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
            >
              {actionLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
