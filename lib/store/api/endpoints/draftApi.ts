import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type DraftKind = "startup" | "rookie";
export type DraftFormat = "snake" | "linear";
export type DraftStatus = "scheduled" | "inProgress" | "complete";
export type PickProtectionOutcome = "rollover" | "convert" | "end";

export type TeamRef = {
  id: number;
  name: string;
  abbr: string;
  logo?: string | null;
};

/** Rule 12.11 — why the engine will not let a pick be traded. */
export type UntradeableReason =
  | "used"
  | "leagueDisabled"
  | "frozen"
  | "outsideWindow"
  | "backToBack"
  | "owedUnderProtection";

export const UNTRADEABLE_LABEL: Record<UntradeableReason, string> = {
  used: "Used",
  leagueDisabled: "Trading off",
  frozen: "Frozen",
  outsideWindow: "Outside window",
  backToBack: "Back-to-back",
  owedUnderProtection: "Owed",
};

export type PickHistoryEntry = {
  id: number;
  fromTeam: Pick<TeamRef, "id" | "name" | "abbr"> | null;
  toTeam: Pick<TeamRef, "id" | "name" | "abbr">;
  reason: string | null;
  tradeId: number | null;
  at: string;
};

export type DraftPick = {
  id: number;
  seasonStartYear: number;
  /** "2026-2027", built on the server so one place decides the form. */
  year: string;
  round: number;
  roundLabel: string;

  currentTeam: TeamRef;
  originalTeam: TeamRef;
  isTraded: boolean;

  status: "Protected" | "Unprotected";
  protectedTopN: number | null;
  protectionOutcome: PickProtectionOutcome | null;
  protectionFinalYear: number | null;
  convertsToPickId: number | null;
  owedToTeam: Pick<TeamRef, "id" | "name" | "abbr"> | null;

  isFrozen: boolean;
  frozenInSeason: number | null;
  movedToEndOfRound: boolean;

  note: string | null;
  usedAt: string | null;

  isTradeable: boolean;
  untradeableReason: UntradeableReason | null;
  untradeableMessage: string | null;

  history: PickHistoryEntry[];
};

export type DraftPickYear = {
  seasonStartYear: number;
  label: string;
  inTradingWindow: boolean;
  picks: DraftPick[];
};

export type DraftPickInventory = {
  currentSeasonStartYear: number;
  /** Rule 12.1 — how many drafts ahead picks may be traded. */
  windowDrafts: number;
  allowDraftPickTrading: boolean;
  teams: TeamRef[];
  years: DraftPickYear[];
};

export type GeneratePicksResult = {
  created: number;
  alreadyPresent: number;
  rounds: number;
  teamCount: number;
  years: { seasonStartYear: number; label: string }[];
};

/** Rule 12.4 — what the commissioner has to place by hand. */
export type OrderFlag = {
  pickId: number;
  seasonStartYear: number;
  round: number;
  kind: "frozenToEndOfRound" | "protected";
  message: string;
};

export type DraftOrderSlot = {
  id: number;
  round: number;
  pickInRound: number;
  overall: number;
  /** Who picks here — the current holder of the pick. */
  team: TeamRef;
  /** Whose seat it is. The same team until the pick is traded. */
  originalTeam: TeamRef;
  isTraded: boolean;
  isFrozen: boolean;
  protectedTopN: number | null;
  draftPickId: number | null;
  player: { id: number; name: string; position: string | null } | null;
  pickedAt: string | null;
};

export type DraftTeam = TeamRef & { ownerName: string | null };

export type DraftSettings = {
  id: number;
  kind: DraftKind;
  seasonStartYear: number;
  yearLabel: string;

  rounds: number;
  format: DraftFormat;
  snakeOrder: boolean;
  reversalRound: number;

  startsAt: string | null;
  timezone: string | null;
  pickSeconds: number;
  autoSetOrder: boolean;
  status: DraftStatus;

  teams: DraftTeam[];
  order: DraftOrderSlot[];
  flags: OrderFlag[];

  pool: {
    total: number;
    drafted: number;
    available: number;
    contractSource: string;
    /** False until the contract endpoints are synced, so the column stays empty. */
    contractsAvailable: boolean;
  };
};

export type PoolPlayer = {
  id: number;
  name: string;
  position: string | null;
  /** Null until a Super Admin has imported the birthdate. */
  age: number | null;
  nbaTeam: { id: number; abbreviation: string; name: string } | null;
  draftYear: number | null;
  draftRound: number | null;
  draftNumber: number | null;
  yearsOfService: number | null;
  headshot: string | null;
  takenBy: { id: number; abbr: string } | null;
  contract: string | null;
  /** Last completed season. Null before any lines have been synced. */
  stats: PoolSeasonAverage | null;
};

export type PoolSeasonAverage = {
  season: number;
  gamesPlayed: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  threes: number;
  /** Whole percent — season makes over season attempts. */
  fgPct: number;
  ftPct: number;
};

export type DraftPool = {
  page: number;
  limit: number;
  total: number;
  /** The season the `stats` on each row belong to. Null before a backfill. */
  statsSeason: number | null;
  players: PoolPlayer[];
};

