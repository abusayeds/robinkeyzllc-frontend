"use client";

import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheck,
  FiSearch,
  FiX,
} from "react-icons/fi";
import {
  OFFER_STATUS_LABEL,
  OFFER_STATUS_TONE,
  useAcceptOfferMutation,
  useDeclineOfferMutation,
  useLeagueOffersQuery,
  type Offer,
  type OfferStatus,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useAppSelector } from "@/lib/store/hooks";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const seasonLabel = (startYear: number) =>
  `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const STATUS_FILTERS: Array<OfferStatus | "all"> = [
  "all",
  "pending",
  "accepted",
  "declined",
  "withdrawn",
];

function OfferCard({
  offer,
  seasonStartYear,
  canEdit,
  busy,
  onAccept,
  onDecline,
}: {
  offer: Offer;
  seasonStartYear: number;
  canEdit: boolean;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [open, setOpen] = useState(false);
  const failed = offer.checks.filter((check) => !check.pass);

  return (
    <div className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 h-8 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: offer.team.color }}
          />
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
              {offer.team.name} offering
              {offer.player.currentTeam
                ? ` · rights held by ${offer.player.currentTeam.abbr}`
                : ""}
              {offer.offeredBy ? ` · ${offer.offeredBy.name}` : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              {offer.years} year{offer.years === 1 ? "" : "s"}
              {offer.raisePct ? ` · ${offer.raisePct}% raises` : ""}
            </p>
            <p className="text-sm font-semibold text-brand-dark">
              {money(offer.totalValue)}
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
        <div className="flex items-start gap-2 border-t border-brand-border bg-red-50 px-4 py-2.5 text-xs text-red-600">
          <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {failed.length} rule{failed.length === 1 ? "" : "s"} not met —{" "}
            {failed.map((check) => check.label).join(", ")}.
          </span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-border px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="text-xs font-semibold text-brand-cta-dark hover:underline"
        >
          {open ? "Hide detail" : "Show year-by-year and checks"}
        </button>

        {canEdit && offer.status === "pending" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDecline}
              disabled={busy}
              className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
            >
              {offer.isLegal ? "Accept" : "Accept anyway"}
            </button>
          </div>
        ) : null}
      </div>

      {open ? (
        <div className="grid gap-4 border-t border-brand-border px-4 py-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Year by year
            </p>
            <ul className="mt-1.5 space-y-1">
              {offer.schedule.map((year) => (
                <li
                  key={year.yearIndex}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-brand-muted">
                    {seasonLabel(seasonStartYear + year.yearIndex)}
                  </span>
                  <span className="text-brand-dark">{money(year.salary)}</span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-brand-border pt-1 text-xs font-semibold">
                <span className="text-brand-muted">Total</span>
                <span className="text-brand-dark">
                  {money(offer.totalValue)}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-muted">
              Checks when this offer was made
            </p>
            <ul className="mt-1.5 space-y-1">
              {offer.checks.map((check) => (
                <li key={check.label} className="flex items-start gap-2 text-xs">
                  {check.pass ? (
                    <FiCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-cta-dark" />
                  ) : (
                    <FiX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  )}
                  <span>
                    <span className="text-brand-dark">{check.label}</span>
                    {check.detail ? (
                      <span className="block text-brand-muted">
                        {check.detail}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function FreeAgencyManagementPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const { data, isLoading } = useLeagueOffersQuery(leagueId as number, {
    skip: !leagueId,
  });

  const [accept, { isLoading: accepting }] = useAcceptOfferMutation();
  const [decline, { isLoading: declining }] = useDeclineOfferMutation();

  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<OfferStatus | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const busy = accepting || declining;

  const offers = useMemo(() => {
    const all = data?.offers ?? [];
    const needle = term.trim().toLowerCase();

    return all.filter((offer) => {
      if (status !== "all" && offer.status !== status) return false;
      if (!needle) return true;
      return (
        offer.player.name.toLowerCase().includes(needle) ||
        offer.team.name.toLowerCase().includes(needle) ||
        offer.team.abbr.toLowerCase().includes(needle)
      );
    });
  }, [data, status, term]);

  const pendingCount = useMemo(
    () => (data?.offers ?? []).filter((o) => o.status === "pending").length,
    [data],
  );

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorText(e, fallback));
    }
  };

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to manage free agency.
      </p>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Free Agency Management
          </h1>
          <p className="text-sm text-brand-muted">
            Every offer sheet in the league for{" "}
            {data ? seasonLabel(data.seasonStartYear) : "this season"}, with the
            rules each one was judged against.
          </p>
        </div>
        <div className="relative">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search players or teams"
            className="w-60 rounded-lg border border-brand-border py-2 pl-9 pr-3 text-sm text-brand-dark outline-none focus:border-brand-cta"
          />
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {data ? (
        <div className="rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand-dark">
                {data.windowOpen ? "Free agency is open" : "Free agency is closed"}
              </p>
              <p className="text-[11px] text-brand-muted">
                {data.window
                  ? `${data.window.title} · ${formatDate(data.window.startDate)}${
                      data.window.endDate
                        ? ` – ${formatDate(data.window.endDate)}`
                        : ""
                    }`
                  : "No free agency period is on this league's calendar."}
                {data.freeAgencyStyle
                  ? ` · ${data.freeAgencyStyle === "auction" ? "Auction" : "Dynamic"}`
                  : ""}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                data.windowOpen
                  ? "bg-brand-cta/15 text-brand-cta-dark"
                  : "bg-brand-soft text-brand-muted"
              }`}
            >
              {pendingCount} pending
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatus(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              status === value
                ? "bg-brand-cta text-white"
                : "border border-brand-border text-brand-muted hover:bg-brand-soft"
            }`}
          >
            {value === "all" ? "All" : OFFER_STATUS_LABEL[value]}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {!isLoading && (data?.offers.length ?? 0) === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">
            No offers yet.
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            Team owners put offer sheets on free agents from the Free Agency
            page. They appear here as they arrive.
          </p>
        </div>
      ) : null}

      {!isLoading && offers.length === 0 && (data?.offers.length ?? 0) > 0 ? (
        <p className="text-sm text-brand-muted">
          No offers match that filter.
        </p>
      ) : null}

      <div className="space-y-3">
        {data
          ? offers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                seasonStartYear={data.seasonStartYear}
                canEdit={canEdit}
                busy={busy}
                onAccept={() =>
                  void run(
                    () => accept({ leagueId, offerId: offer.id }).unwrap(),
                    "That offer could not be accepted.",
                  )
                }
                onDecline={() =>
                  void run(
                    () => decline({ leagueId, offerId: offer.id }).unwrap(),
                    "That offer could not be declined.",
                  )
                }
              />
            ))
          : null}
      </div>
    </div>
  );
}
