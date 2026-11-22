"use client";

import { FiPlus, FiX } from "react-icons/fi";
import type { Team } from "@/lib/store/api/endpoints/teamApi";
import TeamLogo from "@/components/ui/TeamLogo";
import { useModalShell } from "@/lib/useModalShell";

export default function AddTeamModal({
  open,
  teams,
  recordOf,
  onPick,
  onClose,
}: {
  open: boolean;
  /** Only the teams not already in the trade. */
  teams: Team[];
  /** Their record from the standings, blank before any games are played. */
  recordOf: (teamId: number) => string | null;
  onPick: (teamId: number) => void;
  onClose: () => void;
}) {
  useModalShell(open, onClose);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add team to trade"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[85dvh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 className="text-sm font-bold text-brand-dark">
            Add Team to Trade
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {teams.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-brand-muted">
            Every team in the league is already in this trade.
          </p>
        ) : (
          <ul className="flex-1 divide-y divide-brand-border overflow-y-auto">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TeamLogo
                    name={team.name}
                    src={team.logo}
                    className="h-8 w-8 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-brand-dark">
                      {team.name}
                    </p>
                    <p className="truncate text-xs text-brand-muted">
                      {recordOf(team.id) ?? team.abbr}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPick(team.id)}
                  className="flex shrink-0 items-center gap-1 rounded-lg border border-brand-border px-2.5 py-1 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
                >
                  <FiPlus className="h-3.5 w-3.5" /> Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