export const draftApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    draftPicks: builder.query<DraftPickInventory, number>({
      query: (leagueId) => `/leagues/${leagueId}/draft-picks`,
      transformResponse: (r: ApiResponse<DraftPickInventory>) => unwrap(r),
      providesTags: ["DraftPicks"],
    }),

    generateDraftPicks: builder.mutation<
      GeneratePicksResult,
      { leagueId: number; rounds?: number }
    >({
      query: ({ leagueId, rounds }) => ({
        url: `/leagues/${leagueId}/draft-picks/generate`,
        method: "POST",
        body: { rounds },
      }),
      transformResponse: (r: ApiResponse<GeneratePicksResult>) => unwrap(r),
      invalidatesTags: ["DraftPicks", "Draft"],
    }),

    // Both pick writes answer with the whole inventory, so the page never has
    // to merge a single row back into the list it is showing.
    reassignDraftPick: builder.mutation<
      DraftPickInventory,
      { leagueId: number; pickId: number; toTeamId: number; reason?: string }
    >({
      query: ({ leagueId, pickId, toTeamId, reason }) => ({
        url: `/leagues/${leagueId}/draft-picks/${pickId}/reassign`,
        method: "PATCH",
        body: { toTeamId, reason },
      }),
      transformResponse: (r: ApiResponse<DraftPickInventory>) => unwrap(r),
      invalidatesTags: ["DraftPicks"],
    }),

    updateDraftPick: builder.mutation<
      DraftPickInventory,
      {
        leagueId: number;
        pickId: number;
        protectedTopN: number | null;
        protectionOutcome?: PickProtectionOutcome | null;
        protectionFinalYear?: number | null;
        convertsToPickId?: number | null;
        owedToTeamId?: number | null;
        /** Rule 8.13 — place a frozen pick at the end of the first round. */
        movedToEndOfRound?: boolean;
        note?: string;
      }
    >({
      query: ({ leagueId, pickId, ...body }) => ({
        url: `/leagues/${leagueId}/draft-picks/${pickId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<DraftPickInventory>) => unwrap(r),
      invalidatesTags: ["DraftPicks"],
    }),

    draft: builder.query<DraftSettings, { leagueId: number; kind: DraftKind }>({
      query: ({ leagueId, kind }) => `/leagues/${leagueId}/drafts/${kind}`,
      transformResponse: (r: ApiResponse<DraftSettings>) => unwrap(r),
      providesTags: ["Draft"],
    }),

    updateDraft: builder.mutation<
      DraftSettings,
      {
        leagueId: number;
        kind: DraftKind;
        rounds?: number;
        snakeOrder?: boolean;
        reversalRound?: number;
        startsAt?: string | null;
        timezone?: string;
        pickSeconds?: number;
        autoSetOrder?: boolean;
        status?: DraftStatus;
      }
    >({
      query: ({ leagueId, kind, ...body }) => ({
        url: `/leagues/${leagueId}/drafts/${kind}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (r: ApiResponse<DraftSettings>) => unwrap(r),
      invalidatesTags: ["Draft"],
    }),

    setDraftOrder: builder.mutation<
      DraftSettings,
      {
        leagueId: number;
        kind: DraftKind;
        order: {
          round: number;
          pickInRound: number;
          overall: number;
          teamId: number;
          draftPickId?: number | null;
        }[];
      }
    >({
      query: ({ leagueId, kind, order }) => ({
        url: `/leagues/${leagueId}/drafts/${kind}/order`,
        method: "PUT",
        body: { order },
      }),
      transformResponse: (r: ApiResponse<DraftSettings>) => unwrap(r),
      invalidatesTags: ["Draft"],
    }),

    buildDraftOrder: builder.mutation<
      DraftSettings,
      { leagueId: number; kind: DraftKind; randomize?: boolean }
    >({
      query: ({ leagueId, kind, randomize }) => ({
        url: `/leagues/${leagueId}/drafts/${kind}/order/build${
          randomize ? "?randomize=true" : ""
        }`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<DraftSettings>) => unwrap(r),
      invalidatesTags: ["Draft"],
    }),

    draftPool: builder.query<
      DraftPool,
      {
        leagueId: number;
        kind: DraftKind;
        search?: string;
        page?: number;
        limit?: number;
      }
    >({
      query: ({ leagueId, kind, search, page, limit }) => ({
        url: `/leagues/${leagueId}/drafts/${kind}/pool`,
        params: { search: search || undefined, page, limit },
      }),
      transformResponse: (r: ApiResponse<DraftPool>) => unwrap(r),
      providesTags: ["DraftPool"],
    }),
  }),
});

export const {
  useDraftPicksQuery,
  useGenerateDraftPicksMutation,
  useReassignDraftPickMutation,
  useUpdateDraftPickMutation,
  useDraftQuery,
  useUpdateDraftMutation,
  useSetDraftOrderMutation,
  useBuildDraftOrderMutation,
  useDraftPoolQuery,
} = draftApi;
