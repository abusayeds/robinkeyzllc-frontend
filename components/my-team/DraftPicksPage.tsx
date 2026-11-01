"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { setContractsViewTeamId } from "@/lib/store/features/uiSlice";
import type {
  DraftPickAsset,
  TradeException,
} from "@/lib/store/features/transactionsSlice";
import DraftPicksTable from "@/components/transactions/DraftPicksTable";
import { CONTRACTS_SUBNAV } from "./subnav";

function dollars(millions: number) {
  return `$${Math.round(millions * 1_000_000).toLocaleString()}`;
}

function seed(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function picksForTeam(base: DraftPickAsset[], teamId: string): DraftPickAsset[] {
  const offset = seed(teamId) % base.length;
  if (offset === 0) return base;
  return [...base.slice(offset), ...base.slice(0, offset)].map((p, i) => ({
    ...p,
    id: `${p.id}-${teamId}-${i}`,
  }));
}

function exceptionsForTeam(
  base: TradeException[],
  teamId: string
): TradeException[] {
  const s = seed(teamId);
  if (s % 4 === 0) return [];
  const factor = 0.6 + ((s % 50) / 100);
  const count = 1 + (s % base.length);
  return base.slice(0, count).map((tpe) => ({
    ...tpe,
    id: `${tpe.id}-${teamId}`,
    amount: Number((tpe.amount * factor).toFixed(2)),
  }));
}

export default function DraftPicksPage() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const myTeamId = useAppSelector((state) => state.draft.myTeamId);
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const viewTeamId =
    useAppSelector((state) => state.ui.contractsViewTeamId) ?? myTeamId;
  const team = useMemo(
    () => leagueTeams.find((t) => t.id === viewTeamId) ?? leagueTeams[0],
    [leagueTeams, viewTeamId]
  );

  const baseDraftPicks = useAppSelector((state) => state.transactions.draftPicks);
  const lastSynced = useAppSelector((state) => state.transactions.lastSynced);
  const baseExceptions = useAppSelector(
    (state) => state.transactions.tradeExceptions
  );

  const draftPicks = useMemo(
    () =>
      viewTeamId === myTeamId
        ? baseDraftPicks
        : picksForTeam(baseDraftPicks, viewTeamId),
    [baseDraftPicks, viewTeamId, myTeamId]
  );
  const exceptions = useMemo(
    () =>
      viewTeamId === myTeamId
        ? baseExceptions
        : exceptionsForTeam(baseExceptions, viewTeamId),
    [baseExceptions, viewTeamId, myTeamId]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">
            Draft Picks &amp; Ownership
          </h1>
          <p className="text-sm text-brand-muted">
            All Picks · {team.franchise ?? team.name}
          </p>
        </div>
        {/* Still on the mock league store, so this cannot use the real
            TeamSelector. It goes when Draft Picks gets a DraftPick model. */}
        <select
          value={viewTeamId}
          onChange={(e) => dispatch(setContractsViewTeamId(e.target.value))}
          className="rounded-lg border border-brand-border bg-white px-3 py-2 text-sm text-brand-dark outline-none focus:border-brand-cta"
        >
          {leagueTeams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap border-b border-brand-border">
        {CONTRACTS_SUBNAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative px-3 py-2.5 text-sm transition ${
                active
                  ? "font-semibold text-brand-cta-dark"
                  : "font-medium text-brand-muted hover:text-brand-dark"
              }`}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
              ) : null}
            </Link>
          );
        })}
      </div>

      <DraftPicksTable picks={draftPicks} lastSynced={lastSynced} />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-brand-dark">
          Traded Player Exceptions
        </h2>
        <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-brand-border bg-brand-soft text-[11px] uppercase tracking-[0.08em] text-brand-muted">
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Date Created
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Expiration Date
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {exceptions.map((tpe) => (
                  <tr key={tpe.id} className="hover:bg-brand-soft/60">
                    <td className="px-4 py-3 font-medium text-brand-dark">
                      {tpe.description}
                    </td>
                    <td className="px-4 py-3 text-brand-muted">{tpe.created}</td>
                    <td className="px-4 py-3 text-brand-muted">{tpe.expires}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-cta-dark">
                      {dollars(tpe.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold ${
                          tpe.status === "Active"
                            ? "text-brand-cta-dark"
                            : "text-brand-muted"
                        }`}
                      >
                        {tpe.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-brand-border px-4 py-2.5 text-xs text-brand-muted">
            TPEs expire 1 year from the date created. Use in a trade to absorb
            salary.
          </p>
        </div>
      </div>
    </div>
  );
}
