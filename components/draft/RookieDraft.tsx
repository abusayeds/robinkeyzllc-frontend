"use client";

import { useState } from "react";
import { FiSearch, FiStar } from "react-icons/fi";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import type { PoolPlayer } from "@/lib/store/api/endpoints/draftApi";
import DraftBoardGrid from "./DraftBoardGrid";
import DraftClockCard from "./DraftClockCard";
import DraftQueue from "./DraftQueue";
import DraftRoomBanner from "./DraftRoomBanner";
import { useDraftRoom } from "./useDraftRoom";

export default function RookieDraft() {
  const room = useDraftRoom("rookie");
  const [detail, setDetail] = useState<number | null>(null);

  if (!room.leagueId) {
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

  return (
    <div className="space-y-5">
      <DraftRoomBanner room={room} />

      <DraftClockCard
        onTheClock={room.board.onTheClock}
        ownerName={room.ownerName}
        clock={room.clock}
        strip={room.strip}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-dark">
              Available Players
            </h3>
            <span className="text-xs text-brand-muted">
              {room.filtered.length} available
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                value={room.search}
                onChange={(e) => room.setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {room.positions.map((position) => (
              <button
                key={position}
                type="button"
                onClick={() => room.setPosition(position)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
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
            <ul className="divide-y divide-brand-border">
              {room.filtered.map((player) => (
                <ProspectRow
                  key={player.id}
                  player={player}
                  canDraft={room.canPick}
                  queued={room.queue.includes(player.id)}
                  onDraft={() => room.makePick(player.id)}
                  onQueue={() => room.toggleQueue(player.id)}
                  onSelect={() => setDetail(player.id)}
                />
              ))}
              {room.filtered.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-brand-muted">
                  {room.available.length === 0
                    ? "No players are left in the rookie pool."
                    : "No prospects match."}
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <DraftQueue
            items={room.queuedPlayers}
            onRemove={room.removeFromQueue}
            onSelect={setDetail}
          />

          <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-brand-dark">
              My Picks
            </h3>
            {room.myPicks.length === 0 ? (
              <p className="text-xs text-brand-muted">
                You hold no picks in this draft.
              </p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {room.myPicks.map((slot) => (
                  <li
                    key={slot.overall}
                    className="flex items-center justify-between rounded-lg border border-brand-border px-2.5 py-1.5"
                  >
                    <span className="font-semibold text-brand-muted">
                      R{slot.round}-P{slot.pickInRound}
                    </span>
                    {slot.player ? (
                      <button
                        type="button"
                        onClick={() => setDetail(slot.player!.id)}
                        className="font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                      >
                        {slot.player.name}
                      </button>
                    ) : (
                      <span className="font-medium text-brand-dark">
                        {slot.overall === room.board?.onTheClock?.overall
                          ? "On the clock"
                          : "Upcoming"}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <DraftBoardGrid board={room.board} />

      <PlayerDetailModal
        playerId={detail}
        leagueId={room.leagueId}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function ProspectRow({
  player,
  canDraft,
  queued,
  onDraft,
  onQueue,
  onSelect,
}: {
  player: PoolPlayer;
  canDraft: boolean;
  queued: boolean;
  onDraft: () => void;
  onQueue: () => void;
  onSelect: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-brand-accent">
          {player.name.charAt(0)}
        </span>
        <div>
          <button
            type="button"
            onClick={onSelect}
            className="text-sm font-semibold text-brand-dark hover:text-brand-cta-dark hover:underline"
          >
            {player.name}
          </button>
          <p className="text-xs text-brand-muted">
            {player.position ?? "—"} ·{" "}
            {player.yearsOfService === null
              ? "—"
              : player.yearsOfService === 0
                ? "Rookie"
                : `${player.yearsOfService} yrs exp`}{" "}
            · {player.stats ? `${player.stats.pts.toFixed(1)} PTS` : "No stats"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onQueue}
          aria-label={
            queued ? `Remove ${player.name} from queue` : `Queue ${player.name}`
          }
          className={`rounded-lg border p-1.5 transition ${
            queued
              ? "border-brand-cta bg-brand-cta/10 text-brand-cta-dark"
              : "border-brand-border text-brand-muted hover:bg-brand-soft hover:text-brand-dark"
          }`}
        >
          <FiStar
            className={`h-4 w-4 ${queued ? "fill-brand-cta-dark" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={onDraft}
          disabled={!canDraft}
          className="rounded-lg bg-brand-cta px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-40"
        >
          Draft
        </button>
      </div>
    </li>
  );
}
