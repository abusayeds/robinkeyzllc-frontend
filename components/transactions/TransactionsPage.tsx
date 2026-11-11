"use client";

import { useMemo, useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import { useDraftPicksQuery } from "@/lib/store/api/endpoints/draftApi";
import { useLeagueTransactionsQuery } from "@/lib/store/api/endpoints/transactionsApi";
import { useAppSelector } from "@/lib/store/hooks";
import TransactionRow from "./TransactionRow";
import DraftPicksTable from "./DraftPicksTable";
import { pickRowsForTeam } from "./pickRows";

const TABS = ["All", "Trades", "Signings", "Waivers", "Draft Picks"] as const;
type Tab = (typeof TABS)[number];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function TransactionsPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data, isLoading } = useLeagueTransactionsQuery(
    { leagueId: leagueId as number },
    { skip: !leagueId },
  );

  const [tab, setTab] = useState<Tab>("All");
  const [mineOnly, setMineOnly] = useState(false);

  // Only fetched when the tab that needs it is open: the whole league's pick
  // inventory is a bigger answer than the other four tabs want.
  const { data: inventory } = useDraftPicksQuery(leagueId as number, {
    skip: !leagueId || tab !== "Draft Picks",
  });

  const myTeamId = data?.myTeamId ?? null;
  const recent = useMemo(() => data?.transactions ?? [], [data]);

  const items = useMemo(() => {
    let list = recent;
    if (tab === "Trades") list = list.filter((t) => t.category === "Trades");
    else if (tab === "Signings")
      list = list.filter((t) => t.category === "Signings");
    else if (tab === "Waivers")
      list = list.filter((t) => t.category === "Waivers");
    else if (tab === "Draft Picks")
      list = list.filter((t) => t.category === "Draft");
    if (mineOnly) list = list.filter((t) => t.mine);
    return list;
  }, [recent, tab, mineOnly]);

  const myPicks = useMemo(
    () => pickRowsForTeam(inventory, myTeamId),
    [inventory, myTeamId],
  );

  // The feed is derived from the rows themselves, so the freshest row is as
  // current as the data gets. Was a hardcoded string.
  const lastSynced = recent[0] ? formatDate(recent[0].date) : "—";

  if (!leagueId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          No league selected
        </p>
        <p className="mt-1 text-xs text-brand-muted">
          Open a league from Avora Home to see its transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Transactions</h1>
        <p className="text-sm text-brand-muted">
          Recent trades, signings, waivers, draft selections and pick movement
          across the league.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border">
        <div className="flex flex-wrap">
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
              {item}
              {tab === item ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
              ) : null}
            </button>
          ))}
        </div>

        {/* Hidden when the viewer holds no team: there is no "mine" to filter. */}
        {myTeamId === null ? null : mineOnly ? (
          <button
            type="button"
            onClick={() => setMineOnly(false)}
            className="mb-2 flex items-center gap-2 rounded-full bg-brand-cta/10 px-3 py-1.5 text-xs font-semibold text-brand-cta-dark"
          >
            Showing: My Trade History
            <FiX className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setMineOnly(true)}
            className="mb-2 flex items-center gap-1.5 rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft"
          >
            My Trade History
            <FiArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* One tab, both halves of the same question: the picks this team has
          spent, and the ones it still holds. */}
      {tab === "Draft Picks" ? (
        <div className="space-y-5">
          {items.length > 0 ? (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-brand-dark">
                Selections made
              </h2>
              <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
                <div className="divide-y divide-brand-border">
                  {items.map((item) => (
                    <TransactionRow key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <DraftPicksTable picks={myPicks} lastSynced={lastSynced} />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          {isLoading ? (
            <p className="px-5 py-10 text-center text-sm text-brand-muted">
              Loading…
            </p>
          ) : items.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-brand-muted">
              No transactions in this view.
            </p>
          ) : (
            <div className="divide-y divide-brand-border">
              {items.map((item) => (
                <TransactionRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
