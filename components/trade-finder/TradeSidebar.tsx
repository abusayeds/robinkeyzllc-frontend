"use client";

import Image from "next/image";
import { FiStar, FiX } from "react-icons/fi";
import { avatarSrc } from "@/lib/avatar";
import type { FinderPlayer } from "@/lib/store/api/endpoints/tradeApi";

const money = (value: number) =>
  value >= 1_000_000
    ? `$${(value / 1_000_000).toFixed(1)}M`
    : `$${Math.round(value / 1_000)}K`;

/** "3d ago" — the card is about recency, not dates. */
const timeAgo = (value: string) => {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days >= 30) return `${Math.floor(days / 30)}mo ago`;
  if (days >= 1) return `${days}d ago`;
  const hours = Math.floor(diff / 3_600_000);
  return hours >= 1 ? `${hours}h ago` : "just now";
};

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const resolved = avatarSrc(src);

  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-forest text-[11px] font-bold text-brand-accent">
      {resolved ? (
        <Image
          src={resolved}
          alt={name}
          fill
          sizes="32px"
          unoptimized
          className="object-cover"
        />
      ) : (
        name.charAt(0)
      )}
    </span>
  );
}

export type RecentTrade = {
  id: string;
  name: string;
  team: string;
  date: string;
};

export default function TradeSidebar({
  recentlyTraded,
  saved,
  onRemoveSaved,
}: {
  recentlyTraded: RecentTrade[];
  saved: FinderPlayer[];
  onRemoveSaved: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        {/* AVORA has no trade block, so this is who has actually moved —
            the same question somebody shopping around is asking. */}
        <h3 className="text-sm font-semibold text-brand-dark">
          Recently Listed
        </h3>
        {recentlyTraded.length === 0 ? (
          <p className="mt-3 text-xs text-brand-muted">
            No trades have been processed in this league yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {recentlyTraded.map((trade) => (
              <li key={trade.id} className="flex items-center gap-3">
                <Avatar name={trade.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-dark">
                    {trade.name}
                  </p>
                  <p className="truncate text-xs text-brand-muted">
                    {trade.team}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-brand-muted">
                  {timeAgo(trade.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark">
          <FiStar className="h-4 w-4 fill-brand-cta-dark text-brand-cta-dark" />
          Saved Players
          <span className="text-brand-muted">({saved.length})</span>
        </h3>
        <ul className="mt-3 space-y-3">
          {saved.length === 0 ? (
            <li className="text-xs text-brand-muted">No saved players yet.</li>
          ) : (
            saved.map((player) => (
              <li key={player.id} className="flex items-center gap-3">
                <Avatar name={player.name} src={player.headshot} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-dark">
                    {player.name}
                  </p>
                  <p className="truncate text-xs text-brand-muted">
                    {player.salary === null ? "—" : money(player.salary)}
                    {player.team ? ` · ${player.team.abbr}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveSaved(player.id)}
                  aria-label={`Remove ${player.name}`}
                  className="shrink-0 rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
