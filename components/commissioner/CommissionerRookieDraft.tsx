"use client";

import { useEffect, useMemo, useState } from "react";
import { LuGripVertical } from "react-icons/lu";
import TeamLogo from "@/components/ui/TeamLogo";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
import type { DraftOrderSlot } from "@/lib/store/api/endpoints/draftApi";
import {
  useBuildDraftOrderMutation,
  useDraftPoolQuery,
  useDraftQuery,
  useSetDraftOrderMutation,
  useUpdateDraftMutation,
  type DraftSettings,
  type DraftStatus,
  type DraftTeam,
} from "@/lib/store/api/endpoints/draftApi";
import { canManageLeague } from "@/lib/store/features/activeLeagueSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useHydrated } from "@/lib/useHydrated";
import {
  DRAFT_STATUS_LABEL,
  DRAFT_STATUS_TONE,
  DRAFT_STATUSES,
  firstRoundTeamIds,
  pickTimerToSeconds,
  secondsToPickTimer,
  splitStartsAt,
  toIsoStartsAt,
} from "./draftSettings";

/** Teams per page in the order table, matching what the page already showed. */
const ORDER_PAGE_SIZE = 10;
const POOL_LIMIT = 9;

export default function CommissionerRookieDraft() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);
  const hydrated = useHydrated();

  const { data, isLoading, isError, error } = useDraftQuery(
    { leagueId: leagueId as number, kind: "rookie" },
    { skip: !leagueId },
  );

  const [updateDraft, updateState] = useUpdateDraftMutation();
  const [setOrder, setOrderState] = useSetDraftOrderMutation();
  const [buildOrder, buildState] = useBuildDraftOrderMutation();

  const [currentRound, setCurrentRound] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [poolPage, setPoolPage] = useState(1);
  const { data: pool } = useDraftPoolQuery(
    {
      leagueId: leagueId as number,
      kind: "rookie",
      search: searchQuery,
      page: poolPage,
      limit: POOL_LIMIT,
    },
    { skip: !leagueId },
  );

  const [form, setForm] = useState<{
    rounds: string;
    startDate: string;
    startTime: string;
    timezone: string;
    pickTimerValue: string;
    pickTimerUnit: "minutes" | "hours";
    snakeOrder: boolean;
  } | null>(null);

  const [teamOrder, setTeamOrder] = useState<DraftTeam[]>([]);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data) return;
    const when = splitStartsAt(data.startsAt);
    const timer = secondsToPickTimer(data.pickSeconds);
    setForm({
      rounds: String(data.rounds),
      startDate: when.date,
      startTime: when.time,
      timezone: data.timezone ?? "",
      pickTimerValue: String(timer.value),
      pickTimerUnit: timer.unit,
      snakeOrder: data.snakeOrder,
    });
    setTeamOrder(orderedTeams(data));
  }, [data]);

  // A search changes what page 1 means, so the page goes back with it.
  useEffect(() => setPoolPage(1), [searchQuery]);

  const rounds = Number(form?.rounds) || data?.rounds || 2;

  // Who actually picks in each seat. A traded pick is picked by its new
  // owner, and Rule 12 is only real on screen if the table says so.
  const slotBySeat = useMemo(() => {
    const map = new Map<string, DraftOrderSlot>();
    for (const slot of data?.order ?? []) {
      map.set(`${slot.round}:${slot.originalTeam.id}`, slot);
    }
    return map;
  }, [data]);

  // Owners come from the team list, which is the only place that carries
  // them; a slot's team is just a crest and a name.
  const ownerByTeamId = useMemo(
    () => new Map((data?.teams ?? []).map((team) => [team.id, team.ownerName])),
    [data],
  );

  const roundSlots = useMemo(() => {
    const ids = teamOrder.map((team) => team.id);
    // Round 2 of a snake order is the first round backwards, so the table can
    // show it without another request.
    const reversed = form?.snakeOrder && currentRound % 2 === 0;
    const ordered = reversed ? [...ids].reverse() : ids;
    const byId = new Map(teamOrder.map((team) => [team.id, team]));

    return ordered.map((id, index) => {
      const seat = byId.get(id) as DraftTeam;
      const slot = slotBySeat.get(`${currentRound}:${id}`);
      return {
        seat,
        // Falls back to the seat when the order has not been saved yet, or
        // when the league has no picks generated.
        picker: slot?.team ?? seat,
        isTraded: slot?.isTraded ?? false,
        isFrozen: slot?.isFrozen ?? false,
        protectedTopN: slot?.protectedTopN ?? null,
        pickInRound: index + 1,
        overall: (currentRound - 1) * ids.length + index + 1,
      };
    });
  }, [teamOrder, currentRound, form?.snakeOrder, slotBySeat]);

  const orderPages = Math.max(
    Math.ceil(roundSlots.length / ORDER_PAGE_SIZE),
    1,
  );
  const safeOrderPage = Math.min(orderPage, orderPages);
  const visibleSlots = roundSlots.slice(
    (safeOrderPage - 1) * ORDER_PAGE_SIZE,
    safeOrderPage * ORDER_PAGE_SIZE,
  );

  // The league comes from localStorage, so the server render cannot know it.
  // This says so rather than rendering nothing: a blank page is indis-
  // tinguishable from a broken one.
  if (!hydrated) {
    return (
      <p className="text-sm text-brand-muted">Loading the rookie draft…</p>
    );
  }

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Open a league to set up its rookie draft.
      </p>
    );
  }

  if (isLoading || !data || !form) {
    return (
      <p className="text-sm text-brand-muted">
        {isError
          ? getApiErrorMessage(error, "The rookie draft could not be loaded.")
          : "Loading the rookie draft…"}
      </p>
    );
  }

  const busy =
    updateState.isLoading || setOrderState.isLoading || buildState.isLoading;

  // Only the first round is dragged: every later round is laid out from it.
  const canDrag = canEdit && currentRound === 1;

  const dropAt = (indexOnPage: number) => {
    if (!canDrag || dragFrom === null) return;
    const to = (safeOrderPage - 1) * ORDER_PAGE_SIZE + indexOnPage;
    if (dragFrom === to) return;
    setTeamOrder((teams) => {
      const next = [...teams];
      const [moved] = next.splice(dragFrom, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDragFrom(null);
  };

  const save = async () => {
    setSaveError(null);
    setSaved(false);
    try {
      await updateDraft({
        leagueId,
        kind: "rookie",
        rounds,
        snakeOrder: form.snakeOrder,
        // A two-round snake turns around in round 2, which is why this page
        // shows the reversal round as not applicable. Clamped, because a
        // one-round draft has no round 2 and the API refuses a reversal round
        // past the last one.
        reversalRound: Math.min(2, rounds),
        startsAt: toIsoStartsAt(form.startDate, form.startTime),
        timezone: form.timezone,
        pickSeconds: pickTimerToSeconds(
          form.pickTimerValue,
          form.pickTimerUnit,
        ),
      }).unwrap();

      await setOrder({
        leagueId,
        kind: "rookie",
        order: buildOrderRows(
          teamOrder.map((team) => team.id),
          rounds,
          form.snakeOrder,
        ),
      }).unwrap();

      setSaved(true);
    } catch (e) {
      setSaveError(getApiErrorMessage(e, "The settings could not be saved."));
    }
  };

  const poolPlayers = pool?.players ?? [];
  const poolPages = Math.max(
    Math.ceil((pool?.total ?? 0) / (pool?.limit ?? POOL_LIMIT)),
    1,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">
          Rookie Draft Settings
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Configure your rookie draft format, pick times, and team order for the
          league rookie draft.
        </p>
      </div>

      {data.flags.length > 0 ? (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <p className="font-semibold">
            Picks you have to place yourself (Rule 12.4)
          </p>
          <ul className="mt-1 space-y-0.5">
            {data.flags.map((flag) => (
              <li key={`${flag.pickId}-${flag.kind}`}>
                Round {flag.round}: {flag.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}


      {/* Draft status — scheduled until it opens, then locked once complete. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-border bg-white px-4 py-3 shadow-card">
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
          Status
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${DRAFT_STATUS_TONE[data.status]}`}
        >
          {DRAFT_STATUS_LABEL[data.status]}
        </span>
        {canEdit ? (
          <select
            value={data.status}
            disabled={busy}
            onChange={(e) =>
              void updateDraft({
                leagueId,
                kind: "rookie",
                status: e.target.value as DraftStatus,
              })
            }
            className="rounded-lg border border-brand-border bg-white px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-brand-cta/30 disabled:opacity-50"
          >
            {DRAFT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {DRAFT_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        ) : null}
        <span className="text-xs text-brand-muted">
          {data.yearLabel} · {data.order.length} picks in the order
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left Column - Main Settings */}
        <div className="space-y-6">
          {/* Draft Format */}
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <h2 className="text-base font-bold text-brand-dark">
                Draft Format
              </h2>
            </div>

            <div className="space-y-5 p-6">
              {/* Number of Rounds */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Number of Rounds
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Total rounds in the rookie draft
                </p>
                <input
                  type="number"
                  min={1}
                  max={4}
                  disabled={!canEdit}
                  value={form.rounds}
                  onChange={(e) => setForm({ ...form, rounds: e.target.value })}
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
                <p className="mt-1 text-xs italic text-brand-muted">
                  Two rounds, as in the NBA draft. Only change it if your league
                  drafts more.
                </p>
              </div>

              {/* Draft Start */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Draft Start
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  When the draft begins
                </p>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    disabled={!canEdit}
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={form.timezone}
                    onChange={(e) =>
                      setForm({ ...form, timezone: e.target.value })
                    }
                    placeholder="America/New_York"
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                </div>
              </div>

              {/* Pick Timer */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Pick Timer
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Time allowed per pick
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    disabled={!canEdit}
                    value={form.pickTimerValue}
                    onChange={(e) =>
                      setForm({ ...form, pickTimerValue: e.target.value })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                  <select
                    disabled={!canEdit}
                    value={form.pickTimerUnit}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        pickTimerUnit: e.target.value as "minutes" | "hours",
                      })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  >
                    <option value="minutes">minutes</option>
                    <option value="hours">hours</option>
                  </select>
                </div>
              </div>

              {/* Snake Order */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Snake Order
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Reverses draft order after each round
                </p>
                <label className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="checkbox"
                      disabled={!canEdit}
                      checked={form.snakeOrder}
                      onChange={(e) =>
                        setForm({ ...form, snakeOrder: e.target.checked })
                      }
                      className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-emerald-500"
                    />
                    <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:left-[1.125rem]" />
                  </div>
                </label>
              </div>

              {/* Reversal Round */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                  Reversal Round
                </label>
                <p className="mb-2 text-xs text-brand-muted">
                  Not available for rookie drafts
                </p>
                <div className="rounded-lg border border-brand-border bg-gray-50 px-3 py-2.5 text-sm text-brand-muted">
                  N/A
                </div>
              </div>
            </div>
          </div>

          {/* Draft Order */}
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-brand-dark">
                  Draft Order
                </h2>
                <div className="flex items-center gap-2">
                  {Array.from({ length: rounds }, (_, i) => i + 1).map(
                    (round) => (
                      <button
                        key={round}
                        type="button"
                        onClick={() => {
                          setCurrentRound(round);
                          setOrderPage(1);
                        }}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                          currentRound === round
                            ? "bg-brand-dark text-white"
                            : "bg-gray-100 text-brand-muted hover:bg-gray-200"
                        }`}
                      >
                        Round {round}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={!canEdit || busy}
                    onClick={async () => {
                      setSaveError(null);
                      try {
                        await buildOrder({
                          leagueId,
                          kind: "rookie",
                          randomize: true,
                        }).unwrap();
                      } catch (e) {
                        setSaveError(
                          getApiErrorMessage(
                            e,
                            "The order could not be randomized.",
                          ),
                        );
                      }
                    }}
                    className="rounded-md border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-50"
                  >
                    {buildState.isLoading ? "Randomizing…" : "Randomize"}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="mb-4 text-xs text-brand-muted">
                Draft order followed by draft pick ownership.{" "}
                {currentRound === 1
                  ? "Drag a team to reorder; every later round follows from this one."
                  : "This round follows from round 1, so reorder it there."}
              </p>

              {/* Draft Order Table */}
              <div className="overflow-hidden rounded-lg border border-brand-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-brand-border bg-gray-50 text-[11px] font-semibold uppercase text-brand-muted">
                      <th className="px-3 py-2.5 text-left">#</th>
                      <th className="px-3 py-2.5 text-left">Team</th>
                      <th className="px-3 py-2.5 text-left">Owner</th>
                      <th className="px-3 py-2.5 text-left">Pick</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border bg-white">
                    {visibleSlots.map((slot, index) => (
                      <tr
                        key={`${slot.seat.id}-${slot.overall}`}
                        draggable={canDrag}
                        onDragStart={() =>
                          setDragFrom(
                            (safeOrderPage - 1) * ORDER_PAGE_SIZE + index,
                          )
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => dropAt(index)}
                        className="group hover:bg-brand-soft/30"
                      >
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!canDrag}
                              className="cursor-grab text-brand-muted hover:text-brand-dark disabled:cursor-default disabled:opacity-30"
                            >
                              <LuGripVertical className="h-4 w-4" />
                            </button>
                            <span className="font-semibold text-brand-dark">
                              {slot.pickInRound}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <TeamLogo
                              name={slot.picker.name}
                              src={slot.picker.logo ?? undefined}
                              className="h-6 w-6"
                              rounded="rounded"
                            />
                            <div className="leading-tight">
                              <span className="font-medium text-brand-dark">
                                {slot.picker.name}
                              </span>
                              {slot.isTraded ? (
                                <p className="text-[10px] text-brand-muted">
                                  via {slot.seat.abbr}
                                </p>
                              ) : null}
                            </div>
                            {slot.isFrozen ? (
                              <span className="rounded border border-sky-200 bg-sky-50 px-1 text-[10px] font-semibold text-sky-700">
                                Frozen
                              </span>
                            ) : null}
                            {slot.protectedTopN ? (
                              <span className="rounded border border-purple-200 bg-purple-50 px-1 text-[10px] font-semibold text-purple-700">
                                Top {slot.protectedTopN}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-brand-muted">
                          {ownerByTeamId.get(slot.picker.id) ?? "Unclaimed"}
                        </td>
                        <td className="px-3 py-3 text-brand-dark">
                          {slot.overall}
                        </td>
                      </tr>
                    ))}
                    {visibleSlots.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-3 py-4 text-center text-brand-muted"
                        >
                          This league has no teams yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs text-brand-muted">
                Showing {visibleSlots.length === 0 ? 0 : (safeOrderPage - 1) * ORDER_PAGE_SIZE + 1}{" "}
                to{" "}
                {(safeOrderPage - 1) * ORDER_PAGE_SIZE + visibleSlots.length} of{" "}
                {roundSlots.length} teams
              </p>

              {/* Pagination */}
              {orderPages > 1 ? (
                <div className="mt-3 flex items-center justify-center gap-1">
                  <button
                    type="button"
                    disabled={safeOrderPage === 1}
                    onClick={() => setOrderPage(safeOrderPage - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft disabled:opacity-40"
                  >
                    &lt;
                  </button>
                  {Array.from({ length: orderPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setOrderPage(page)}
                        className={`flex h-7 w-7 items-center justify-center rounded text-xs ${
                          page === safeOrderPage
                            ? "bg-brand-dark font-semibold text-white"
                            : "border border-brand-border text-brand-muted hover:bg-brand-soft"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={safeOrderPage === orderPages}
                    onClick={() => setOrderPage(safeOrderPage + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft disabled:opacity-40"
                  >
                    &gt;
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right Column - Rookie Player Pool */}
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <h2 className="text-base font-bold text-brand-dark">
                Rookie Player Pool
              </h2>
              <p className="mt-1 text-xs text-brand-muted">
                The rookie draft uses the incoming rookie class. Players enter
                the draft without active contract information.
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <h3 className="mb-3 text-sm font-bold text-emerald-900">
                  {data.seasonStartYear} Rookie Class
                  {data.pool.total > 0 ? " Loaded" : " — nothing synced yet"}
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-emerald-700">Available Prospects</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {data.pool.available}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Already Drafted</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {data.pool.drafted}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Contract Class</p>
                    <p className="text-sm font-bold text-emerald-900">
                      Rookie scale
                    </p>
                  </div>
                </div>
              </div>

              {/* Rookie Class Preview */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-brand-dark">
                    Rookie Class Preview
                  </h3>
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-32 rounded border border-brand-border px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                </div>

                <div className="overflow-hidden rounded-lg border border-brand-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-brand-border bg-gray-50 text-[10px] font-semibold uppercase text-brand-muted">
                        <th className="px-2 py-2 text-left">Player</th>
                        <th className="px-2 py-2 text-center">Pos</th>
                        <th className="px-2 py-2 text-center">Age</th>
                        <th className="px-2 py-2 text-center">Team</th>
                        <th className="px-2 py-2 text-right">Contract</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border bg-white">
                      {poolPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-brand-soft/30">
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-forest text-[10px] font-bold text-brand-accent">
                                {player.name.charAt(0)}
                              </div>
                              <span className="font-medium text-brand-dark">
                                {player.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center text-brand-muted">
                            {player.position ?? "—"}
                          </td>
                          <td className="px-2 py-2 text-center text-brand-muted">
                            {player.age ?? "—"}
                          </td>
                          <td className="px-2 py-2 text-center">
                            {player.nbaTeam ? (
                              <span className="inline-flex h-5 items-center justify-center rounded bg-blue-100 px-1.5 text-[10px] font-bold text-blue-700">
                                {player.nbaTeam.abbreviation}
                              </span>
                            ) : (
                              <span className="text-brand-muted">—</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-right text-brand-muted">
                            {player.takenBy
                              ? `Drafted · ${player.takenBy.abbr}`
                              : "Not Assigned"}
                          </td>
                        </tr>
                      ))}
                      {poolPlayers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-2 py-4 text-center text-brand-muted"
                          >
                            {searchQuery
                              ? "No prospects match that search."
                              : "No rookie class has been synced for this league year yet."}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-xs text-brand-muted">
                  Showing {poolPlayers.length} of {pool?.total ?? 0} prospects
                </p>

                {/* Pagination */}
                {poolPages > 1 ? (
                  <div className="mt-3 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={poolPage === 1}
                      onClick={() => setPoolPage(poolPage - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft disabled:opacity-40"
                    >
                      &lt;
                    </button>
                    {Array.from(
                      { length: Math.min(poolPages, 3) },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setPoolPage(page)}
                        className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
                          page === poolPage
                            ? "bg-brand-dark font-semibold text-white"
                            : "border border-brand-border text-brand-muted hover:bg-brand-soft"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    {poolPages > 3 ? (
                      <span className="px-1 text-xs text-brand-muted">...</span>
                    ) : null}
                    <button
                      type="button"
                      disabled={poolPage >= poolPages}
                      onClick={() => setPoolPage(poolPage + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:bg-brand-soft disabled:opacity-40"
                    >
                      &gt;
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        {saveError ? (
          <p className="text-xs text-red-600">{saveError}</p>
        ) : saved ? (
          <p className="text-xs text-emerald-700">Settings saved.</p>
        ) : null}
        <button
          type="button"
          disabled={!canEdit || busy}
          onClick={() => void save()}
          className="rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

/** The first round's order, which is the one the table edits. */
function orderedTeams(data: DraftSettings): DraftTeam[] {
  const ids = firstRoundTeamIds(data.order);
  if (ids.length === 0) return data.teams;

  const byId = new Map(data.teams.map((team) => [team.id, team]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((team): team is DraftTeam => Boolean(team));

  for (const team of data.teams) {
    if (!ids.includes(team.id)) ordered.push(team);
  }
  return ordered;
}

function buildOrderRows(teamIds: number[], rounds: number, snake: boolean) {
  const rows: {
    round: number;
    pickInRound: number;
    overall: number;
    teamId: number;
  }[] = [];

  let overall = 1;
  for (let round = 1; round <= rounds; round += 1) {
    const order = snake && round % 2 === 0 ? [...teamIds].reverse() : teamIds;
    order.forEach((teamId, index) => {
      rows.push({ round, pickInRound: index + 1, overall, teamId });
      overall += 1;
    });
  }

  return rows;
}
