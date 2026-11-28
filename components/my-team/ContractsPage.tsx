"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useLeagueTeamsQuery } from "@/lib/store/api/endpoints/teamApi";
import {
  useTeamRosterQuery,
  type RosterPlayer,
} from "@/lib/store/api/endpoints/rosterApi";
import { useMyLeaguesQuery } from "@/lib/store/api/endpoints/leagueApi";
import { useAppSelector } from "@/lib/store/hooks";
import { usePayrollOutlookQuery } from "@/lib/store/api/endpoints/salaryApi";
import { useLeagueSettingsQuery } from "@/lib/store/api/endpoints/leagueSettingsApi";
import { useTradeExceptionsQuery } from "@/lib/store/api/endpoints/tradeApi";
import ContractsTable from "./ContractsTable";
import SeasonCapOverview from "./SeasonCapOverview";
import {
  RosterAndDeadMoneyStrip,
  SeasonExceptionsCard,
  TradeExceptionsCard,
} from "./ContractsExtras";
import {
  ContractBreakdownCard,
  FutureOutlookCard,
  RosterSummaryCard,
} from "./ContractsSidebar";
import ExtensionModal from "./ExtensionModal";
import PlayerDetailModal from "./PlayerDetailModal";
import { CONTRACTS_SUBNAV } from "./subnav";
import TeamSelector from "./TeamSelector";
import { useViewedTeam } from "./viewedTeam";

/**
 * How many seasons the grid falls back to before the outlook has loaded.
 *
 * The real span is the league's own pick-trading window, which the outlook
 * is built from: the client's rule is that every table showing future league
 * years shows the same number of them.
 */
const FALLBACK_SEASON_COLUMNS = 7;

