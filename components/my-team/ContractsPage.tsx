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
import CapSummaryCards from "./CapSummaryCards";
import ContractsTable from "./ContractsTable";
import ExtensionModal from "./ExtensionModal";
import PlayerDetailModal from "./PlayerDetailModal";
import { CONTRACTS_SUBNAV } from "./subnav";
import TeamSelector from "./TeamSelector";
import { useViewedTeam } from "./viewedTeam";

/** How many seasons the contract grid shows, matching the import template. */
const SEASON_COLUMNS = 6;

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
  const [extending, setExtending] = useState<RosterPlayer | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Offering one is only ever something you do to your own players. Viewing
  // another team's contracts is allowed and is read-only, so the column is
  // not drawn at all rather than drawn and refused.
  const isMyTeam = activeTeamId !== null && activeTeamId === myTeamId;

  const seasons = useMemo(() => {
    if (!data) return [];
    return Array.from(
      { length: SEASON_COLUMNS },
      (_, index) => data.seasonStartYear + index,
    );
  }, [data]);

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
          <CapSummaryCards
            cap={data.cap}
            counts={data.counts}
            rules={data.rules}
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
            <ContractsTable
              players={data.players}
              seasons={seasons}
              deadMoneyRows={data.deadMoneyRows}
              capHoldRows={data.capHoldRows}
              onView={(player) => setDetail(player.playerId)}
              onExtend={isMyTeam ? setExtending : undefined}
            />
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
