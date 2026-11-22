"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import {
  TRADE_STATUS_LABEL,
  TRADE_STATUS_TONE,
  useLeagueTradesQuery,
  useRespondToTradeMutation,
  useTradeQuery,
  useWithdrawTradeMutation,
  type Trade,
  type TradeAsset,
} from "@/lib/store/api/endpoints/tradeApi";
import TeamLogo from "@/components/ui/TeamLogo";
import TradeDetailsModal from "./TradeDetailsModal";

const money = (value: number) =>
  `$${Math.round(value).toLocaleString("en-US")}`;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const OPEN: Trade["status"][] = ["proposed", "awaitingApproval"];

const SCOPES = ["Sent", "Received"] as const;
type Scope = (typeof SCOPES)[number];

const dated = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const nameOf = (asset: TradeAsset) =>
  asset.player?.name ?? asset.pick?.label ?? asset.exception?.label ?? "Asset";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-3 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-brand-dark">{value}</p>
    </div>
  );
}

export default function PendingTradesTab({
  leagueId,
  myTeamId,
  userId,
}: {
  leagueId: number;
  myTeamId: number | null;
  userId: number | null;
}) {
  const { data: trades = [], isLoading } = useLeagueTradesQuery(
    { leagueId, teamId: myTeamId ?? undefined },
    { skip: !myTeamId },
  );

  const [respond, { isLoading: responding }] = useRespondToTradeMutation();
  const [withdraw, { isLoading: withdrawing }] = useWithdrawTradeMutation();

  // Only the id is held: the detail is read fresh, so the panel it opens is
  // judged against today's rosters rather than the row in this list.
  const [openId, setOpenId] = useState<number | null>(null);
  const [scope, setScope] = useState<Scope>("Sent");
  const [error, setError] = useState<string | null>(null);

  const busy = responding || withdrawing;

  const { data: detail } = useTradeQuery(
    { leagueId, tradeId: openId as number },
    { skip: openId === null },
  );

  const { sent, received, awaiting, declined } = useMemo(() => {
    const mineFirst = trades.filter((trade) => trade.proposedBy?.id === userId);
    const theirs = trades.filter((trade) => trade.proposedBy?.id !== userId);
    return {
      sent: mineFirst,
      received: theirs,
      awaiting: theirs.filter(
        (trade) =>
          trade.status === "proposed" &&
          trade.teams.find((side) => side.teamId === myTeamId)?.response ===
            "pending",
      ),
      declined: trades.filter(
        (trade) => trade.status === "declined" || trade.status === "rejected",
      ),
    };
  }, [trades, userId, myTeamId]);

  const list = scope === "Sent" ? sent : received;

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(errorText(e, fallback));
    }
  };

  if (!myTeamId) {
    return (
      <p className="text-sm text-brand-muted">
        You do not hold a team in this league, so there is nothing to trade.
      </p>
    );
  }

  const card = (trade: Trade) => {
    const mine = trade.teams.find((side) => side.teamId === myTeamId);
    const partners = trade.teams.filter((side) => side.teamId !== myTeamId);
    const partner = partners[0];
    const waitingOnMe =
      trade.status === "proposed" && mine?.response === "pending";
    const iProposed = trade.proposedBy?.id === userId;

    const sending = trade.assets.filter(
      (asset) => asset.fromTeamId === myTeamId,
    );
    const receiving = trade.assets.filter(
      (asset) => asset.toTeamId === myTeamId,
    );

    return (
      <div
        key={trade.id}
        className="rounded-xl border border-brand-border bg-white p-4 shadow-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <TeamLogo
              name={partner?.team.name ?? ""}
              src={partner?.team.logo ?? null}
              className="h-8 w-8 shrink-0"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-brand-dark">
                {iProposed ? "To" : "From"}{" "}
                {partners.map((side) => side.team.name).join(", ")}
              </p>
              <p className="text-xs text-brand-muted">
                {dated(trade.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {waitingOnMe ? (
              <span className="rounded-full bg-brand-cta/15 px-2 py-0.5 text-[10px] font-bold text-brand-cta-dark">
                New Offer
              </span>
            ) : null}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TRADE_STATUS_TONE[trade.status]}`}
            >
              {TRADE_STATUS_LABEL[trade.status]}
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-lg bg-brand-soft/50 p-2.5">
            <p className="font-bold text-red-500">YOU SEND</p>
            <p className="mt-0.5 text-brand-dark">
              {sending.length === 0
                ? "Nothing"
                : sending.map(nameOf).join(", ")}
            </p>
            <p className="mt-1 text-brand-muted">
              {money(mine?.outgoing ?? 0)}
            </p>
          </div>
          <div className="rounded-lg bg-brand-soft/50 p-2.5">
            <p className="font-bold text-brand-cta-dark">YOU RECEIVE</p>
            <p className="mt-0.5 text-brand-dark">
              {receiving.length === 0
                ? "Nothing"
                : receiving.map(nameOf).join(", ")}
            </p>
            <p className="mt-1 text-brand-muted">
              {money(mine?.incoming ?? 0)}
            </p>
          </div>
        </div>

        {trade.message ? (
          <p className="mt-2 text-xs italic text-brand-muted">
            “{trade.message}”
          </p>
        ) : null}

        {trade.rejectedReason ? (
          <p className="mt-2 text-xs text-red-600">{trade.rejectedReason}</p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOpenId(trade.id)}
            className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            View Details
          </button>

          {waitingOnMe ? (
            <>
              <button
                type="button"
                onClick={() =>
                  void run(
                    () =>
                      respond({
                        leagueId,
                        tradeId: trade.id,
                        teamId: myTeamId,
                        accept: true,
                      }).unwrap(),
                    "That trade could not be accepted.",
                  )
                }
                disabled={busy}
                className="rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() =>
                  void run(
                    () =>
                      respond({
                        leagueId,
                        tradeId: trade.id,
                        teamId: myTeamId,
                        accept: false,
                      }).unwrap(),
                    "That trade could not be declined.",
                  )
                }
                disabled={busy}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                Decline
              </button>
            </>
          ) : null}

          {iProposed && OPEN.includes(trade.status) ? (
            <button
              type="button"
              onClick={() =>
                void run(
                  () => withdraw({ leagueId, tradeId: trade.id }).unwrap(),
                  "That trade could not be withdrawn.",
                )
              }
              disabled={busy}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Sent Trades" value={sent.length} />
        <StatTile label="Received" value={received.length} />
        <StatTile label="Awaiting You" value={awaiting.length} />
        <StatTile label="Declined" value={declined.length} />
      </div>

      <div className="flex justify-end">
        <div className="flex rounded-lg border border-brand-border p-0.5">
          {SCOPES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScope(item)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                scope === item
                  ? "bg-brand-cta text-white"
                  : "text-brand-muted hover:text-brand-dark"
              }`}
            >
              {item} Trades ({item === "Sent" ? sent.length : received.length})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {!isLoading && list.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">
            No {scope.toLowerCase()} trades.
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            {scope === "Sent"
              ? "Build one on the Build Trade tab."
              : "Nobody has offered you a trade yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">{list.map(card)}</div>
      )}

      {/* No approve or reject here: only a commissioner can reach those
          routes, and their own page has them. */}
      <TradeDetailsModal
        trade={detail ?? null}
        evaluation={detail?.evaluation ?? null}
        leagueId={leagueId}
        myTeamId={myTeamId}
        busy={busy}
        canRespond={
          detail
            ? detail.status === "proposed" &&
              detail.teams.find((side) => side.teamId === myTeamId)
                ?.response === "pending"
            : false
        }
        canWithdraw={
          detail
            ? detail.proposedBy?.id === userId && OPEN.includes(detail.status)
            : false
        }
        onClose={() => setOpenId(null)}
        onAccept={() => {
          if (!detail) return;
          void run(
            () =>
              respond({
                leagueId,
                tradeId: detail.id,
                teamId: myTeamId,
                accept: true,
              }).unwrap(),
            "That trade could not be accepted.",
          ).then(() => setOpenId(null));
        }}
        onDecline={() => {
          if (!detail) return;
          void run(
            () =>
              respond({
                leagueId,
                tradeId: detail.id,
                teamId: myTeamId,
                accept: false,
              }).unwrap(),
            "That trade could not be declined.",
          ).then(() => setOpenId(null));
        }}
        onWithdraw={() => {
          if (!detail) return;
          void run(
            () => withdraw({ leagueId, tradeId: detail.id }).unwrap(),
            "That trade could not be withdrawn.",
          ).then(() => setOpenId(null));
        }}
      />
    </div>
  );
}
