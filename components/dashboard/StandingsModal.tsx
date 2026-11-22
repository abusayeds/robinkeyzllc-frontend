"use client";

import { useEffect, useState } from "react";
import { FiAlertTriangle, FiX } from "react-icons/fi";
import {
  useSetTeamRecordMutation,
  type StandingRow,
} from "@/lib/store/api/endpoints/standingsApi";
import { useModalShell } from "@/lib/useModalShell";

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const fieldClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-center text-sm font-semibold text-brand-dark outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20";

const ordinal = (place: number) => {
  const mod100 = place % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${place}th`;
  const suffix = ["th", "st", "nd", "rd"][place % 10] ?? "th";
  return `${place}${suffix}`;
};

/**
 * Where an owner types their record in.
 *
 * AVORA does not score games: a league plays on Fantrax, ESPN or Yahoo and
 * brings its results here. The rank is not typed in — it follows from the
 * table once the record is saved.
 */
export default function StandingsModal({
  open,
  leagueId,
  leagueName,
  team,
  rank,
  conferenceRank,
  onClose,
}: {
  open: boolean;
  leagueId: number;
  leagueName: string;
  team: StandingRow | null;
  rank: number | null;
  conferenceRank: number | null;
  onClose: () => void;
}) {
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [save, { isLoading: saving }] = useSetTeamRecordMutation();

  // The record as it stands, each time a different team is opened.
  useEffect(() => {
    if (!open || !team) return;
    setWins(team.w);
    setLosses(team.l);
    setTies(team.t);
    setError(null);
  }, [open, team]);

  useModalShell(open && Boolean(team), onClose);

  if (!open || !team) return null;

  const submit = async () => {
    setError(null);
    try {
      await save({ leagueId, teamId: team.id, wins, losses, ties }).unwrap();
      onClose();
    } catch (e) {
      setError(errorText(e, "That record could not be saved."));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="standings-title"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-card supports-[height:100dvh]:max-h-[85dvh]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-brand-border px-5 py-4">
          <h2
            id="standings-title"
            className="text-sm font-bold text-brand-dark"
          >
            Update Your Standings
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

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-forest text-sm font-bold text-brand-accent">
              {team.team.charAt(0)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-brand-dark">
                {team.team}
              </p>
              <p className="truncate text-xs text-brand-muted">{leagueName}</p>
            </div>
          </div>

          <p className="rounded-lg bg-brand-soft/70 px-3 py-2 text-[11px] leading-relaxed text-brand-muted">
            Manually enter your current standings from your league&rsquo;s
            scoring platform (e.g. Fantrax, ESPN, Yahoo). Avora does not track
            scoring.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Wins
              </span>
              <input
                type="number"
                min={0}
                value={wins}
                onChange={(e) => setWins(Math.max(0, Number(e.target.value)))}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Losses
              </span>
              <input
                type="number"
                min={0}
                value={losses}
                onChange={(e) => setLosses(Math.max(0, Number(e.target.value)))}
                className={fieldClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                Ties (Optional)
              </span>
              <input
                type="number"
                min={0}
                value={ties}
                onChange={(e) => setTies(Math.max(0, Number(e.target.value)))}
                className={fieldClass}
              />
            </label>
          </div>

          <div className="rounded-lg border border-brand-border px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Your Rank (Auto-calculated)
            </p>
            <div className="flex items-center justify-between text-center">
              <div className="flex-1">
                <p className="text-lg font-bold text-brand-dark">
                  {rank ? ordinal(rank) : "—"}
                </p>
                <p className="text-[10px] text-brand-muted">Overall</p>
              </div>
              <div className="flex-1 border-l border-brand-border">
                <p className="text-lg font-bold text-brand-dark">
                  {conferenceRank ? ordinal(conferenceRank) : "—"}
                </p>
                <p className="text-[10px] text-brand-muted">
                  {team.conference === "East" ? "Eastern" : "Western"}{" "}
                  Conference
                </p>
              </div>
            </div>
          </div>

          {team.recordUpdatedAt ? (
            <p className="text-[11px] text-brand-muted">
              Last updated:{" "}
              {new Date(team.recordUpdatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          ) : null}

          {error ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={saving}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Standings"}
          </button>
        </div>
      </div>
    </div>
  );
}
