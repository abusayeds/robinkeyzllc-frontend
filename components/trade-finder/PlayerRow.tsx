"use client";

import Image from "next/image";
import { FiStar } from "react-icons/fi";
import type { TradePlayer } from "@/lib/store/features/tradeSlice";

export type StatAverages = Record<
  "pts" | "reb" | "ast" | "stl" | "blk" | "to" | "fgPct" | "threePct" | "ftPct",
  number
>;

const STATS: { key: keyof StatAverages; label: string }[] = [
  { key: "pts", label: "PTS" },
  { key: "reb", label: "REB" },
  { key: "ast", label: "AST" },
  { key: "stl", label: "STL" },
  { key: "blk", label: "BLK" },
  { key: "to", label: "TO" },
  { key: "fgPct", label: "FG%" },
  { key: "threePct", label: "3P%" },
  { key: "ftPct", label: "FT%" },
];

export default function PlayerRow({
  player,
  saved,
  onToggleSave,
  onOpenDetail,
  onTrade,
}: {
  player: TradePlayer;
  saved: boolean;
  onToggleSave: () => void;
  onOpenDetail: () => void;
  onTrade: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
      <div className="flex min-w-0 items-center gap-3 md:w-56 md:shrink-0">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-brand-forest">
          <Image
            src="/image/randomuser.jpg"
            alt={player.name}
            fill
            sizes="40px"
            className="object-cover"
          />
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
            {player.hot ? <span className="text-xs">🔥</span> : null}
          </div>
          <p className="truncate text-xs text-brand-muted">{player.team}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap gap-x-3 gap-y-1">
        {STATS.map((stat) => (
          <span key={stat.key} className="whitespace-nowrap text-xs">
            <span className="font-semibold text-brand-dark">
              {player[stat.key].toFixed(1)}
            </span>{" "}
            <span className="text-brand-muted">{stat.label}</span>
          </span>
        ))}
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
