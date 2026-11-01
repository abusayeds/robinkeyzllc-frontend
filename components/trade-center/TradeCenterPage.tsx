"use client";

import { useMemo, useState } from "react";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import { useLeagueTradesQuery } from "@/lib/store/api/endpoints/tradeApi";
import { useAppSelector } from "@/lib/store/hooks";
import PendingTradesTab from "./PendingTradesTab";
import TradeBuilder from "./TradeBuilder";

const TABS = ["Build a trade", "My trades"] as const;
type Tab = (typeof TABS)[number];

export default function TradeCenterPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const userId = useAppSelector((s) => s.auth.user?.id ?? null);

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () => memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data: teamList } = useLeagueTeamsQuery(leagueId as number, {
    skip: !leagueId,
  });
  const teams = useMemo(() => teamList?.teams ?? [], [teamList]);

  const { data: trades = [] } = useLeagueTradesQuery(
    { leagueId: leagueId as number, teamId: myTeamId ?? undefined },
    { skip: !leagueId || !myTeamId },
  );

  // Only the ones this team has not answered. A trade waiting on somebody
  // else is not a job for this user, and a badge that counts it would send
  // them looking for something to do.
  const waiting = trades.filter(
    (trade) =>
      trade.status === "proposed" &&
      trade.teams.find((side) => side.teamId === myTeamId)?.response ===
        "pending",
  ).length;

  const [tab, setTab] = useState<Tab>("Build a trade");

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to open the trade center.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-brand-dark">Trade Center</h1>
        <p className="text-sm text-brand-muted">
          Put a deal together, and answer the ones sent to you.
        </p>
      </div>

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
              {item === "My trades" && waiting > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-cta px-1 text-[10px] font-bold text-white">
                  {waiting}
                </span>
              ) : null}
            </span>
            {tab === item ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === "Build a trade" ? (
        teams.length < 2 ? (
          <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
            <p className="text-sm font-semibold text-brand-dark">
              This league needs at least two teams before anything can be
              traded.
            </p>
          </div>
        ) : (
          <TradeBuilder
            leagueId={leagueId}
            teams={teams}
            myTeamId={myTeamId}
            onProposed={() => setTab("My trades")}
          />
        )
      ) : (
        <PendingTradesTab
          leagueId={leagueId}
          myTeamId={myTeamId}
          userId={userId}
        />
      )}
    </div>
  );
}
