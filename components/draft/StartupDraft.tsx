"use client";

import { useMemo, useState } from "react";
import { FiBookmark, FiSearch, FiStar, FiX } from "react-icons/fi";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import {
  draftProspect,
  queueProspect,
  unqueueProspect,
  type DraftProspect,
} from "@/lib/store/features/draftSlice";
import {
  FIRST_APRON_LINE,
  SALARY_CAP,
  SECOND_APRON_LINE,
  TAX_LINE,
} from "@/lib/store/features/leagueSlice";
import PlayerDetailModal from "@/components/my-team/PlayerDetailModal";
import { draftProspectToRosterPlayer } from "./adapter";
import DraftClockCard from "./DraftClockCard";
import DraftQueue from "./DraftQueue";
import DraftBoardGrid from "./DraftBoardGrid";
import { moneyFull, useCountdown } from "./utils";

const FILTERS = ["ALL", "PG", "SG", "SF", "PF", "C", "UTIL"] as const;

function matches(pos: string, f: string) {
  if (f === "ALL" || f === "UTIL") return true;
  return pos === f;
}

function Tile({
  label,
  value,
  tone = "text-brand-dark",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="min-w-[92px] rounded-lg border border-brand-border px-2.5 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p className={`text-xs font-bold ${tone}`}>{value}</p>
    </div>
  );
}

