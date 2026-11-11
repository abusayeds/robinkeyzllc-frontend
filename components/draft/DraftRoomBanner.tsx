"use client";

import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import type { DraftRoom } from "./useDraftRoom";

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

/**
 * The one line above the board that says what state the draft is in.
 *
 * The mock had no such line because its draft was always running. A real one
 * is scheduled, running or finished, and a room that looks identical in all
 * three — with a Draft button that silently does nothing — is worse than a
 * sentence saying which it is.
 */
export default function DraftRoomBanner({ room }: { room: DraftRoom }) {
  const board = room.board;
  if (!board) return null;

  if (board.status === "complete") {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-soft px-4 py-3">
        <p className="text-sm font-semibold text-brand-dark">
          The {seasonLabel(board.seasonStartYear)}{" "}
          {board.kind === "rookie" ? "rookie" : "startup"} draft is complete.
        </p>
        <p className="text-xs text-brand-muted">
          All {board.total} picks were made.
        </p>
      </div>
    );
  }

  if (board.status === "scheduled") {
    return (
      <div className="rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              This draft has not started.
            </p>
            <p className="text-xs text-brand-muted">
              {board.startsAt
                ? `Scheduled for ${new Date(board.startsAt).toLocaleString("en-US")}${
                    board.timezone ? ` (${board.timezone})` : ""
                  }.`
                : "No start time is set."}{" "}
              {board.total === 0
                ? "The commissioner sets the order first."
                : `${board.total} picks are in the order, ${board.pickSeconds} seconds each.`}
            </p>
          </div>
          {/* Shown to everyone and refused by the server for anybody who is
              not a commissioner, rather than hidden: an owner who cannot see
              the button has no way of knowing the draft is waiting on one. */}
          <button
            type="button"
            onClick={room.startDraft}
            disabled={room.isStarting || board.total === 0}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-40"
          >
            {room.isStarting ? "Starting…" : "Start Draft"}
          </button>
        </div>
        {room.startError ? (
          <p className="mt-2 text-xs text-red-500">
            {getApiErrorMessage(room.startError)}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-border bg-white px-4 py-2.5 shadow-card">
      <p className="text-xs text-brand-muted">
        Pick{" "}
        <span className="font-semibold text-brand-dark">{board.made + 1}</span>{" "}
        of {board.total} · {board.format === "snake" ? "Snake" : "Linear"} order
        · {board.pickSeconds}s per pick
        {room.statsSeason === null
          ? " · no stats synced yet"
          : ` · ${seasonLabel(room.statsSeason)} averages`}
      </p>
      {room.pickError ? (
        <p className="text-xs text-red-500">
          {getApiErrorMessage(room.pickError)}
        </p>
      ) : null}
    </div>
  );
}
