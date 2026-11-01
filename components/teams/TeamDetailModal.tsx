"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import type { LeagueTeam } from "@/lib/store/features/leagueSlice";
import TeamLogo from "@/components/ui/TeamLogo";
import { capStatusTone, money, moneyTone, ordinal } from "./utils";

const rows = (team: LeagueTeam) => [
  { label: "Roster", value: `${team.rosterCount}/${team.rosterMax}` },
  { label: "League Rank", value: ordinal(team.leagueRank) },
  {
    label: "Cap Space",
    value: money(team.capSpace),
    valueClass: moneyTone(team.capSpace),
  },
  { label: "Luxury Tax", value: money(team.luxuryTax) },
  { label: "1st Apron", value: money(team.firstApron) },
  { label: "Cap Room", value: money(team.capRoom) },
];

export default function TeamDetailModal({
  team,
  onClose,
}: {
  team: LeagueTeam | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!team) return;
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
  }, [team, onClose]);

  if (!team) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${team.name} details`}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-card"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-brand-border px-5 py-4">
          <div className="flex items-center gap-3">
            <TeamLogo
              name={team.name}
              src={team.logo}
              className="h-11 w-11"
              rounded="rounded-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-brand-dark">
                  {team.name}
                </h2>
                {team.yourTeam ? (
                  <span className="rounded-full bg-brand-cta/15 px-2 py-0.5 text-[10px] font-bold text-brand-cta-dark">
                    Your Team
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-brand-muted">
                {team.owner} · {team.record}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-brand-muted">
              Cap Status
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${capStatusTone(
                team.capStatus
              )}`}
            >
              {team.capStatus}
            </span>
          </div>

          <dl className="divide-y divide-brand-border">
            {rows(team).map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2.5"
              >
                <dt className="text-sm text-brand-muted">{row.label}</dt>
                <dd
                  className={`text-sm font-semibold ${
                    row.valueClass ?? "text-brand-dark"
                  }`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-brand-border px-5 py-4">
          <button
            type="button"
            className="flex-1 rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            View Roster
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-brand-forest px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Trade Block
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg bg-brand-cta px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-cta-dark"
          >
            Send Offer
          </button>
        </div>
      </div>
    </div>
  );
}
