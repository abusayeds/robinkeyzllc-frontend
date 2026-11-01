"use client";

import { useEffect } from "react";
import { FiX } from "react-icons/fi";
import type { FreeAgent } from "@/lib/store/api/endpoints/freeAgencyApi";
import { money, seasonLabel } from "./contract";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * Who else is bidding. Offers are open within the league on purpose: a team
 * deciding what to bid needs to see what it is bidding against.
 */
export default function CompetingOffersModal({
  player,
  seasonStartYear,
  onClose,
}: {
  player: FreeAgent | null;
  seasonStartYear: number;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!player) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-brand-border px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-brand-dark">
              Offers for {player.name}
            </h2>
            <p className="text-xs text-brand-muted">
              {player.offers.length} pending offer
              {player.offers.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-brand-muted transition hover:bg-brand-soft hover:text-brand-dark"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <ul className="divide-y divide-brand-border">
          {player.offers.map((offer) => (
            <li
              key={offer.id}
              className={`flex items-center justify-between gap-3 px-5 py-3 ${
                offer.isMine ? "bg-brand-cta/5" : ""
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-7 w-1.5 rounded-full"
                  style={{ backgroundColor: offer.team.color }}
                />
                <div>
                  <p className="text-sm font-medium text-brand-dark">
                    {offer.team.name}
                    {offer.isMine ? (
                      <span className="ml-1.5 text-[11px] font-semibold text-brand-cta-dark">
                        yours
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {offer.years} year{offer.years === 1 ? "" : "s"} from{" "}
                    {seasonLabel(seasonStartYear)}
                    {offer.raisePct ? ` · ${offer.raisePct}% raises` : ""} ·
                    sent {formatDate(offer.createdAt)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-dark">
                  {money(offer.totalValue)}
                </p>
                <p className="text-[11px] text-brand-muted">
                  {money(offer.firstYearSalary)} in year one
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
