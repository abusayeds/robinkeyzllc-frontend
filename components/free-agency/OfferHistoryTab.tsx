"use client";

import {
  OFFER_STATUS_LABEL,
  OFFER_STATUS_TONE,
  type Offer,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import { money, seasonLabel } from "./contract";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default function OfferHistoryTab({
  offers,
  seasonStartYear,
  onWithdraw,
}: {
  offers: Offer[];
  seasonStartYear: number;
  onWithdraw: (offer: Offer) => void;
}) {
  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
        You have not made any offers yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {offers.map((offer) => {
        const failed = offer.checks.filter((check) => !check.pass);

        return (
          <div
            key={offer.id}
            className="rounded-xl border border-brand-border bg-white shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-brand-dark">
                  {offer.player.name}
                  {offer.player.position ? (
                    <span className="ml-1.5 text-xs font-normal text-brand-muted">
                      {offer.player.position}
                    </span>
                  ) : null}
                </p>
                <p className="text-[11px] text-brand-muted">
                  {offer.years} year{offer.years === 1 ? "" : "s"} from{" "}
                  {seasonLabel(seasonStartYear)}
                  {offer.raisePct ? ` · ${offer.raisePct}% raises` : ""} · sent{" "}
                  {formatDate(offer.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-brand-dark">
                    {money(offer.totalValue)}
                  </p>
                  <p className="text-[11px] text-brand-muted">
                    {money(offer.firstYearSalary)} in year one
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${OFFER_STATUS_TONE[offer.status]}`}
                >
                  {OFFER_STATUS_LABEL[offer.status]}
                </span>
              </div>
            </div>

            {failed.length > 0 ? (
              <p className="border-t border-brand-border bg-amber-50 px-4 py-2 text-xs text-amber-700">
                Flagged for the commissioner —{" "}
                {failed.map((check) => check.label).join(", ")}.
              </p>
            ) : null}

            {offer.status === "pending" ? (
              <div className="flex justify-end border-t border-brand-border px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => onWithdraw(offer)}
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft"
                >
                  Withdraw
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
