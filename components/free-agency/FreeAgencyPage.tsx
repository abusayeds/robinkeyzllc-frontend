"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiSearch } from "react-icons/fi";
import {
  useFreeAgentPoolQuery,
  useLeagueOffersQuery,
  useSubmitOfferMutation,
  useWithdrawOfferMutation,
  type FreeAgent,
  type Offer,
  type OfferInput,
} from "@/lib/store/api/endpoints/freeAgencyApi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useAppSelector } from "@/lib/store/hooks";
import CapOverview from "./CapOverview";
import CompetingOffersModal from "./CompetingOffersModal";
import FreeAgentTable from "./FreeAgentTable";
import OfferHistoryTab from "./OfferHistoryTab";
import OfferSheetModal from "./OfferSheetModal";
import WithdrawOfferModal from "./WithdrawOfferModal";

const TABS = ["All Players", "My Offers"] as const;
type Tab = (typeof TABS)[number];

const TYPES = ["All Types", "UFA", "RFA"] as const;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

export default function FreeAgencyPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  // Which team the signed-in user holds here. The active league only records
  // that they have one, not which, so the membership list is the source.
  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () => memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data: pool, isLoading } = useFreeAgentPoolQuery(
    { leagueId: leagueId as number, teamId: myTeamId ?? undefined },
    { skip: !leagueId },
  );
  const { data: board } = useLeagueOffersQuery(leagueId as number, {
    skip: !leagueId,
  });

  const [submitOffer, { isLoading: submitting }] = useSubmitOfferMutation();
  const [withdrawOffer, { isLoading: withdrawing }] =
    useWithdrawOfferMutation();

  const [tab, setTab] = useState<Tab>("All Players");
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>(TYPES[0]);
  const [offerFor, setOfferFor] = useState<FreeAgent | null>(null);
  const [viewOffers, setViewOffers] = useState<FreeAgent | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Offer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const players = useMemo(() => {
    const all = pool?.players ?? [];
    const needle = search.trim().toLowerCase();

    return all.filter((player) => {
      if (needle && !player.name.toLowerCase().includes(needle)) return false;
      if (type !== TYPES[0] && player.faType !== type) return false;
      return true;
    });
  }, [pool, search, type]);

  const myOffers = useMemo(
    () =>
      (board?.offers ?? []).filter((offer) => offer.team.id === myTeamId),
    [board, myTeamId],
  );
  const pendingCount = myOffers.filter((o) => o.status === "pending").length;

  const send = async (offer: OfferInput) => {
    if (!leagueId || !myTeamId) return;
    setError(null);
    try {
      await submitOffer({ leagueId, teamId: myTeamId, offer }).unwrap();
      setOfferFor(null);
      setTab("My Offers");
    } catch (e) {
      setError(errorText(e, "That offer could not be sent."));
    }
  };

  const confirmWithdraw = async () => {
    if (!leagueId || !withdrawTarget) return;
    setError(null);
    try {
      await withdrawOffer({ leagueId, offerId: withdrawTarget.id }).unwrap();
      setWithdrawTarget(null);
    } catch (e) {
      setError(errorText(e, "That offer could not be withdrawn."));
    }
  };

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to see its free agents.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Free Agency</h1>
        <p className="text-sm text-brand-muted">
          Available free agents across the league and your active offers.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {pool && !pool.windowOpen ? (
        <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Free agency is closed.
          {pool.window
            ? ` ${pool.window.title} is on the calendar, but today is outside it.`
            : " No free agency period is on this league's calendar."}{" "}
          Offers can still be made, and will be flagged.
        </div>
      ) : null}

      <CapOverview team={pool?.team ?? null} />

      <div className="flex flex-wrap items-center border-b border-brand-border">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`relative px-3 py-2.5 text-sm transition ${
              tab === item
                ? "font-semibold text-brand-cta-dark"
                : "font-medium text-brand-muted hover:text-brand-dark"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {item}
              {item === "My Offers" && pendingCount > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-cta px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              ) : null}
            </span>
            {tab === item ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
            ) : null}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {tab === "All Players" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search free agents..."
                className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-cta"
              />
            </div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-cta"
            >
              {TYPES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>

          {!isLoading && (pool?.players.length ?? 0) === 0 ? (
            <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
              <p className="text-sm font-semibold text-brand-dark">
                No free agents in this league.
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Players reach free agency when a contract expires or a team
                releases them.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-brand-muted">
                Showing {players.length} of {pool?.players.length ?? 0} free
                agents
              </p>
              <FreeAgentTable
                players={players}
                canOffer={Boolean(myTeamId)}
                onOffer={setOfferFor}
                onViewOffers={setViewOffers}
              />
              {!myTeamId ? (
                <p className="text-xs text-brand-muted">
                  You do not hold a team in this league, so you can look but not
                  bid.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {tab === "My Offers" ? (
        <OfferHistoryTab
          offers={myOffers}
          seasonStartYear={pool?.seasonStartYear ?? board?.seasonStartYear ?? 0}
          onWithdraw={setWithdrawTarget}
        />
      ) : null}

      <OfferSheetModal
        player={offerFor}
        team={pool?.team ?? null}
        seasonStartYear={pool?.seasonStartYear ?? 0}
        busy={submitting}
        error={error}
        onClose={() => {
          setOfferFor(null);
          setError(null);
        }}
        onSubmit={(offer) => void send(offer)}
      />

      <CompetingOffersModal
        player={viewOffers}
        seasonStartYear={pool?.seasonStartYear ?? 0}
        onClose={() => setViewOffers(null)}
      />

      <WithdrawOfferModal
        offer={withdrawTarget}
        busy={withdrawing}
        onClose={() => setWithdrawTarget(null)}
        onConfirm={() => void confirmWithdraw()}
      />
    </div>
  );
}
