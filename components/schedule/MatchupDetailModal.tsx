"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import type {
  LeagueTeam,
  ScheduleMatchup,
} from "@/lib/store/features/leagueSlice";
import TeamLogo from "@/components/ui/TeamLogo";
import { centerLabel, formatCategory } from "./utils";

function abbr(name?: string) {
  if (!name) return "TBD";
  return name.replace(/[^A-Za-z ]/g, "").slice(0, 3).toUpperCase().trim();
}

export default function MatchupDetailModal({
  matchup,
  home,
  away,
  onClose,
  onViewFull,
}: {
  matchup: ScheduleMatchup | null;
  home?: LeagueTeam;
  away?: LeagueTeam;
  onClose: () => void;
  onViewFull: (id: string) => void;
}) {
  useEffect(() => {
    if (!matchup) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [matchup, onClose]);

  if (!matchup) return null;
  const showScore = matchup.status !== "upcoming";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Matchup detail"
    >
      <div
        className="flex max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-brand-border px-5 pb-4 pt-5">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>

          <p className="text-center text-sm font-bold text-brand-dark">
            {home?.name} vs {away?.name}
          </p>

          <div className="mt-4 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <TeamLogo
                name={home?.name ?? "TBD"}
                src={home?.logo}
                className="h-12 w-12"
              />
              <span className="text-xs font-medium text-brand-dark">
                {home?.name}
              </span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-brand-dark">
                {showScore ? `${matchup.homeScore} - ${matchup.awayScore}` : "— vs —"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-muted">
                {centerLabel(matchup)}
              </span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <TeamLogo
                name={away?.name ?? "TBD"}
                src={away?.logo}
                className="h-12 w-12"
              />
              <span className="text-xs font-medium text-brand-dark">
                {away?.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {matchup.categories ? (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                  <th className="pb-2 text-left">{home?.name}</th>
                  <th className="pb-2 text-center">Category</th>
                  <th className="pb-2 text-right">{abbr(away?.name)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {matchup.categories.map((cat) => (
                  <tr key={cat.label}>
                    <td
                      className={`py-2 text-left font-semibold tabular-nums ${
                        cat.homeWins === true
                          ? "text-brand-cta-dark"
                          : "text-red-500"
                      }`}
                    >
                      {formatCategory(cat.home, cat.percent)}
                    </td>
                    <td className="py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                      {cat.label}
                    </td>
                    <td
                      className={`py-2 text-right font-semibold tabular-nums ${
                        cat.homeWins === false
                          ? "text-brand-cta-dark"
                          : "text-red-500"
                      }`}
                    >
                      {formatCategory(cat.away, cat.percent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-6 text-center text-sm text-brand-muted">
              Category breakdown available once the matchup begins.
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onViewFull(matchup.id)}
            className="flex-1 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            View Full Matchup
          </button>
        </div>
      </div>
    </div>
  );
}
