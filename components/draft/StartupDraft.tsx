"use client";

import { useMemo, useState } from "react";
import { FiBookmark, FiSearch, FiStar, FiX } from "react-icons/fi";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import { useLeagueSalariesQuery } from "@/lib/store/api/endpoints/salaryApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import DraftBoardGrid from "./DraftBoardGrid";
import DraftClockCard from "./DraftClockCard";
import DraftQueue from "./DraftQueue";
import DraftRoomBanner from "./DraftRoomBanner";
import { useDraftRoom } from "./useDraftRoom";
import { moneyFull } from "./utils";

function Tile({
  label,
  value,
  tone = "text-brand-dark",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-[92px] rounded-lg border border-brand-border px-2.5 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p className={`text-xs font-bold ${tone}`}>{value}</p>
    </div>
  );
}

/** Red once a line has been crossed, which is what every cap tile means. */
const roomTone = (value: number) =>
  value < 0 ? "text-red-500" : "text-brand-cta-dark";

export default function StartupDraft() {
  const room = useDraftRoom("startup");
  const leagueId = room.leagueId;

  const { data: salaries } = useLeagueSalariesQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );
  const { data: teamList } = useLeagueTeamsQuery(leagueId as number, {
    skip: !leagueId,
  });

  const [boardPreview, setBoardPreview] = useState<Set<number>>(new Set());
  const [detail, setDetail] = useState<number | null>(null);

  const myTeamId = room.board?.myTeamId ?? null;

  const myTeam = useMemo(
    () => salaries?.teams.find((team) => team.id === myTeamId) ?? null,
    [salaries, myTeamId],
  );

  /**
   * Who this team has already taken in this draft.
   *
   * Read off the board rather than the roster, because the two answer
   * different questions: the roster is every player the team holds, and this
   * panel is about this draft.
   */
  const draftedByMe = useMemo(
    () =>
      (room.board?.picks ?? [])
        .filter((slot) => slot.isMine && slot.player !== null)
        .map((slot) => slot.player!),
    [room.board],
  );

  const previewPlayers = useMemo(
    () => room.available.filter((player) => boardPreview.has(player.id)),
    [room.available, boardPreview],
  );

  const toggleBoardPreview = (playerId: number) =>
    setBoardPreview((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else next.add(playerId);
      return next;
    });

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to open its draft.
      </p>
    );
  }

  if (room.isLoading) {
    return <p className="text-sm text-brand-muted">Loading the draft room…</p>;
  }

  if (!room.board) {
    return (
      <p className="text-sm text-brand-muted">
        {getApiErrorMessage(room.error, "This draft could not be loaded.")}
      </p>
    );
  }

  const cap = salaries?.cap ?? null;
  const payroll = myTeam?.totalCommitted ?? 0;

  /**
   * The cap lines, measured against what the team is already committed to.
   *
   * A startup pick writes no contract — the source feed carries no salaries,
   * which is why the pool reports `contract: null` — so a drafted player adds
   * nothing to payroll yet and the preview cannot price him either. The tiles
   * therefore report the team's real position rather than a hypothetical one,
   * and the preview panel counts players instead of dollars.
   */
  const lines: [string, number][] = cap
    ? [
        ["Cap Space", cap.salaryCap - payroll],
        ["Luxury Tax", cap.luxuryTax - payroll],
        ["1st Apron", cap.firstApron - payroll],
        ["2nd Apron", cap.secondApron - payroll],
      ]
    : [];

  return (
    <div className="space-y-5">
      <DraftRoomBanner room={room} />

      <DraftClockCard
        onTheClock={room.board.onTheClock}
        ownerName={room.ownerName}
        clock={room.clock}
        strip={room.strip}
      />

      {/* Status bar */}
      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Your Team: {myTeam?.name ?? "—"}
          </span>
          <Tile label="Total Salary" value={moneyFull(payroll)} />
          <Tile
            label="Salary Floor"
            value={cap ? moneyFull(cap.salaryFloor) : "—"}
          />
          {lines.map(([label, value]) => (
            <Tile
              key={label}
              label={label}
              value={moneyFull(value)}
              tone={roomTone(value)}
            />
          ))}
          <Tile
            label="Players"
            value={
              myTeam
                ? `${myTeam.contractCount}/${teamList?.maxRosterSize ?? "—"}`
                : "—"
            }
          />
          <Tile label="Drafted" value={String(draftedByMe.length)} />
          <Tile label="Remaining Picks" value={String(room.remainingPicks)} />
          <Tile
            label="Next Pick"
            value={
              room.nextPick
                ? `R${room.nextPick.round}-P${room.nextPick.pickInRound}`
                : "—"
            }
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
        {/* Available players */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-dark">
              Available Players{" "}
              <span className="text-brand-muted">({room.filtered.length})</span>
            </h3>
            <div className="relative w-44">
              <FiSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
              <input
                value={room.search}
                onChange={(e) => room.setSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-brand-border py-1.5 pl-8 pr-2 text-xs outline-none focus:border-brand-cta"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {room.positions.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => room.setPosition(position)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  room.position === position
                    ? "bg-brand-cta text-white"
                    : "border border-brand-border text-brand-dark hover:bg-brand-soft"
                }`}
              >
                {position}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-soft text-[10px] uppercase text-brand-muted">
                    <th className="px-2 py-2" />
                    <th className="px-2 py-2 text-left">Player</th>
                    <th className="px-2 py-2 text-center">Pos</th>
                    <th className="px-2 py-2 text-center">Age</th>
                    <th className="px-2 py-2 text-right">Team</th>
                    <th className="px-2 py-2 text-center">PTS</th>
                    <th className="px-2 py-2 text-center">REB</th>
                    <th className="px-2 py-2 text-center">AST</th>
                    <th className="px-2 py-2 text-center">FG%</th>
                    <th className="px-2 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {room.filtered.map((player) => {
                    const onBoard = boardPreview.has(player.id);
                    const queued = room.queue.includes(player.id);
                    return (
                      <tr key={player.id} className="hover:bg-brand-soft/60">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            aria-label={
                              queued
                                ? `Remove ${player.name} from queue`
                                : `Queue ${player.name}`
                            }
                            onClick={() => room.toggleQueue(player.id)}
                            className={`transition ${
                              queued
                                ? "text-brand-cta-dark"
                                : "text-brand-muted hover:text-brand-cta-dark"
                            }`}
                          >
                            <FiStar
                              className={`h-3.5 w-3.5 ${queued ? "fill-brand-cta-dark" : ""}`}
                            />
                          </button>
                        </td>
                        <td className="px-2 py-2 font-medium text-brand-dark">
                          <button
                            type="button"
                            onClick={() => setDetail(player.id)}
                            className="hover:text-brand-cta-dark hover:underline"
                          >
                            {player.name}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center text-brand-muted">
                          {player.position ?? "—"}
                        </td>
                        <td className="px-2 py-2 text-center text-brand-muted">
                          {player.age ?? "—"}
                        </td>
                        {/* The design priced this column. A startup pool has
                            no salary source, so it names his NBA team, which
                            is what the pool actually knows about him. */}
                        <td className="px-2 py-2 text-right font-semibold text-brand-cta-dark">
                          {player.nbaTeam?.abbreviation ?? "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {player.stats ? player.stats.pts.toFixed(1) : "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {player.stats ? player.stats.reb.toFixed(1) : "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {player.stats ? player.stats.ast.toFixed(1) : "—"}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {player.stats ? player.stats.fgPct.toFixed(1) : "—"}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleBoardPreview(player.id)}
                              aria-label={
                                onBoard
                                  ? `Remove ${player.name} from draft board`
                                  : `Add ${player.name} to draft board`
                              }
                              title="Add to Draft Board"
                              className={`rounded p-1 transition ${
                                onBoard
                                  ? "text-brand-cta-dark"
                                  : "text-brand-muted hover:text-brand-cta-dark"
                              }`}
                            >
                              <FiBookmark
                                className={`h-3.5 w-3.5 ${onBoard ? "fill-brand-cta-dark" : ""}`}
                              />
                            </button>
                            <button
                              type="button"
                              disabled={!room.canPick}
                              onClick={() => room.makePick(player.id)}
                              className="rounded-lg bg-brand-cta px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Draft
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {room.filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-2 py-6 text-center text-brand-muted"
                      >
                        {room.available.length === 0
                          ? "Every player has been taken."
                          : "No players match."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Your draft board */}
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <h3 className="text-sm font-semibold text-brand-dark">
            Your Draft Board
          </h3>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
            Drafted ({draftedByMe.length})
          </p>
          {draftedByMe.length === 0 ? (
            <p className="mt-1 text-xs text-brand-muted">
              No players drafted yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-brand-border text-xs">
              {draftedByMe.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(player.id)}
                    className="min-w-0 truncate text-left font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                  >
                    {player.name}
                    <span className="ml-1 text-brand-muted">
                      {player.position ?? ""}
                    </span>
                  </button>
                  <span className="shrink-0 font-semibold text-brand-cta-dark">
                    {player.nbaTeam?.abbreviation ?? "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
            On the Board — Preview ({previewPlayers.length})
          </p>
          {previewPlayers.length === 0 ? (
            <p className="mt-1 text-xs text-brand-muted">
              Bookmark available players to keep them in reach.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-dashed divide-brand-border text-xs">
              {previewPlayers.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(player.id)}
                    className="min-w-0 truncate text-left font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                  >
                    {player.name}
                    <span className="ml-1 text-brand-muted">
                      {player.position ?? ""}
                    </span>
                  </button>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-brand-cta-dark">
                      {player.stats ? `${player.stats.pts.toFixed(1)}` : "—"}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBoardPreview(player.id)}
                      aria-label={`Remove ${player.name} from draft board`}
                      className="text-brand-muted transition hover:text-red-500"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cap position + queue */}
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
              Your Cap Position
            </p>
            {!cap ? (
              <p className="text-xs text-brand-muted">
                This league has not set its cap figures yet.
              </p>
            ) : (
              <>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-brand-muted">Total Salary</dt>
                    <dd className="font-semibold text-brand-dark">
                      {moneyFull(payroll)}
                    </dd>
                  </div>
                  {lines.map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <dt className="text-brand-muted">{label}</dt>
                      <dd
                        className={`font-semibold ${
                          value < 0 ? "text-red-500" : "text-brand-dark"
                        }`}
                      >
                        {moneyFull(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
                {/* A startup pick carries no salary, so nothing here can be a
                    forecast. Saying so is better than a tile that silently
                    never moves. */}
                <p className="mt-2 rounded bg-brand-soft px-2 py-1 text-[10px] text-brand-muted">
                  Startup picks carry no contract yet, so drafting does not move
                  these figures.
                </p>
              </>
            )}
          </div>

          <DraftQueue
            items={room.queuedPlayers}
            compact
            onRemove={room.removeFromQueue}
            onSelect={setDetail}
          />
        </div>
      </div>

      <DraftBoardGrid board={room.board} />

      <PlayerDetailModal
        playerId={detail}
        leagueId={leagueId}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
