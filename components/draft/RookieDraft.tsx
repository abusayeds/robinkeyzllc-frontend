"use client";

import { useMemo, useState } from "react";
import { FiSearch, FiStar } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  draftProspect,
  queueProspect,
  unqueueProspect,
  type DraftProspect,
} from "@/lib/store/features/draftSlice";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import { draftProspectToRosterPlayer } from "./adapter";
import DraftClockCard from "./DraftClockCard";
import DraftQueue from "./DraftQueue";
import DraftBoardGrid from "./DraftBoardGrid";
import { useCountdown } from "./utils";

const FILTERS = ["All", "G", "F", "FLEX", "PF", "C"] as const;

function matchesFilter(pos: string, filter: string) {
  if (filter === "All") return true;
  if (filter === "G") return pos === "PG" || pos === "SG";
  if (filter === "F") return pos === "SF" || pos === "PF";
  if (filter === "FLEX") return pos !== "C";
  return pos === filter;
}

export default function RookieDraft() {
  const dispatch = useAppDispatch();
  const rookie = useAppSelector((state) => state.draft.rookie);
  const order = useAppSelector((state) => state.draft.order);
  const currentPick = useAppSelector((state) => state.draft.currentPick);
  const myTeamId = useAppSelector((state) => state.draft.myTeamId);
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const queue = useAppSelector((state) => state.draft.queue);
  const queueSet = useMemo(() => new Set(queue), [queue]);

  const teamById = useMemo(
    () => new Map(leagueTeams.map((t) => [t.id, t])),
    [leagueTeams]
  );
  const draftedIds = useMemo(
    () => new Set(order.map((s) => s.prospectId).filter(Boolean)),
    [order]
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [detail, setDetail] = useState<DraftProspect | null>(null);

  const slot = order[currentPick];
  const onClockTeam = teamById.get(slot?.teamId ?? "");
  const clock = useCountdown(372, currentPick);

  const available = rookie.filter(
    (p) =>
      !draftedIds.has(p.id) &&
      matchesFilter(p.position, filter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const strip = order.filter((s) => s.round === slot?.round);
  const myPicks = order.filter((s) => s.teamId === myTeamId);

  const canDraft = slot?.teamId === myTeamId;

  return (
    <div className="space-y-5">
      <DraftClockCard
        slot={slot}
        onClockTeam={onClockTeam}
        clock={clock}
        strip={strip}
        teamById={teamById}
        prospectName={(s) => rookie.find((p) => p.id === s.prospectId)?.name}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-dark">
              Available Players
            </h3>
            <span className="text-xs text-brand-muted">
              {available.length} available
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name..."
                className="w-full rounded-lg border border-brand-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-cta focus:ring-2 focus:ring-brand-cta/20"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filter === f
                    ? "bg-brand-cta text-white"
                    : "border border-brand-border text-brand-dark hover:bg-brand-soft"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-brand-border bg-white shadow-card">
            <ul className="divide-y divide-brand-border">
              {available.map((p) => (
                <ProspectRow
                  key={p.id}
                  prospect={p}
                  canDraft={canDraft}
                  queued={queueSet.has(p.id)}
                  onDraft={() => dispatch(draftProspect(p.id))}
                  onQueue={() =>
                    dispatch(
                      queueSet.has(p.id)
                        ? unqueueProspect(p.id)
                        : queueProspect(p.id)
                    )
                  }
                  onSelect={() => setDetail(p)}
                />
              ))}
              {available.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-brand-muted">
                  No prospects match.
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <DraftQueue pool="rookie" />

          <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-brand-dark">
              My Picks
            </h3>
            <ul className="space-y-1.5 text-xs">
              {myPicks.map((s) => {
                const prospect = rookie.find((p) => p.id === s.prospectId);
                return (
                  <li
                    key={s.overall}
                    className="flex items-center justify-between rounded-lg border border-brand-border px-2.5 py-1.5"
                  >
                    <span className="font-semibold text-brand-muted">
                      R{s.round}-P{s.pick}
                    </span>
                    {prospect ? (
                      <button
                        type="button"
                        onClick={() => setDetail(prospect)}
                        className="font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                      >
                        {prospect.name}
                      </button>
                    ) : (
                      <span className="font-medium text-brand-dark">
                        On the clock
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      <DraftBoardGrid />

      <PlayerDetailModal
        player={detail ? draftProspectToRosterPlayer(detail) : null}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function ProspectRow({
  prospect,
  canDraft,
  queued,
  onDraft,
  onQueue,
  onSelect,
}: {
  prospect: DraftProspect;
  canDraft: boolean;
  queued: boolean;
  onDraft: () => void;
  onQueue: () => void;
  onSelect: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-forest text-xs font-bold text-brand-accent">
          {prospect.name.charAt(0)}
        </span>
        <div>
          <button
            type="button"
            onClick={onSelect}
            className="text-sm font-semibold text-brand-dark hover:text-brand-cta-dark hover:underline"
          >
            {prospect.name}
          </button>
          <p className="text-xs text-brand-muted">
            {prospect.position} · {prospect.exp} · {prospect.pts.toFixed(1)} PTS
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onQueue}
          aria-label={queued ? `Remove ${prospect.name} from queue` : `Queue ${prospect.name}`}
          className={`rounded-lg border p-1.5 transition ${
            queued
              ? "border-brand-cta bg-brand-cta/10 text-brand-cta-dark"
              : "border-brand-border text-brand-muted hover:bg-brand-soft hover:text-brand-dark"
          }`}
        >
          <FiStar className={`h-4 w-4 ${queued ? "fill-brand-cta-dark" : ""}`} />
        </button>
        <button
          type="button"
          onClick={onDraft}
          disabled={!canDraft}
          className="rounded-lg bg-brand-cta px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-cta-dark disabled:opacity-40"
        >
          Draft
        </button>
      </div>
    </li>
  );
}
