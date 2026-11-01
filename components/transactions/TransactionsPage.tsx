"use client";

import { useMemo, useState } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import { useAppSelector } from "@/lib/store/hooks";
import TransactionRow from "./TransactionRow";
import DraftPicksTable from "./DraftPicksTable";

const TABS = ["All", "Trades", "Signings", "Waivers", "Draft Picks"] as const;
type Tab = (typeof TABS)[number];

export default function TransactionsPage() {
  const recent = useAppSelector((state) => state.transactions.recent);
  const draftPicks = useAppSelector((state) => state.transactions.draftPicks);
  const lastSynced = useAppSelector((state) => state.transactions.lastSynced);

  const [tab, setTab] = useState<Tab>("All");
  const [mineOnly, setMineOnly] = useState(false);

  const items = useMemo(() => {
    let list = recent;
    if (tab === "Trades")
      list = list.filter(
        (t) => t.type === "Trade Accepted" || t.type === "Draft Pick Traded"
      );
    else if (tab === "Signings") list = list.filter((t) => t.category === "Signings");
    else if (tab === "Waivers") list = list.filter((t) => t.category === "Waivers");
    if (mineOnly) list = list.filter((t) => t.mine);
    return list;
  }, [recent, tab, mineOnly]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Transactions</h1>
        <p className="text-sm text-brand-muted">
          Recent trades, signings, waivers, and draft pick movement across the
          league.
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

        {mineOnly ? (
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

      {tab === "Draft Picks" ? (
        <DraftPicksTable picks={draftPicks} lastSynced={lastSynced} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          {items.length === 0 ? (
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
