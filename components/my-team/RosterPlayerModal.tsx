"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import {
  SLOT_LABEL,
  STATUS_LABEL,
  type RosterPlayer,
} from "@/lib/store/api/endpoints/rosterApi";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const OPTION_LABEL: Record<string, string> = {
  player: "Player option",
  team: "Team option",
  earlyTermination: "Early termination",
};

const GUARANTEE_LABEL: Record<string, string> = {
  full: "Guaranteed",
  partial: "Partially guaranteed",
  none: "Non-guaranteed",
};

/**
 * A real player, with the fields the league actually holds.
 *
 * Deliberately separate from `PlayerDetailModal`, which the draft and trade
 * screens still use with mock data and invented statistics. The two merge when
 * those pages move onto the API and season stats are being synced.
 */
export default function RosterPlayerModal({
  player,
  seasonStartYear,
  onClose,
}: {
  player: RosterPlayer | null;
  seasonStartYear: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!player) return null;

  const facts = [
    { label: "Position", value: player.position ?? "—" },
    { label: "NBA team", value: player.nbaTeam ?? "—" },
    {
      label: "Experience",
      value:
        player.experience === null
          ? "—"
          : `${player.experience} yr${player.experience === 1 ? "" : "s"}${
              player.experienceIsEstimated ? " (estimated)" : ""
            }`,
    },
    { label: "Bird years", value: String(player.birdYears) },
    {
      label: "Status",
      value:
        player.status === "rostered"
          ? SLOT_LABEL[player.slotType]
          : STATUS_LABEL[player.status],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="my-8 w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <div>
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-brand-dark">
              {player.name}
              {player.slotType === "twoWay" ? (
                <span className="inline-flex rounded bg-brand-dark/10 px-1 py-0.5 text-[10px] font-bold text-brand-dark">
                  TW
                </span>
              ) : null}
            </h2>
            {player.contract?.rfaOnExpiry ? (
              <p className="text-xs text-brand-muted">
                Restricted free agent when this contract expires
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-3 px-5 py-4 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
                {fact.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-brand-dark">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>

        {player.contract ? (
          <div className="border-t border-brand-border px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Contract · {player.contract.years} year
              {player.contract.years === 1 ? "" : "s"}
            </p>
            <table className="mt-2 w-full text-sm">
              <tbody className="divide-y divide-brand-border">
                {player.contract.seasons.map((season) => (
                  <tr key={season.seasonStartYear}>
                    <td
                      className={`py-1.5 ${
                        season.seasonStartYear === seasonStartYear
                          ? "font-semibold text-brand-dark"
                          : "text-brand-muted"
                      }`}
                    >
                      {seasonLabel(season.seasonStartYear)}
                    </td>
                    <td className="py-1.5 text-xs text-brand-muted">
                      {[
                        season.optionType
                          ? OPTION_LABEL[season.optionType]
                          : null,
                        season.guaranteeType !== "full"
                          ? GUARANTEE_LABEL[season.guaranteeType]
                          : null,
                        season.guaranteedAmount !== null
                          ? `${money(season.guaranteedAmount)} guaranteed`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </td>
                    <td className="py-1.5 text-right text-brand-dark">
                      {money(season.capHit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="border-t border-brand-border px-5 py-4 text-sm text-brand-muted">
            No contract in this league.
          </p>
        )}

        <p className="border-t border-brand-border px-5 py-3 text-[11px] text-brand-muted">
          Season statistics, height, college and draft details arrive once the
          NBA data sync is connected.
        </p>
      </div>
    </div>
  );
}