export default function StartupDraft() {
  const dispatch = useAppDispatch();
  const startup = useAppSelector((state) => state.draft.startup);
  const rookiePool = useAppSelector((state) => state.draft.rookie);
  const order = useAppSelector((state) => state.draft.order);
  const currentPick = useAppSelector((state) => state.draft.currentPick);
  const myTeamId = useAppSelector((state) => state.draft.myTeamId);
  const leagueTeams = useAppSelector((state) => state.league.leagueTeams);
  const queue = useAppSelector((state) => state.draft.queue);
  const queueSet = useMemo(() => new Set(queue), [queue]);

  const team = useMemo(
    () => leagueTeams.find((t) => t.id === myTeamId) ?? leagueTeams[0],
    [leagueTeams, myTeamId]
  );
  const teamById = useMemo(
    () => new Map(leagueTeams.map((t) => [t.id, t])),
    [leagueTeams]
  );
  const draftedIds = useMemo(
    () => new Set(order.map((s) => s.prospectId).filter(Boolean)),
    [order]
  );
  const strip = useMemo(
    () => order.filter((s) => s.round === order[currentPick]?.round),
    [order, currentPick]
  );
  const allProspects = useMemo(
    () => [...startup, ...rookiePool],
    [startup, rookiePool]
  );

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [boardPreview, setBoardPreview] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<DraftProspect | null>(null);

  const slot = order[currentPick];
  const onClockTeam = teamById.get(slot?.teamId ?? "");
  const clock = useCountdown(77, currentPick);
  const canDraft = slot?.teamId === myTeamId;

  const available = startup.filter(
    (p) =>
      !draftedIds.has(p.id) &&
      matches(p.position, filter) &&
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const draftedByMe = useMemo(
    () =>
      order
        .filter((s) => s.teamId === myTeamId && s.prospectId)
        .map((s) => allProspects.find((p) => p.id === s.prospectId))
        .filter((p): p is DraftProspect => Boolean(p)),
    [order, myTeamId, allProspects]
  );
  const draftedSalaryTotal = draftedByMe.reduce((s, p) => s + p.salary, 0);

  const previewProspects = startup.filter(
    (p) => boardPreview.has(p.id) && !draftedIds.has(p.id)
  );
  const previewSalaryTotal = previewProspects.reduce((s, p) => s + p.salary, 0);

  const toggleBoardPreview = (id: string) =>
    setBoardPreview((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hypotheticalPayroll = draftedSalaryTotal + previewSalaryTotal;
  const impact = [
    { label: "Total Salary", value: hypotheticalPayroll },
    { label: "Cap Space", value: SALARY_CAP - hypotheticalPayroll },
    { label: "Luxury Tax", value: TAX_LINE - hypotheticalPayroll },
    { label: "1st Apron", value: FIRST_APRON_LINE - hypotheticalPayroll },
    { label: "2nd Apron", value: SECOND_APRON_LINE - hypotheticalPayroll },
  ];
  const overSecondApron = hypotheticalPayroll > SECOND_APRON_LINE;

  const remainingPicks = order.filter(
    (s) => s.teamId === myTeamId && !s.prospectId
  ).length;
  const nextPick = order.find((s) => s.teamId === myTeamId && !s.prospectId);

  return (
    <div className="space-y-5">
      <DraftClockCard
        slot={slot}
        onClockTeam={onClockTeam}
        clock={clock}
        strip={strip}
        teamById={teamById}
        prospectName={(s) => allProspects.find((p) => p.id === s.prospectId)?.name}
      />

      {/* Status bar */}
      <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-brand-muted">
            Your Team: {team.franchise ?? team.name}
          </span>
          <Tile label="Total Salary" value={moneyFull(draftedSalaryTotal)} />
          <Tile label="Salary Floor" value={moneyFull(138)} />
          <Tile
            label="Cap Space"
            value={moneyFull(SALARY_CAP - draftedSalaryTotal)}
            tone={
              SALARY_CAP - draftedSalaryTotal < 0
                ? "text-red-500"
                : "text-brand-cta-dark"
            }
          />
          <Tile
            label="Luxury Tax"
            value={moneyFull(TAX_LINE - draftedSalaryTotal)}
            tone={
              TAX_LINE - draftedSalaryTotal < 0
                ? "text-red-500"
                : "text-brand-cta-dark"
            }
          />
          <Tile
            label="1st Apron"
            value={moneyFull(FIRST_APRON_LINE - draftedSalaryTotal)}
            tone={
              FIRST_APRON_LINE - draftedSalaryTotal < 0
                ? "text-red-500"
                : "text-brand-cta-dark"
            }
          />
          <Tile
            label="2nd Apron"
            value={moneyFull(SECOND_APRON_LINE - draftedSalaryTotal)}
            tone={
              SECOND_APRON_LINE - draftedSalaryTotal < 0
                ? "text-red-500"
                : "text-brand-cta-dark"
            }
          />
          <Tile
            label="Players"
            value={`${draftedByMe.length}/${team.rosterMax}`}
          />
          <Tile label="2-Way" value="0/3" />
          <Tile label="Remaining Picks" value={String(remainingPicks)} />
          <Tile
            label="Next Pick"
            value={nextPick ? `R${nextPick.round}-P${nextPick.pick}` : "—"}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr_1fr]">
        {/* Available players */}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-dark">
              Available Players{" "}
              <span className="text-brand-muted">({available.length})</span>
            </h3>
            <div className="relative w-44">
              <FiSearch className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-lg border border-brand-border py-1.5 pl-8 pr-2 text-xs outline-none focus:border-brand-cta"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-xs">
                <thead>
                  <tr className="bg-brand-soft text-[10px] uppercase text-brand-muted">
                    <th className="px-2 py-2" />
                    <th className="px-2 py-2 text-left">Player</th>
                    <th className="px-2 py-2 text-center">Pos</th>
                    <th className="px-2 py-2 text-center">Age</th>
                    <th className="px-2 py-2 text-right">Salary</th>
                    <th className="px-2 py-2 text-center">PTS</th>
                    <th className="px-2 py-2 text-center">REB</th>
                    <th className="px-2 py-2 text-center">AST</th>
                    <th className="px-2 py-2 text-center">FG%</th>
                    <th className="px-2 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {available.map((p) => {
                    const onBoard = boardPreview.has(p.id);
                    const queued = queueSet.has(p.id);
                    return (
                      <tr key={p.id} className="hover:bg-brand-soft/60">
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            aria-label={
                              queued ? `Remove ${p.name} from queue` : `Queue ${p.name}`
                            }
                            onClick={() =>
                              dispatch(
                                queued ? unqueueProspect(p.id) : queueProspect(p.id)
                              )
                            }
                            className={`transition ${
                              queued
                                ? "text-brand-cta-dark"
                                : "text-brand-muted hover:text-brand-cta-dark"
                            }`}
                          >
                            <FiStar
                              className={`h-3.5 w-3.5 ${queued ? "fill-brand-cta-dark" : ""}`}
                            />
                          </button>
                        </td>
                        <td className="px-2 py-2 font-medium text-brand-dark">
                          <button
                            type="button"
                            onClick={() => setDetail(p)}
                            className="hover:text-brand-cta-dark hover:underline"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center text-brand-muted">
                          {p.position}
                        </td>
                        <td className="px-2 py-2 text-center text-brand-muted">
                          {p.age}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-brand-cta-dark">
                          {moneyFull(p.salary)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {p.pts.toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {p.reb.toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {p.ast.toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {p.fgPct.toFixed(1)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => toggleBoardPreview(p.id)}
                              aria-label={
                                onBoard
                                  ? `Remove ${p.name} from draft board`
                                  : `Add ${p.name} to draft board`
                              }
                              title="Add to Draft Board"
                              className={`rounded p-1 transition ${
                                onBoard
                                  ? "text-brand-cta-dark"
                                  : "text-brand-muted hover:text-brand-cta-dark"
                              }`}
                            >
                              <FiBookmark
                                className={`h-3.5 w-3.5 ${onBoard ? "fill-brand-cta-dark" : ""}`}
                              />
                            </button>
                            <button
                              type="button"
                              disabled={!canDraft}
                              onClick={() => dispatch(draftProspect(p.id))}
                              className="rounded-lg bg-brand-cta px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-brand-cta-dark disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Draft
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {available.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-2 py-6 text-center text-brand-muted"
                      >
                        No prospects match.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Your draft board */}
        <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
          <h3 className="text-sm font-semibold text-brand-dark">
            Your Draft Board
          </h3>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
            Drafted ({draftedByMe.length})
          </p>
          {draftedByMe.length === 0 ? (
            <p className="mt-1 text-xs text-brand-muted">
              No players drafted yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-brand-border text-xs">
              {draftedByMe.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(p)}
                    className="min-w-0 truncate text-left font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                  >
                    {p.name}
                    <span className="ml-1 text-brand-muted">{p.position}</span>
                  </button>
                  <span className="shrink-0 font-semibold text-brand-cta-dark">
                    {moneyFull(p.salary)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
            On the Board — Preview ({previewProspects.length})
          </p>
          {previewProspects.length === 0 ? (
            <p className="mt-1 text-xs text-brand-muted">
              Add available players to preview their cap impact.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-dashed divide-brand-border text-xs">
              {previewProspects.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 py-1.5"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(p)}
                    className="min-w-0 truncate text-left font-medium text-brand-dark hover:text-brand-cta-dark hover:underline"
                  >
                    {p.name}
                    <span className="ml-1 text-brand-muted">{p.position}</span>
                  </button>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-brand-cta-dark">
                      {moneyFull(p.salary)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBoardPreview(p.id)}
                      aria-label={`Remove ${p.name} from draft board`}
                      className="text-brand-muted transition hover:text-red-500"
                    >
                      <FiX className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Impact + queue */}
        <div className="space-y-4">
          <div className="rounded-xl border border-brand-border bg-white p-4 shadow-card">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-brand-muted">
              Team Impact If Drafted
            </p>
            <dl className="space-y-1 text-xs">
              {impact.map((l) => (
                <div key={l.label} className="flex justify-between">
                  <dt className="text-brand-muted">{l.label}</dt>
                  <dd
                    className={`font-semibold ${
                      l.value < 0 ? "text-red-500" : "text-brand-dark"
                    }`}
                  >
                    {moneyFull(l.value)}
                  </dd>
                </div>
              ))}
            </dl>
            {overSecondApron ? (
              <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-700">
                Your current board pushes you past the second apron.
              </p>
            ) : null}
          </div>

          <DraftQueue pool="startup" compact />
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
