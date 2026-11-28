"use client";

import { FiLock } from "react-icons/fi";
import {
  OFFER_STATUS_LABEL,
  OFFER_STATUS_TONE,
  type Offer,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import PlayerHeadshot from "@/components/ui/PlayerHeadshot";
import { money } from "./contract";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

/**
 * The one-line summary under a player's name, exactly as the design writes
 * it: his team, his age, then the season line. Anything the feed has not
 * published for him is left out rather than printed as a zero.
 */
function summaryOf(offer: Offer): string {
  const stats = offer.player.stats;
  const parts: string[] = [];

  if (offer.player.currentTeam) parts.push(offer.player.currentTeam.name);
  if (offer.player.age !== null) parts.push(`Age ${offer.player.age}`);

  if (!stats) return parts.join(" · ");

  const line = [
    `${stats.pts.toFixed(1)} PTS`,
    `${stats.reb.toFixed(1)} REB`,
    `${stats.ast.toFixed(1)} AST`,
    `${stats.stl.toFixed(1)} STL`,
    `${stats.blk.toFixed(1)} BLK`,
    `${stats.fgPct.toFixed(1)} FG%`,
    `${stats.ftPct.toFixed(1)} FT%`,
    `${stats.threes.toFixed(1)} 3PM`,
    `${stats.to.toFixed(1)} TO`,
  ].join(", ");

  return [...parts, line].join(" · ");
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold text-brand-dark">{value}</p>
    </div>
  );
}

function OfferRow({
  offer,
  onWithdraw,
  onModify,
  onViewOffers,
}: {
  offer: Offer;
  onWithdraw: ((offer: Offer) => void) | null;
  onModify: ((offer: Offer) => void) | null;
  onViewOffers: ((offer: Offer) => void) | null;
}) {
  const failed = offer.checks.filter((check) => !check.pass);
  const live = offer.status === "pending";
  const summary = summaryOf(offer);

  return (
    <div
      className={`rounded-xl border bg-white shadow-card ${
        live ? "border-brand-cta/40" : "border-brand-border opacity-80"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <PlayerHeadshot
            name={offer.player.name}
            src={offer.player.headshot}
            className="h-8 w-8"
          />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-brand-dark">
              {offer.player.name}
              {offer.player.position ? (
                <span className="text-xs font-normal text-brand-muted">
                  {offer.player.position}
                </span>
              ) : null}
              {/* Appendix B item 7 — what this owner ranked him. */}
              {offer.rank !== null ? (
                <span
                  title="This owner's ranking for him"
                  className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700"
                >
                  {offer.rank}
                </span>
              ) : null}
            </p>
            {summary ? (
              <p className="text-[11px] text-brand-muted">{summary}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {offer.competingOffers > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              {offer.competingOffers} competing offer
              {offer.competingOffers === 1 ? "" : "s"}
            </span>
          ) : null}
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${OFFER_STATUS_TONE[offer.status]}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {OFFER_STATUS_LABEL[offer.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-brand-border px-4 py-3 sm:grid-cols-4">
        <Figure label="Years" value={`${offer.years} yrs`} />
        <Figure
          label="AAV"
          value={money(Math.round(offer.totalValue / offer.years))}
        />
        <Figure label="Total" value={money(offer.totalValue)} />
        <Figure label="Type" value={offer.contractType} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-border px-4 py-2 text-[11px] text-brand-muted">
        <span>Submitted: {formatDate(offer.createdAt)}</span>
        {offer.expiresAt ? (
          <span className="font-semibold text-amber-700">
            Deadline: {formatDate(offer.expiresAt)}
          </span>
        ) : null}
      </div>

      {failed.length > 0 ? (
        <p className="border-t border-brand-border bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Flagged for the commissioner —{" "}
          {failed.map((check) => check.label).join(", ")}.
        </p>
      ) : null}

      {live && (onViewOffers || onModify || onWithdraw) ? (
        <div className="flex flex-wrap gap-2 border-t border-brand-border px-4 py-2.5">
          {onViewOffers ? (
            <button
              type="button"
              onClick={() => onViewOffers(offer)}
              className="flex-1 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
            >
              View Offers
            </button>
          ) : null}
          {onModify ? (
            <button
              type="button"
              onClick={() => onModify(offer)}
              className="flex-1 rounded-lg border border-brand-cta/40 bg-brand-cta/5 px-3 py-1.5 text-xs font-semibold text-brand-cta-dark transition hover:bg-brand-cta/10"
            >
              Modify Offer
            </button>
          ) : null}
          {onWithdraw ? (
            <button
              type="button"
              onClick={() => onWithdraw(offer)}
              className="flex-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
            >
              Withdraw Offer
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A team's own offer sheets, live ones first.
 *
 * Only the count of other bids is shown until you open one: an owner learns
 * what he is bidding against by bidding, which is the point of a sealed
 * offer sheet.
 */
export default function OfferHistoryTab({
  offers,
  onWithdraw,
  onModify = null,
  onViewOffers = null,
}: {
  offers: Offer[];
  onWithdraw: ((offer: Offer) => void) | null;
  onModify?: ((offer: Offer) => void) | null;
  onViewOffers?: ((offer: Offer) => void) | null;
}) {
  if (offers.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center text-sm text-brand-muted shadow-card">
        You have not made any offers yet.
      </div>
    );
  }

  const active = offers.filter((offer) => offer.status === "pending");
  const past = offers.filter((offer) => offer.status !== "pending");

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-xs text-blue-700">
        <FiLock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Offer details from other teams are only visible to you after you have
          submitted your own offer on that player. This protects competitive
          privacy.
        </span>
      </p>

      {active.length > 0 ? (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-bold text-brand-dark">
            Active Offers
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-cta/15 px-2 py-0.5 text-[11px] font-bold text-brand-cta-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {active.length}
            </span>
          </h2>
          {active.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              onWithdraw={onWithdraw}
              onModify={onModify}
              onViewOffers={onViewOffers}
            />
          ))}
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-brand-dark">
            Past Offers{" "}
            <span className="font-normal text-brand-muted">
              ({past.length})
            </span>
          </h2>
          {past.map((offer) => (
            <OfferRow
              key={offer.id}
              offer={offer}
              onWithdraw={null}
              onModify={null}
              onViewOffers={null}
            />
          ))}
        </section>
      ) : null}
    </div>
  );
}
