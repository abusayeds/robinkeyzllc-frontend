"use client";

import { useEffect, useMemo, useState } from "react";
import { FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { updateStandings } from "@/lib/store/features/teamSlice";
import { updateYourTeamRecord } from "@/lib/store/features/leagueSlice";

function parseRecord(record: string) {
  const [w, l, t] = record.split("-").map((v) => Number(v) || 0);
  return { wins: w ?? 0, losses: l ?? 0, ties: t ?? 0 };
}

const numberFieldClass =
  "w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-center text-sm font-semibold text-brand-dark outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20";

export default function StandingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dispatch = useAppDispatch();
  const team = useAppSelector((state) => state.team);
  const league = useAppSelector((state) => state.league);
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const yourTeam = useMemo(
    () => leagueTeams.find((t) => t.yourTeam),
    [leagueTeams]
  );
  const teamName = yourTeam?.franchise ?? team.name;

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [ties, setTies] = useState(0);

  useEffect(() => {
    if (!open) return;
    const parsed = parseRecord(team.record);
    setWins(parsed.wins);
    setLosses(parsed.losses);
    setTies(parsed.ties);
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
  }, [open, team.record, onClose]);

  if (!open) return null;

  function handleSave() {
    const record = ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`;
    dispatch(updateStandings({ wins, losses, ties }));
    dispatch(updateYourTeamRecord(record));
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="standings-title"
    >
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-5 py-4">
          <h2 id="standings-title" className="text-sm font-bold text-brand-dark">
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

        <div className="space-y-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-forest text-sm font-bold text-brand-accent">
              {teamName.charAt(0)}
            </span>
            <div>
              <p className="text-sm font-bold text-brand-dark">{teamName}</p>
              <p className="text-xs text-brand-muted">{league.name}</p>
            </div>
          </div>

          <p className="flex items-start gap-2 rounded-lg bg-brand-soft/70 px-3 py-2 text-[11px] text-brand-muted">
            Manually enter your current standings from your league&apos;s scoring
            platform (e.g. Fantrax, ESPN, Yahoo, etc). Avora does not track
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
                className={numberFieldClass}
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
                className={numberFieldClass}
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
                className={numberFieldClass}
              />
            </label>
          </div>

          <div className="rounded-lg border border-brand-border px-3 py-2.5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Your Rank (Auto-calculated)
            </p>
            <div className="flex items-center justify-between text-center">
              <div className="flex-1">
                <p className="text-lg font-bold text-brand-dark">{team.rank}</p>
                <p className="text-[10px] text-brand-muted">Overall</p>
              </div>
              <div className="flex-1 border-l border-brand-border">
                <p className="text-lg font-bold text-brand-dark">
                  {team.conferenceRank}
                </p>
                <p className="text-[10px] text-brand-muted">
                  Eastern Conference
                </p>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-brand-muted">
            Last updated: {team.standingsUpdatedAt}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-brand-cta px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            Save Standings
          </button>
        </div>
      </div>
    </div>
  );
}
