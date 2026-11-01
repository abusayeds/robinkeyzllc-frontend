"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle } from "react-icons/fi";
import {
  useMyLeaguesQuery,
} from "@/lib/store/api/endpoints/leagueApi";
import {
  useSetRosterSlotMutation,
  useTeamRosterQuery,
  type RosterPlayer,
} from "@/lib/store/api/endpoints/rosterApi";
import { useAppSelector } from "@/lib/store/hooks";
import RosterPlayerModal from "./RosterPlayerModal";
import RosterComposition from "./RosterComposition";
import RosterTable from "./RosterTable";

const TABS = ["Roster", "Injured Reserve", "Rights Held"] as const;
type Tab = (typeof TABS)[number];

const money = (value: number) => `$${value.toLocaleString("en-US")}`;

const short = (value: number) => {
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${value}`;
};

const errorText = (error: unknown, fallback: string) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return message ?? fallback;
};

function Tile({
  label,
  value,
  sub,
  tone = "text-brand-dark",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>
        {value}
        {sub ? (
          <span className="ml-1 text-sm font-medium text-brand-muted">
            {sub}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export default function MyTeamPage() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;

  const { data: memberships = [] } = useMyLeaguesQuery(undefined, {
    skip: !leagueId,
  });
  const myTeamId = useMemo(
    () => memberships.find((league) => league.id === leagueId)?.team?.id ?? null,
    [memberships, leagueId],
  );

  const { data, isLoading } = useTeamRosterQuery(
    { leagueId: leagueId as number, teamId: myTeamId as number },
    { skip: !leagueId || !myTeamId },
  );

  const [setSlot, { isLoading: moving }] = useSetRosterSlotMutation();

  const [tab, setTab] = useState<Tab>("Roster");
  const [detail, setDetail] = useState<RosterPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const all = data?.players ?? [];
    return {
      Roster: all.filter(
        (p) => p.status === "rostered" && p.slotType !== "injuredReserve",
      ),
      "Injured Reserve": all.filter(
        (p) => p.status === "rostered" && p.slotType === "injuredReserve",
      ),
      "Rights Held": all.filter((p) => p.status === "rightsHeld"),
    } satisfies Record<Tab, RosterPlayer[]>;
  }, [data]);

  const move = async (player: RosterPlayer, toIr: boolean) => {
    if (!leagueId || !myTeamId) return;
    setError(null);
    try {
      await setSlot({
        leagueId,
        teamId: myTeamId,
        leaguePlayerId: player.id,
        slotType: toIr ? "injuredReserve" : "standard",
      }).unwrap();
    } catch (e) {
      setError(errorText(e, "That player could not be moved."));
    }
  };

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Choose a league to see your team.
      </p>
    );
  }

  if (!myTeamId) {
    return (
      <div className="rounded-xl border border-brand-border bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-brand-dark">
          You do not hold a team in this league yet.
        </p>
        <p className="mt-1 text-sm text-brand-muted">
          The commissioner assigns teams from the league office. Your franchise
          will appear here once they do.
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return <p className="text-sm text-brand-muted">Loading…</p>;
  }

  const { cap, counts, rules, team } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="h-10 w-1.5 rounded-full"
            style={{ backgroundColor: team.color }}
          />
          <div>
            <h1 className="text-xl font-bold text-brand-dark">{team.name}</h1>
            <p className="text-sm text-brand-muted">
              {team.abbr}
              {team.owner ? ` · ${team.owner.name}` : ""}
              {team.coOwner ? ` · ${team.coOwner.name} (co-owner)` : ""}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Roster"
          value={String(counts.standard)}
          sub={rules ? `/ ${rules.maxRosterSize}` : undefined}
          tone={
            rules && counts.standard > rules.maxRosterSize
              ? "text-red-500"
              : "text-brand-dark"
          }
        />
        <Tile label="Payroll" value={short(cap.payroll)} />
        <Tile
          label="Cap space"
          value={cap.capSpace === null ? "—" : short(cap.capSpace)}
          tone={
            cap.capSpace !== null && cap.capSpace < 0
              ? "text-red-500"
              : "text-brand-dark"
          }
        />
        <Tile
          label="Dead money"
          value={short(cap.deadMoney)}
          tone={cap.deadMoney > 0 ? "text-amber-600" : "text-brand-dark"}
        />
      </div>

      <RosterComposition players={data.players} rules={rules} />

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
              {groups[item].length > 0 ? (
                <span className="text-xs text-brand-muted">
                  {groups[item].length}
                </span>
              ) : null}
            </span>
            {tab === item ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-cta" />
            ) : null}
          </button>
        ))}
      </div>

      <RosterTable
        players={groups[tab]}
        showIrAction={tab !== "Rights Held"}
        irLabel={tab === "Injured Reserve" ? "Activate" : "Move to IR"}
        busy={moving}
        onView={setDetail}
        onMove={(player) => void move(player, tab !== "Injured Reserve")}
      />

      {data.deadMoneyRows.length > 0 ? (
        <div className="rounded-xl border border-brand-border bg-white shadow-card">
          <div className="border-b border-brand-border px-4 py-3">
            <p className="text-sm font-semibold text-brand-dark">
              Dead money · {money(cap.deadMoney)}
            </p>
            <p className="text-[11px] text-brand-muted">
              Money still on your books for players you no longer hold.
            </p>
          </div>
          <ul className="divide-y divide-brand-border">
            {data.deadMoneyRows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-brand-dark">
                  {row.name}
                  {row.isStretched ? (
                    <span className="ml-1.5 text-xs text-brand-muted">
                      stretched
                    </span>
                  ) : null}
                </span>
                <span className="text-brand-muted">{money(row.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <RosterPlayerModal
        player={detail}
        seasonStartYear={data.seasonStartYear}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}
