"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import {
  useApproveTradeMutation,
  useLeagueTradesQuery,
  useRejectTradeMutation,
  type Trade,
} from "@/lib/store/api/endpoints/tradeApi";
import { useLeagueOverviewQuery } from "@/lib/store/api/endpoints/overviewApi";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useAppSelector } from "@/lib/store/hooks";
import TradeDetail from "./TradeDetail";

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

function TradeCard({
  trade,
  busy,
  onApprove,
  onReject,
  onOpen,
}: {
  trade: Trade;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onOpen: () => void;
}) {
  const failed = trade.checks.filter((check) => !check.pass);

  return (
    <div className="rounded-xl border border-brand-border bg-white shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-brand-dark">
            {trade.teams.map((side) => side.team.abbr).join(" · ")}
          </p>
          <p className="text-[11px] text-brand-muted">
            {trade.assets.length} asset
            {trade.assets.length === 1 ? "" : "s"}
            {trade.proposedBy ? ` · proposed by ${trade.proposedBy.name}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-cta-dark hover:underline"
        >
          Details
          <FiArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid gap-px border-y border-brand-border bg-brand-border sm:grid-cols-2">
        {trade.teams.map((side) => (
          <div key={side.teamId} className="bg-white px-4 py-2.5">
            <p className="text-xs font-semibold text-brand-dark">
              {side.team.name}
            </p>
            <p className="text-[11px] text-brand-muted">
              Out {money(side.outgoing)} · In {money(side.incoming)}
            </p>
            <p
              className={`text-[11px] font-semibold ${
                side.net > 0
                  ? "text-red-500"
                  : side.net < 0
                    ? "text-brand-cta-dark"
                    : "text-brand-muted"
              }`}
            >
              {side.net > 0 ? "+" : ""}
              {money(side.net)} on the books
            </p>
          </div>
        ))}
      </div>

      {failed.length > 0 ? (
        <div className="flex items-start gap-2 bg-red-50 px-4 py-2.5 text-xs text-red-600">
          <FiAlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {failed.length} rule{failed.length === 1 ? "" : "s"} not met —{" "}
            {failed.map((check) => check.label).join(", ")}.
          </span>
        </div>
      ) : null}

      <div className="flex justify-end gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={onReject}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-muted transition hover:bg-brand-soft disabled:opacity-50"
        >
          <FiX className="h-3.5 w-3.5" />
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-cta px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-50"
        >
          <FiCheck className="h-3.5 w-3.5" />
          {trade.isLegal ? "Approve" : "Approve anyway"}
        </button>
      </div>
    </div>
  );
}

export default function ActionCenterPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);

  const { data: trades = [], isLoading } = useLeagueTradesQuery(
    { leagueId: leagueId as number, status: "awaitingApproval" },
    { skip: !leagueId },
  );
  const { data: overview } = useLeagueOverviewQuery(leagueId as number, {
    skip: !leagueId,
  });

  const [approve, { isLoading: approving }] = useApproveTradeMutation();
  const [reject, { isLoading: rejecting }] = useRejectTradeMutation();

  const [open, setOpen] = useState<Trade | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = approving || rejecting;

  /**
   * Everything else waiting on the commissioner.
   *
   * The client was explicit that **offer sheet expiring does not belong
   * here**, so free agency appears only as offers to answer.
   */
  const other = useMemo(() => {
    if (!overview) return [];
    const list: { label: string; sub: string; href: string; tone: string }[] = [];

    if (overview.attention.pendingOffers > 0) {
      list.push({
        label: `${overview.attention.pendingOffers} free agency offer${overview.attention.pendingOffers === 1 ? "" : "s"} to answer`,
        sub: "Accept or decline them.",
        href: "/league-office/free-agency",
        tone: "bg-brand-cta",
      });
    }
    if (overview.attention.pendingInvites > 0) {
      list.push({
        label: `${overview.attention.pendingInvites} invite${overview.attention.pendingInvites === 1 ? "" : "s"} unanswered`,
        sub: "Nobody has accepted these yet.",
        href: "/league-office/users",
        tone: "bg-amber-400",
      });
    }
    for (const team of overview.attention.overRoster) {
      list.push({
        label: `${team.name} is over the roster limit`,
        sub: `${team.rosterCount} players${team.maxRosterSize ? ` against ${team.maxRosterSize}` : ""}.`,
        href: "/league-office/rosters",
        tone: "bg-red-500",
      });
    }
    // The salary floor is deliberately absent: Rule 3.5 carries no penalty
    // for being under it in Version 1, so it is not an action.
    return list;
  }, [overview]);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setError(null);
    try {
      await action();
      setOpen(null);
    } catch (e) {
      setError(errorText(e, fallback));
    }
  };

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to open its action center.
      </p>
    );
  }

  if (!canEdit) {
    return (
      <p className="text-sm text-brand-muted">
        Only the commissioner and co-commissioners can use the action center.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">
          Commissioner Action Center
        </h1>
        <p className="text-sm text-brand-muted">
          Trades waiting on you, and anything else the league needs decided.
        </p>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand-dark">
          Trades awaiting approval
          {trades.length > 0 ? (
            <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
              {trades.length}
            </span>
          ) : null}
        </h2>

        {isLoading ? (
          <p className="text-sm text-brand-muted">Loading…</p>
        ) : trades.length === 0 ? (
          <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
            <p className="text-sm font-semibold text-brand-dark">
              No trades waiting.
            </p>
            <p className="mt-1 text-sm text-brand-muted">
              Trades arrive here once every team has accepted, and only while
              Commissioner Trade Approval is on.
            </p>
          </div>
        ) : (
          trades.map((trade) => (
            <TradeCard
              key={trade.id}
              trade={trade}
              busy={busy}
              onOpen={() => setOpen(trade)}
              onApprove={() =>
                void run(
                  () => approve({ leagueId, tradeId: trade.id }).unwrap(),
                  "That trade could not be approved.",
                )
              }
              onReject={() =>
                void run(
                  () => reject({ leagueId, tradeId: trade.id }).unwrap(),
                  "That trade could not be rejected.",
                )
              }
            />
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-brand-dark">
          Everything else
        </h2>
        <div className="rounded-xl border border-brand-border bg-white shadow-card">
          {other.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-brand-muted">
              Nothing else needs you right now.
            </p>
          ) : (
            <ul className="divide-y divide-brand-border">
              {other.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-start gap-2.5 px-4 py-2.5 transition hover:bg-brand-soft/60"
                  >
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${item.tone}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark">
                        {item.label}
                      </p>
                      <p className="text-xs text-brand-muted">{item.sub}</p>
                    </div>
                    <FiChevronRight className="mt-1 h-4 w-4 shrink-0 text-brand-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <TradeDetail
        trade={open}
        busy={busy}
        onClose={() => setOpen(null)}
        onApprove={() =>
          open
            ? void run(
                () => approve({ leagueId, tradeId: open.id }).unwrap(),
                "That trade could not be approved.",
              )
            : undefined
        }
        onReject={(reason) =>
          open
            ? void run(
                () =>
                  reject({ leagueId, tradeId: open.id, reason }).unwrap(),
                "That trade could not be rejected.",
              )
            : undefined
        }
      />
    </div>
  );
}
