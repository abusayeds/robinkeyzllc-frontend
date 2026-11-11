"use client";

import Image from "next/image";
import { FiStar } from "react-icons/fi";
import { avatarSrc } from "@/lib/avatar";
import type { FinderPlayer } from "@/lib/store/api/endpoints/tradeApi";

/**
 * The nine the board shows. `3P%` is threes made per game rather than a
 * percentage: AVORA scores 3PTM, so that is the number worth comparing, and
 * it is what the standings table shows too.
 */
const STATS: { key: string; label: string; of: (p: FinderPlayer) => number | null }[] = [
  { key: "pts", label: "PTS", of: (p) => p.stats?.pts ?? null },
  { key: "reb", label: "REB", of: (p) => p.stats?.reb ?? null },
  { key: "ast", label: "AST", of: (p) => p.stats?.ast ?? null },
  { key: "stl", label: "STL", of: (p) => p.stats?.stl ?? null },
  { key: "blk", label: "BLK", of: (p) => p.stats?.blk ?? null },
  { key: "to", label: "TO", of: (p) => p.stats?.to ?? null },
  { key: "fgPct", label: "FG%", of: (p) => p.stats?.fgPct ?? null },
  { key: "threes", label: "3PTM", of: (p) => p.stats?.threes ?? null },
  { key: "ftPct", label: "FT%", of: (p) => p.stats?.ftPct ?? null },
];

export default function PlayerRow({
  player,
  saved,
  onToggleSave,
  onOpenDetail,
  onTrade,
}: {
  player: FinderPlayer;
  saved: boolean;
  onToggleSave: () => void;
  onOpenDetail: () => void;
  onTrade: () => void;
}) {
  const headshot = avatarSrc(player.headshot);

  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
      <div className="flex min-w-0 items-center gap-3 md:w-56 md:shrink-0">
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-forest text-xs font-bold text-brand-accent">
          {headshot ? (
            <Image
              src={headshot}
              alt={player.name}
              fill
              sizes="40px"
              unoptimized
              className="object-cover"
            />
          ) : (
            player.name.charAt(0)
          )}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDetail}
              className="truncate text-sm font-semibold text-brand-dark hover:text-brand-cta-dark hover:underline"
            >
              {player.name}
            </button>
            <span className="rounded bg-brand-soft px-1.5 text-[10px] font-bold text-brand-muted">
              {player.position}
            </span>

          </div>
          <p className="truncate text-xs text-brand-muted">
            {player.team?.name ?? "Free agent"}
            {player.nbaTeam ? ` · ${player.nbaTeam}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap gap-x-3 gap-y-1">
        {STATS.map((stat) => {
          const value = stat.of(player);
          return (
            <span key={stat.key} className="whitespace-nowrap text-xs">
              <span className="font-semibold text-brand-dark">
                {value === null ? "—" : value.toFixed(1)}
              </span>{" "}
              <span className="text-brand-muted">{stat.label}</span>
            </span>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onToggleSave}
          aria-label={saved ? "Remove from saved" : "Save player"}
          className={`rounded-lg border p-1.5 transition ${
            saved
              ? "border-brand-cta bg-brand-cta/10 text-brand-cta-dark"
              : "border-brand-border text-brand-muted hover:bg-brand-soft"
          }`}
        >
          <FiStar
            className={`h-4 w-4 ${saved ? "fill-brand-cta-dark" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={onTrade}
          className="rounded-lg bg-brand-cta px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark"
        >
          Trade
        </button>
      </div>
    </div>
  );
}
