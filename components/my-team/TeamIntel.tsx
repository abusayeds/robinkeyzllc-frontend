"use client";

import { useEffect, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import {
  INTEL_LABEL,
  INTEL_OPTIONS,
  INTEL_TONE,
  useSetTeamIntelMutation,
  type TeamIntelStatus,
} from "@/lib/store/api/endpoints/teamApi";

/**
 * League Intel — what this team says it is doing this season.
 *
 * Self-reported, which is the whole point: the owner sets their own, and every
 * other owner reads it on the Teams page. Nothing in the cap engine looks at
 * it; it exists so the rest of the league knows who is worth calling about a
 * trade.
 *
 * Only ever rendered for a team the viewer holds. Another team's intel is
 * shown as a badge on its card and is not editable from anywhere.
 */
export default function TeamIntel({
  leagueId,
  teamId,
  status,
}: {
  leagueId: number;
  teamId: number;
  status: TeamIntelStatus | null;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const [setIntel, { isLoading }] = useSetTeamIntelMutation();

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const choose = async (next: TeamIntelStatus | null) => {
    setError(null);
    setOpen(false);
    try {
      await setIntel({ leagueId, teamId, status: next }).unwrap();
    } catch (e) {
      setError(getApiErrorMessage(e, "That could not be saved."));
    }
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isLoading}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-lg border border-brand-border bg-white px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-50"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
          Intel
        </span>
        {status ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${INTEL_TONE[status]}`}
          >
            {INTEL_LABEL[status]}
          </span>
        ) : (
          <span className="text-sm font-medium text-brand-muted">Not set</span>
        )}
        <FiChevronDown className="h-4 w-4 text-brand-muted" />
      </button>

      {open ? (
        /* Right-aligned and width-capped: V5 reported the dropdown running off
           the side of a phone screen when it opened from a button near the
           right edge. */
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-44 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-brand-border bg-white py-1 shadow-card"
        >
          {INTEL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitem"
              onClick={() => void choose(option)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-brand-soft ${
                status === option
                  ? "font-semibold text-brand-cta-dark"
                  : "text-brand-dark"
              }`}
            >
              {INTEL_LABEL[option]}
              {status === option ? <span aria-hidden>·</span> : null}
            </button>
          ))}
          <div className="my-1 border-t border-brand-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => void choose(null)}
            disabled={status === null}
            className="w-full px-3 py-2 text-left text-sm text-brand-muted transition hover:bg-brand-soft disabled:opacity-40"
          >
            Clear intel
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="absolute right-0 mt-1 whitespace-nowrap text-xs text-red-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}
