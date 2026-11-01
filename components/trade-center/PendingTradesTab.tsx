"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import {
  TRADE_STATUS_LABEL,
  TRADE_STATUS_TONE,
  useLeagueTradesQuery,
  useRespondToTradeMutation,
  useWithdrawTradeMutation,
  type Trade,
} from "@/lib/store/api/endpoints/tradeApi";
import TradeDetail from "@/components/commissioner/TradeDetail";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

const OPEN: Trade["status"][] = ["proposed", "awaitingApproval"];

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

  const [open, setOpen] = useState<Trade | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = responding || withdrawing;

  const { live, settled } = useMemo(
    () => ({
      live: trades.filter((trade) => OPEN.includes(trade.status)),
      settled: trades.filter((trade) => !OPEN.includes(trade.status)),
    }),
    [trades],
  );

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
    const waitingOnMe =
      trade.status === "proposed" && mine?.response === "pending";
    const iProposed = trade.proposedBy?.id === userId;

    return (
      <div
        key={trade.id}
        className="rounded-xl border border-brand-border bg-white shadow-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-brand-dark">
              {trade.teams.map((side) => side.team.abbr).join(" · ")}
            </p>
            <p className="text-[11px] text-brand-muted">
              {trade.assets.length} asset{trade.assets.length === 1 ? "" : "s"}
              {trade.proposedBy ? ` · ${trade.proposedBy.name}` : ""}
            </p>
          </div>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${TRADE_STATUS_TONE[trade.status]}`}
          >
            {TRADE_STATUS_LABEL[trade.status]}
          </span>
        </div>

        <ul className="space-y-1 border-y border-brand-border px-4 py-2.5">
          {trade.assets.map((asset) => {
            const from = trade.teams.find((s) => s.teamId === asset.fromTeamId);
            const to = trade.teams.find((s) => s.teamId === asset.toTeamId);
            return (
              <li
                key={asset.id}
                className="flex items-center gap-2 text-xs text-brand-dark"
              >
                <span className="font-semibold text-brand-muted">
                  {from?.team.abbr}
                </span>
                <FiArrowRight className="h-3 w-3 text-brand-muted" />
                <span className="font-semibold text-brand-muted">
                  {to?.team.abbr}
                </span>
                <span>{asset.player?.name ?? asset.exception?.label}</span>
                {asset.kind === "player" ? (
                  <span className="ml-auto text-brand-muted">
                    {money(asset.salary)}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        {mine ? (
          <p className="px-4 py-2 text-[11px] text-brand-muted">
            Your books: out {money(mine.outgoing)}, in {money(mine.incoming)},{" "}
            <span
              className={
                mine.net > 0
                  ? "font-semibold text-red-500"
                  : mine.net < 0
                    ? "font-semibold text-brand-cta-dark"
                    : ""
              }
            >
              {mine.net > 0 ? "+" : ""}
              {money(mine.net)} net
            </span>
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t border-brand-border px-4 py-2.5">
          <button
            type="button"
            onClick={() => setOpen(trade)}
            className="text-xs font-semibold text-brand-cta-dark hover:underline"
          >
            Details
          </button>

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
              className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
            >
              Withdraw
            </button>
          ) : null}

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
                        accept: false,
                      }).unwrap(),
                    "That trade could not be declined.",
                  )
                }
                disabled={busy}
                className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
              >
                Decline
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
            </>
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

      {isLoading ? <p className="text-sm text-brand-muted">Loading…</p> : null}

      {!isLoading && trades.length === 0 ? (
        <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-brand-dark">No trades yet.</p>
          <p className="mt-1 text-sm text-brand-muted">
            Build one on the other tab, or wait for somebody to offer.
          </p>
        </div>
      ) : null}

      {live.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-brand-dark">Open</h2>
          {live.map(card)}
        </section>
      ) : null}

      {settled.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-brand-dark">Settled</h2>
          {settled.map(card)}
        </section>
      ) : null}

      {/* The commissioner's approve and reject buttons never show here: the
          detail hides them unless the trade is awaiting approval, and only a
          commissioner can reach those routes anyway. */}
      <TradeDetail
        trade={open}
        busy={busy}
        onClose={() => setOpen(null)}
        onApprove={() => undefined}
        onReject={() => undefined}
      />
    </div>
  );
}