export default function ContractsPage() {
  const pathname = usePathname();
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () =>
      memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data: teamList } = useLeagueTeamsQuery(leagueId as number, {
    skip: !leagueId,
  });
  const teams = useMemo(() => teamList?.teams ?? [], [teamList]);

  const [activeTeamId, setViewTeamId] = useViewedTeam(myTeamId, teams);

  const { data, isLoading } = useTeamRosterQuery(
    { leagueId: leagueId as number, teamId: activeTeamId as number },
    { skip: !leagueId || !activeTeamId },
  );

  const [detail, setDetail] = useState<number | null>(null);
  // Which year card is open. The panel and the grid read the same one, which
  // is what makes a card worth clicking.
  const [openSeason, setOpenSeason] = useState<number | null>(null);
  const [extending, setExtending] = useState<RosterPlayer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Offering one is only ever something you do to your own players. Viewing
  // another team's contracts is allowed and is read-only, so the column is
  // not drawn at all rather than drawn and refused.
  const isMyTeam = activeTeamId !== null && activeTeamId === myTeamId;

  // The projection the Payroll Simulator draws, read here rather than
  // recomputed so both pages cannot disagree about the same five seasons.
  const { data: outlook } = usePayrollOutlookQuery(
    { leagueId: leagueId as number, teamId: activeTeamId as number },
    { skip: !leagueId || !activeTeamId },
  );

  const { data: settings } = useLeagueSettingsQuery(leagueId as number, {
    skip: !leagueId,
  });

  // Article 7 — what this team holds. Read here rather than inside the card
  // so the page can skip it entirely for a league with exceptions turned off.
  const { data: tradeExceptions = [] } = useTradeExceptionsQuery(
    { leagueId: leagueId as number, teamId: activeTeamId as number },
    { skip: !leagueId || !activeTeamId },
  );

  const seasons = useMemo(() => {
    if (outlook && outlook.seasons.length > 0) {
      return outlook.seasons.map((season) => season.seasonStartYear);
    }
    if (!data) return [];
    return Array.from(
      { length: FALLBACK_SEASON_COLUMNS },
      (_, index) => data.seasonStartYear + index,
    );
  }, [outlook, data]);

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to see its contracts.
      </p>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          This league has no teams yet.
        </p>
        <p className="mt-1 text-sm text-brand-muted">
          The commissioner creates them from the league office.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-brand-dark">Contracts</h1>
          <p className="text-sm text-brand-muted">
            Every contract on this team, season by season.
          </p>
        </div>
        <TeamSelector
          teams={teams}
          value={activeTeamId}
          onChange={setViewTeamId}
          myTeamId={myTeamId}
        />
      </div>

      <nav className="flex flex-wrap items-center gap-1 border-b border-brand-border">
        {CONTRACTS_SUBNAV.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`relative px-3 py-2.5 text-sm transition ${
              pathname === item.href
                ? "font-semibold text-brand-cta-dark"
                : "font-medium text-brand-muted hover:text-brand-dark"
            }`}
          >
            {item.label}
            {pathname === item.href ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
            ) : null}
          </a>
        ))}
      </nav>

      {notice ? (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-brand-soft px-4 py-2.5 text-sm text-brand-dark">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-xs font-semibold text-brand-muted hover:text-brand-dark"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {isLoading || !data ? (
        <p className="text-sm text-brand-muted">Loading…</p>
      ) : (
        <>
          {outlook && outlook.seasons.length > 0 ? (
            <>
              <SeasonCapOverview
                seasons={outlook.seasons}
                selected={openSeason ?? outlook.seasons[0].seasonStartYear}
                onSelect={setOpenSeason}
                capGrowthPct={settings?.capGrowthPct ?? null}
              />

              <SeasonExceptionsCard
                season={
                  outlook.seasons.find(
                    (season) => season.seasonStartYear === openSeason,
                  ) ?? outlook.seasons[0]
                }
              />
            </>
          ) : null}

          <RosterAndDeadMoneyStrip
            standard={data.counts.standard}
            twoWay={data.counts.twoWay}
            maxRosterSize={data.rules?.maxRosterSize ?? 0}
            maxTwoWay={data.rules?.maxTwoWay ?? 0}
            deadMoneyRows={data.deadMoneyRows}
            seasonStartYear={data.seasonStartYear}
          />

          <TradeExceptionsCard
            exceptions={tradeExceptions}
            canTrade={isMyTeam}
          />

          {data.players.length === 0 ? (
            <div className="rounded-xl border border-brand-border bg-white p-10 text-center shadow-card">
              <p className="text-sm font-semibold text-brand-dark">
                No contracts on this team.
              </p>
              <p className="mt-1 text-sm text-brand-muted">
                Contracts arrive with Player Import, and change through trades
                and free agency.
              </p>
            </div>
          ) : (
            // The table leads and the three summary cards sit beside it on a
            // wide screen, stacking under it on a narrow one.
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
              <div className="min-w-0 xl:col-start-1 xl:row-span-3 xl:row-start-1">
                <ContractsTable
                  players={data.players}
                  seasons={seasons}
                  deadMoneyRows={data.deadMoneyRows}
                  capHoldRows={data.capHoldRows}
                  onView={(player) => setDetail(player.playerId)}
                  onExtend={isMyTeam ? setExtending : undefined}
                />
              </div>
              <div className="xl:col-start-2 xl:row-start-1">
                <ContractBreakdownCard
                  players={data.players}
                  deadCap={data.cap.deadMoney}
                  seasonStartYear={seasons[0] ?? 0}
                />
              </div>
              <div className="xl:col-start-2 xl:row-start-2">
                <RosterSummaryCard
                  counts={data.counts}
                  rosterMax={data.rules?.maxRosterSize ?? 0}
                  maxTwoWay={data.rules?.maxTwoWay ?? 0}
                />
              </div>
              <div className="xl:col-start-2 xl:row-start-3">
                <FutureOutlookCard outlook={outlook ?? null} />
              </div>
            </div>
          )}

          <PlayerDetailModal
            playerId={detail}
            leagueId={leagueId}
            onClose={() => setDetail(null)}
          />

          {myTeamId !== null ? (
            <ExtensionModal
              leagueId={leagueId}
              teamId={myTeamId}
              leaguePlayerId={extending?.id ?? null}
              playerName={extending?.name ?? ""}
              onClose={() => setExtending(null)}
              onDone={setNotice}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
