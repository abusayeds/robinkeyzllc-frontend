"use client";

import { useEffect, useState } from "react";
import { LuGripVertical } from "react-icons/lu";
import TeamLogo from "@/components/ui/TeamLogo";
import { getApiErrorMessage } from "@/lib/store/api/baseApi";
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

const POOL_LIMIT = 9;

export default function CommissionerStartupDraft() {
  const activeLeague = useAppSelector((s) => s.activeLeague.current);
  const leagueId = activeLeague?.id;
  const canEdit = canManageLeague(activeLeague);
  const hydrated = useHydrated();

  const { data, isLoading, isError, error } = useDraftQuery(
    { leagueId: leagueId as number, kind: "startup" },
    { skip: !leagueId },
  );

  const [updateDraft, updateState] = useUpdateDraftMutation();
  const [setOrder, setOrderState] = useSetDraftOrderMutation();
  const [buildOrder, buildState] = useBuildDraftOrderMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [poolPage, setPoolPage] = useState(1);
  const { data: pool } = useDraftPoolQuery(
    {
      leagueId: leagueId as number,
      kind: "startup",
      search: searchQuery,
      page: poolPage,
      limit: POOL_LIMIT,
    },
    { skip: !leagueId },
  );

  // A search changes what page 1 means, so the page goes back with it.
  useEffect(() => setPoolPage(1), [searchQuery]);

  // Form state, seeded from the server and re-seeded whenever it answers, so
  // the inputs are editable without each keystroke becoming a request.
  const [form, setForm] = useState<{
    rounds: string;
    startDate: string;
    startTime: string;
    timezone: string;
    pickTimerValue: string;
    pickTimerUnit: "minutes" | "hours";
    snakeOrder: boolean;
    reversalRound: string;
    autoSetOrder: boolean;
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
      reversalRound: String(data.reversalRound),
      autoSetOrder: data.autoSetOrder,
    });
    setTeamOrder(orderedTeams(data));
  }, [data]);

  // The league comes from localStorage, so the server render cannot know it.
  // This says so rather than rendering nothing: a blank page is indis-
  // tinguishable from a broken one.
  if (!hydrated) {
    return (
      <p className="text-sm text-brand-muted">Loading the startup draft…</p>
    );
  }

  if (!leagueId) {
    return (
      <p className="text-sm text-brand-muted">
        Open a league to set up its startup draft.
      </p>
    );
  }

  if (isLoading || !data || !form) {
    return (
      <p className="text-sm text-brand-muted">
        {isError
          ? getApiErrorMessage(error, "The startup draft could not be loaded.")
          : "Loading the startup draft…"}
      </p>
    );
  }

  const busy =
    updateState.isLoading || setOrderState.isLoading || buildState.isLoading;

  const dropAt = (to: number) => {
    if (dragFrom === null || dragFrom === to) return;
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
      const rounds = Number(form.rounds) || data.rounds;
      await updateDraft({
        leagueId,
        kind: "startup",
        rounds,
        snakeOrder: form.snakeOrder,
        reversalRound: Number(form.reversalRound) || 1,
        startsAt: toIsoStartsAt(form.startDate, form.startTime),
        timezone: form.timezone,
        pickSeconds: pickTimerToSeconds(
          form.pickTimerValue,
          form.pickTimerUnit,
        ),
        autoSetOrder: form.autoSetOrder,
      }).unwrap();

      // The order is its own request: the round count has to be saved first,
      // or the rebuilt order would be laid out over the old number of rounds.
      await setOrder({
        leagueId,
        kind: "startup",
        order: buildOrderRows(
          teamOrder.map((team) => team.id),
          rounds,
          form.snakeOrder,
          Number(form.reversalRound) || 1,
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
          Startup Draft Settings
        </h1>
        <p className="mt-1 text-sm text-brand-muted">
          Configure draft format, pick times, and team order for the league
          startup draft.
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
                {flag.seasonStartYear} round {flag.round}: {flag.message}
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
                kind: "startup",
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
        {/* Main Content */}
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            {/* Draft Format Header */}
            <div className="border-b border-brand-border px-6 py-4">
              <h2 className="text-base font-bold text-brand-dark">
                Draft Format
              </h2>
            </div>

            {/* Settings Grid */}
            <div className="grid gap-6 border-b border-brand-border p-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Number of Rounds */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                    Number of Rounds
                  </label>
                  <p className="mb-2 text-xs text-brand-muted">
                    Total rounds in the startup draft
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    disabled={!canEdit}
                    value={form.rounds}
                    onChange={(e) =>
                      setForm({ ...form, rounds: e.target.value })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30"
                  />
                </div>

                {/* Draft Start Date */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                    Draft Start Date
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
              </div>

              {/* Right Column */}
              <div className="space-y-5">
                {/* Snake Order */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                    Snake Order
                  </label>
                  <p className="mb-2 text-xs text-brand-muted">
                    Reverse draft order after each round
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
                    <span className="text-sm font-semibold text-brand-dark">
                      {form.snakeOrder ? form.reversalRound : "Off"}
                    </span>
                  </label>
                </div>

                {/* Reversal Round */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                    Reversal Round
                  </label>
                  <p className="mb-2 text-xs text-brand-muted">
                    The round the order first turns around in
                  </p>
                  <input
                    type="number"
                    min={1}
                    max={Number(form.rounds) || 30}
                    disabled={!canEdit || !form.snakeOrder}
                    value={form.reversalRound}
                    onChange={(e) =>
                      setForm({ ...form, reversalRound: e.target.value })
                    }
                    className="w-full rounded-lg border border-brand-border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-cta/30 disabled:bg-brand-soft"
                  />
                </div>

                {/* Auto Set Draft Order */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-brand-dark">
                    Auto Set Draft Order
                  </label>
                  <p className="mb-2 text-xs text-brand-muted">
                    Turning this on shuffles the order once and lays every round
                    out from it. It does not reshuffle on later saves.
                  </p>
                  <label className="flex items-center gap-3">
                    <div className="relative">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={form.autoSetOrder}
                        onChange={(e) =>
                          setForm({ ...form, autoSetOrder: e.target.checked })
                        }
                        className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-gray-300 transition checked:bg-emerald-500"
                      />
                      <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition peer-checked:left-[1.125rem]" />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Draft Order Section */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-brand-dark">
                  Draft Order
                </h2>
                <button
                  type="button"
                  disabled={!canEdit || busy}
                  onClick={async () => {
                    setSaveError(null);
                    try {
                      await buildOrder({
                        leagueId,
                        kind: "startup",
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
                  className="flex items-center gap-2 rounded-lg border border-brand-border bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-soft disabled:opacity-50"
                >
                  <span>⚲</span>
                  <span>
                    {buildState.isLoading ? "Randomizing…" : "Randomize"}
                  </span>
                </button>
              </div>

              {teamOrder.length === 0 ? (
                <p className="text-sm text-brand-muted">
                  This league has no teams yet, so there is no order to set.
                </p>
              ) : null}

              <div className="space-y-0">
                {teamOrder.map((team, index) => (
                  <div
                    key={team.id}
                    draggable={canEdit}
                    onDragStart={() => setDragFrom(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dropAt(index)}
                    className={`flex items-center gap-4 px-4 py-4 transition hover:bg-brand-soft/50 ${
                      index !== teamOrder.length - 1
                        ? "border-b border-gray-100"
                        : ""
                    } ${dragFrom === index ? "opacity-50" : ""}`}
                  >
                    <button
                      type="button"
                      className="cursor-grab text-brand-muted hover:text-brand-dark active:cursor-grabbing"
                    >
                      <LuGripVertical className="h-5 w-5" />
                    </button>
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-sm font-bold text-brand-dark">
                      {index + 1}
                    </div>
                    <TeamLogo
                      name={team.name}
                      src={team.logo ?? undefined}
                      className="h-9 w-9"
                      rounded="rounded"
                    />
                    <span className="flex-1 font-medium text-brand-dark">
                      {team.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Startup Player Pool */}
        <div className="space-y-6">
          <div className="rounded-xl border border-brand-border bg-white shadow-sm">
            <div className="border-b border-brand-border px-6 py-4">
              <h2 className="text-base font-bold text-brand-dark">
                Startup Player Pool
              </h2>
              <p className="mt-1 text-xs text-brand-muted">
                The startup draft uses every active NBA player. Contracts come
                from the same feed as the player sync.
              </p>
            </div>

            <div className="p-6">
              <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                <h3 className="mb-3 text-sm font-bold text-emerald-900">
                  {data.pool.contractsAvailable
                    ? "Player Contracts Imported"
                    : "Players Ready · Contracts Not Synced Yet"}
                </h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-emerald-700">Available Players</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {data.pool.available}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Drafted</p>
                    <p className="text-lg font-bold text-emerald-900">
                      {data.pool.drafted}
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-700">Contract Source</p>
                    <p className="text-sm font-bold text-emerald-900">
                      {data.pool.contractSource}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-brand-dark">
                    Player Preview
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
                            {player.contract ?? "Not synced"}
                          </td>
                        </tr>
                      ))}
                      {poolPlayers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-2 py-4 text-center text-brand-muted"
                          >
                            No players match that search.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <p className="mt-2 text-xs text-brand-muted">
                  Showing {poolPlayers.length} of {pool?.total ?? 0} players
                </p>

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
                    <span className="px-2 text-xs text-brand-muted">
                      {poolPage} / {poolPages}
                    </span>
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
                {data.pool.contractsAvailable ? null : (
                  <p className="mt-1 text-[11px] text-brand-muted">
                    The Age column fills in once a Super Admin has imported
                    birthdates.
                  </p>
                )}
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

/** The first round's order, which is the one the list on screen edits. */
function orderedTeams(data: DraftSettings): DraftTeam[] {
  const ids = firstRoundTeamIds(data.order);
  if (ids.length === 0) return data.teams;

  const byId = new Map(data.teams.map((team) => [team.id, team]));
  const ordered = ids
    .map((id) => byId.get(id))
    .filter((team): team is DraftTeam => Boolean(team));

  // A team added after the order was set would otherwise disappear from the
  // list, and so from every round built out of it.
  for (const team of data.teams) {
    if (!ids.includes(team.id)) ordered.push(team);
  }
  return ordered;
}

/** Lays one team order out across every round, snaked or straight. */
function buildOrderRows(
  teamIds: number[],
  rounds: number,
  snake: boolean,
  reversalRound: number,
) {
  const rows: {
    round: number;
    pickInRound: number;
    overall: number;
    teamId: number;
  }[] = [];

  let overall = 1;
  for (let round = 1; round <= rounds; round += 1) {
    const reversed =
      snake && round >= reversalRound && (round - reversalRound) % 2 === 0;
    const order = reversed ? [...teamIds].reverse() : teamIds;
    order.forEach((teamId, index) => {
      rows.push({ round, pickInRound: index + 1, overall, teamId });
      overall += 1;
    });
  }

  return rows;
}
