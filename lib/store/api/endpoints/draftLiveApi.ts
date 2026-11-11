import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { DraftFormat, DraftKind, DraftStatus, TeamRef } from "./draftApi";

/**
 * The live draft room.
 *
 * Separate from `draftApi`, which is the commissioner's side — rounds, order,
 * timer, the pick inventory. This is the part that changes while people are
 * watching, and it is the only part that polls.
 */

export type BoardPlayer = {
  id: number;
  name: string;
  position: string | null;
  headshot: string | null;
  nbaTeam: { abbreviation: string } | null;
};

export type BoardSlot = {
  id: number;
  round: number;
  pickInRound: number;
  overall: number;
  team: TeamRef;
  /** Null until the pick is made. */
  player: BoardPlayer | null;
  pickedAt: string | null;
  isMine: boolean;
};

export type OnTheClock = {
  slotId: number;
  round: number;
  pickInRound: number;
  overall: number;
  team: TeamRef;
  isMine: boolean;
};

export type DraftBoard = {
  id: number;
  kind: DraftKind;
  seasonStartYear: number;
  status: DraftStatus;
  rounds: number;
  format: DraftFormat;
  reversalRound: number;
  pickSeconds: number;
  startsAt: string | null;
  /** When the room actually opened. The first pick's clock runs from here. */
  startedAt: string | null;
  timezone: string | null;

  /** Null for a commissioner or Super Admin who holds no team in this league. */
  myTeamId: number | null;

  /**
   * The server's own clock, so a browser whose time is wrong can correct for
   * the offset instead of counting down from the wrong place.
   */
  serverNow: string;
  /** Null before the draft starts, and once every pick is in. */
  deadline: string | null;

  onTheClock: OnTheClock | null;
  picks: BoardSlot[];
  made: number;
  total: number;
};

export const draftLiveApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    draftBoard: builder.query<
      DraftBoard,
      { leagueId: number; kind: DraftKind }
    >({
      query: ({ leagueId, kind }) =>
        `/leagues/${leagueId}/drafts/${kind}/board`,
      transformResponse: (r: ApiResponse<DraftBoard>) => unwrap(r),
      providesTags: ["Draft"],
    }),

    startDraft: builder.mutation<
      DraftBoard,
      { leagueId: number; kind: DraftKind }
    >({
      query: ({ leagueId, kind }) => ({
        url: `/leagues/${leagueId}/drafts/${kind}/start`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<DraftBoard>) => unwrap(r),
      invalidatesTags: ["Draft"],
    }),

    makePick: builder.mutation<
      DraftBoard,
      { leagueId: number; kind: DraftKind; playerId: number }
    >({
      query: ({ leagueId, kind, playerId }) => ({
        url: `/leagues/${leagueId}/drafts/${kind}/pick`,
        method: "POST",
        body: { playerId },
      }),
      transformResponse: (r: ApiResponse<DraftBoard>) => unwrap(r),
      // A pick takes a player out of the pool, puts him on a roster and — for
      // a first-round rookie — writes a cap hold, so all four move.
      invalidatesTags: [
        "Draft",
        "DraftPool",
        "DraftPicks",
        "Rosters",
        "Salaries",
      ],
    }),
  }),
});

export const {
  useDraftBoardQuery,
  useStartDraftMutation,
  useMakePickMutation,
} = draftLiveApi;
