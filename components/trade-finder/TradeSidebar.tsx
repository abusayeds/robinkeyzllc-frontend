"use client";

import Image from "next/image";
import { FiStar, FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { removeSaved } from "@/lib/store/features/tradeSlice";

function Avatar({ name }: { name: string }) {
  return (
    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-brand-forest">
      <Image
        src="/image/randomuser.jpg"
        alt={name}
        fill
        sizes="32px"
        className="object-cover"
      />
    </span>
  );
}

export default function TradeSidebar() {
  const dispatch = useAppDispatch();
  const recentlyListed = useAppSelector((state) => state.trade.recentlyListed);
  const savedPlayers = useAppSelector((state) => state.trade.savedPlayers);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <h3 className="text-sm font-semibold text-brand-dark">Recently Listed</h3>
        <ul className="mt-3 space-y-3">
          {recentlyListed.map((player) => (
            <li key={player.id} className="flex items-center gap-3">
              <Avatar name={player.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-dark">
                  {player.name}
                </p>
                <p className="truncate text-xs text-brand-muted">
                  {player.team}
                </p>
              </div>
              <span className="shrink-0 text-xs text-brand-muted">
                {player.listedAgo}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-brand-dark">
          <FiStar className="h-4 w-4 fill-brand-cta-dark text-brand-cta-dark" />
          Saved Players
          <span className="text-brand-muted">({savedPlayers.length})</span>
        </h3>
        <ul className="mt-3 space-y-3">
          {savedPlayers.length === 0 ? (
            <li className="text-xs text-brand-muted">No saved players yet.</li>
          ) : (
            savedPlayers.map((player) => (
              <li key={player.id} className="flex items-center gap-3">
                <Avatar name={player.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-brand-dark">
                    {player.name}
                  </p>
                  <p className="truncate text-xs text-brand-muted">
                    ${player.salary.toFixed(1)}M
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch(removeSaved(player.id))}
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
