"use client";

import { FiX } from "react-icons/fi";
import type { PoolPlayer } from "@/lib/store/api/endpoints/draftApi";

/**
 * The viewer's shortlist.
 *
 * Takes the players rather than looking them up: the room holds the pool page
 * already, and a queue entry whose player has since been taken by somebody
 * else should disappear from the list on its own — which it does, because the
 * pool no longer returns him.
 */
export default function DraftQueue({
  items,
  compact = false,
  onRemove,
  onSelect,
}: {
  items: PoolPlayer[];
  compact?: boolean;
  onRemove: (playerId: number) => void;
  onSelect: (playerId: number) => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-dark">
          {compact ? "Draft Queue" : "My Queue"}
        </h3>
        {compact ? (
          // Was a toggle with no handler. Auto-pick is not optional — the
          // server takes the best available player the moment a clock runs
          // out, or a draft could stall on one absent owner — so it reads as
          // the statement it always was.
          <span className="flex items-center gap-1.5 text-[11px] text-brand-muted">
            Auto Pick
            <span className="rounded-full bg-brand-cta/15 px-1.5 py-0.5 text-[10px] font-bold text-brand-cta-dark">
              Always on
            </span>
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-brand-muted">Your queue is empty.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((player, index) => (
            <li
              key={player.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-brand-border px-2.5 py-1.5 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-brand-muted">{index + 1}</span>
                <button
                  type="button"
                  onClick={() => onSelect(player.id)}
                  className="truncate font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                >
                  {player.name}
                </button>
                <span className="shrink-0 text-brand-muted">
                  {player.position ?? "—"} · {player.age ?? "—"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-semibold text-brand-cta-dark">
                  {player.stats ? `${player.stats.pts.toFixed(1)} PTS` : "—"}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(player.id)}
                  aria-label={`Remove ${player.name}`}
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
  );
}
