"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useDraftPoolQuery,
  useDraftQuery,
  type DraftKind,
  type PoolPlayer,
} from "@/lib/store/api/endpoints/draftApi";
import {
  useDraftBoardQuery,
  useMakePickMutation,
  useStartDraftMutation,
} from "@/lib/store/api/endpoints/draftLiveApi";
import { useAppSelector } from "@/lib/store/hooks";
import { useCountdown } from "./utils";
import { useDraftQueue } from "./useDraftQueue";

/**
 * How often the room asks the server what has happened.
 *
 * Polling rather than a socket, deliberately: the board is a few kilobytes,
 * every read also settles any expired clock, and a draft that works over a
 * plain HTTP request works behind every proxy and on every phone. A socket is
 * the upgrade, not the starting point.
 */
const POLL_WHILE_RUNNING_MS = 5000;

/** The whole pool in one request, so filtering and the count are honest. */
const POOL_LIMIT = 600;

export type DraftRoom = ReturnType<typeof useDraftRoom>;

export function useDraftRoom(kind: DraftKind) {
  const activeLeague = useAppSelector((state) => state.activeLeague.current);
  const leagueId = activeLeague?.id;

  /**
   * Polling is switched on by what the board itself reports.
   *
   * It has to be state rather than read straight off `board.data`, because the
   * options are passed into the hook that produces that data. A draft which
   * has not started, or is over, has nothing to poll for, and a zero interval
   * is how RTK Query is told not to.
   */
  const [running, setRunning] = useState(false);

  const board = useDraftBoardQuery(
    { leagueId: leagueId as number, kind },
    {
      skip: !leagueId,
      pollingInterval: running ? POLL_WHILE_RUNNING_MS : 0,
      // A draft left open in a background tab should not keep asking; the
      // first read after it is focused again settles whatever was missed.
      skipPollingIfUnfocused: true,
    },
  );

  const status = board.data?.status;
  useEffect(() => {
    setRunning(status === "inProgress");
  }, [status]);

  const pool = useDraftPoolQuery(
    { leagueId: leagueId as number, kind, limit: POOL_LIMIT },
    { skip: !leagueId },
  );

  // For the owner's name beside the team on the clock, which the board itself
  // does not carry — it is settings data, and it does not change mid-draft.
  const settings = useDraftQuery(
    { leagueId: leagueId as number, kind },
    { skip: !leagueId },
  );

  const [start, startState] = useStartDraftMutation();
  const [pick, pickState] = useMakePickMutation();

  const { queue, toggle, remove } = useDraftQueue(board.data?.id);

  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("All");

  const ownerByTeamId = useMemo(
    () =>
      new Map(
        (settings.data?.teams ?? []).map((team) => [team.id, team.ownerName]),
      ),
    [settings.data],
  );

  /**
   * Available players, best first.
   *
   * Sorted by last season's points, which is both what the board shows and
   * what the server's auto-pick uses — so the list an owner is reading is the
   * list the clock would pick from. A player with no synced lines sorts last
   * rather than as a zero-point player, and inside that group the server's own
   * alphabetical order is kept.
   */
  const available = useMemo(() => {
    const rows = (pool.data?.players ?? []).filter(
      (player) => player.takenBy === null,
    );

    return rows.sort((a, b) => {
      const left = a.stats?.pts ?? null;
      const right = b.stats?.pts ?? null;
      if (left === right) return 0;
      if (left === null) return 1;
      if (right === null) return -1;
      return right - left;
    });
  }, [pool.data]);

  /**
   * The position chips, taken from the pool rather than written down.
   *
   * The source feed describes a player as "G", "F", "C" or a hyphenated pair
   * like "G-F" — there is no PG/SG/SF/PF anywhere in it. A chip row written
   * from the design's labels would therefore have four buttons that can never
   * match a single player, so the row is built from the positions the pool
   * actually contains.
   */
  const positions = useMemo(() => {
    const found = new Set<string>();
    for (const player of pool.data?.players ?? []) {
      for (const part of (player.position ?? "").split("-")) {
        const value = part.trim();
        if (value) found.add(value);
      }
    }
    return ["All", ...[...found].sort()];
  }, [pool.data]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return available.filter((player) => {
      if (needle && !player.name.toLowerCase().includes(needle)) return false;
      if (position === "All") return true;

      // "G" has to match "G-F" as well as "G", so the stored value is split
      // the same way the chip list was built.
      return (player.position ?? "")
        .split("-")
        .map((part) => part.trim())
        .includes(position);
    });
  }, [available, search, position]);

  const byId = useMemo(
    () => new Map((pool.data?.players ?? []).map((p) => [p.id, p])),
    [pool.data],
  );

  const queuedPlayers = useMemo(
    () =>
      queue
        .map((id) => byId.get(id))
        .filter((player): player is PoolPlayer => Boolean(player))
        .filter((player) => player.takenBy === null),
    [queue, byId],
  );

  const data = board.data;

  const clock = useCountdown(
    data?.deadline ?? null,
    data?.serverNow ?? null,
    data?.pickSeconds ?? 0,
  );

  /** The round the clock card's strip shows: the one being picked now. */
  const strip = useMemo(() => {
    if (!data?.onTheClock) return [];
    return data.picks.filter((slot) => slot.round === data.onTheClock?.round);
  }, [data]);

  const myPicks = useMemo(
    () => (data?.picks ?? []).filter((slot) => slot.isMine),
    [data],
  );

  const nextPick = useMemo(
    () => myPicks.find((slot) => slot.pickedAt === null) ?? null,
    [myPicks],
  );

  const canPick =
    running && data?.onTheClock?.isMine === true && !pickState.isLoading;

  return {
    leagueId,
    kind,

    board: data,
    isLoading: board.isLoading || pool.isLoading,
    error: board.error,

    status,
    running,
    clock,
    strip,
    ownerName: data?.onTheClock
      ? (ownerByTeamId.get(data.onTheClock.team.id) ?? null)
      : null,

    statsSeason: pool.data?.statsSeason ?? null,
    available,
    filtered,
    positions,
    search,
    setSearch,
    position,
    setPosition,
    byId,

    queue,
    queuedPlayers,
    toggleQueue: toggle,
    removeFromQueue: remove,

    myPicks,
    nextPick,
    remainingPicks: myPicks.filter((slot) => slot.pickedAt === null).length,

    canPick,
    pickError: pickState.error,
    isPicking: pickState.isLoading,
    makePick: (playerId: number) => {
      if (!leagueId) return;
      void pick({ leagueId, kind, playerId });
    },

    canStart: data?.status === "scheduled",
    isStarting: startState.isLoading,
    startError: startState.error,
    startDraft: () => {
      if (!leagueId) return;
      void start({ leagueId, kind });
    },
  };
}
