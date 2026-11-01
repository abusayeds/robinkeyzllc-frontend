"use client";

import { useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { unqueueProspect, type DraftProspect } from "@/lib/store/features/draftSlice";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import { draftProspectToRosterPlayer } from "./adapter";
import { money } from "./utils";

export default function DraftQueue({
  pool,
  compact = false,
}: {
  pool: "rookie" | "startup";
  compact?: boolean;
}) {
  const dispatch = useAppDispatch();
  const [detail, setDetail] = useState<DraftProspect | null>(null);
  const queue = useAppSelector((state) => state.draft.queue);
  const rookiePool = useAppSelector((state) => state.draft.rookie);
  const startupPool = useAppSelector((state) => state.draft.startup);
  const prospects = pool === "rookie" ? rookiePool : startupPool;
  const allProspects = useMemo(
    () => [...rookiePool, ...startupPool],
    [rookiePool, startupPool]
  );

  const items = queue
    .map((id) => allProspects.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .filter((p) => prospects.some((x) => x.id === p.id) || compact);

  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-dark">
          {compact ? "Draft Queue" : "My Queue"}
        </h3>
        {compact ? (
          <span className="flex items-center gap-1.5 text-[11px] text-brand-muted">
            Auto Pick
            <span className="flex h-4 w-7 items-center rounded-full bg-brand-border p-0.5">
              <span className="h-3 w-3 rounded-full bg-white" />
            </span>
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-brand-muted">Your queue is empty.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-brand-border px-2.5 py-1.5 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-brand-muted">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => setDetail(p)}
                  className="truncate font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                >
                  {p.name}
                </button>
                <span className="shrink-0 text-brand-muted">
                  {p.position} · {p.age}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-semibold text-brand-cta-dark">
                  {money(p.salary)}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch(unqueueProspect(p.id))}
                  aria-label={`Remove ${p.name}`}
                  className="text-brand-muted transition hover:text-red-500"
                >
                  <FiX className="h-3.5 w-3.5" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <PlayerDetailModal
        player={detail ? draftProspectToRosterPlayer(detail) : null}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
