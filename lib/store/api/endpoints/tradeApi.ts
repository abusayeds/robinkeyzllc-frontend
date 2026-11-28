import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";
import type { Tier } from "./salaryApi";

export type TradeStatus =
  | "proposed"
  | "accepted"
  | "awaitingApproval"
  | "approved"
  | "rejected"
  | "declined"
  | "withdrawn"
  | "processed";

export type TradeResponse = "pending" | "accepted" | "declined";
export type TradeAssetKind = "player" | "tradeException" | "draftPick";

export const TRADE_STATUS_LABEL: Record<TradeStatus, string> = {
  proposed: "Awaiting replies",
  accepted: "Accepted",
  awaitingApproval: "Awaiting approval",
  approved: "Approved",
  rejected: "Rejected",
  declined: "Declined",
  withdrawn: "Withdrawn",
  processed: "Processed",
};

export const TRADE_STATUS_TONE: Record<TradeStatus, string> = {
  proposed: "bg-amber-100 text-amber-700",
  accepted: "bg-brand-cta/15 text-brand-cta-dark",
  awaitingApproval: "bg-orange-100 text-orange-700",
  approved: "bg-brand-cta/15 text-brand-cta-dark",
  rejected: "bg-red-100 text-red-600",
  declined: "bg-red-100 text-red-600",
  withdrawn: "bg-brand-soft text-brand-muted",
  processed: "bg-brand-cta/15 text-brand-cta-dark",
};

/**
 * How loudly a result is shown. `blocking` stops the trade, `headsUp` is a
 * consequence worth knowing before submitting (a hard cap bought, a tier
 * crossed) and `passed` is collapsed out of the way.
 */
export type CheckSeverity = "blocking" | "headsUp" | "passed";

export type TradeCheck = {
  /** Null for a rule about the whole trade rather than one team. */
  teamId: number | null;
  teamAbbr: string | null;
  /** Stable across requests, so the list can be grouped and de-duplicated. */
  code: string;
  label: string;
  pass: boolean;
  severity: CheckSeverity;
  detail?: string;
  /** The rule that applied and its arithmetic, on one line. */
  math?: string;
  /** One or two ways out, with exact amounts. Only on blocking issues. */
  toFix?: string[];
};

export type TradeTeamImpact = {
  teamId: number;
  team: {
    id: number;
    name: string;
    abbr: string;
    color: string;
    logo: string | null;
  };
  response: TradeResponse;
  respondedAt: string | null;
  respondedBy: { id: number; name: string } | null;
  outgoing: number;
  incoming: number;
  net: number;
  playersOut: number;
  playersIn: number;
};

export type TradeAsset = {
  id: number;
  kind: TradeAssetKind;
  fromTeamId: number;
  toTeamId: number;
  salary: number;
  player: {
    leaguePlayerId: number;
    id: number;
    name: string;
    position: string | null;
  } | null;
  exception: { id: number; label: string; remaining: number } | null;
  /** Article 12 — a future pick is an asset in its own right here. */
  pick: {
    id: number;
    seasonStartYear: number;
    round: number;
    /** "2028 1st", built on the server so both sides read it the same way. */
    label: string;
    protectedTopN: number | null;
    originalTeam: { id: number; abbr: string };
    /** Rules 12.5-12.7 — the terms this trade set, in one sentence. */
    protection: {
      topN: number;
      outcome: ProtectionOutcome | null;
      finalYear: number | null;
      label: string;
    } | null;
    protectionNote: string | null;
  } | null;
};

export type Trade = {
  id: number;
  status: TradeStatus;
  requiresApproval: boolean;
  message: string | null;
  rejectedReason: string | null;
  proposedBy: { id: number; name: string } | null;
  approvedBy: { id: number; name: string } | null;
  approvedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  checks: TradeCheck[];
  isLegal: boolean;
  teams: TradeTeamImpact[];
  assets: TradeAsset[];
};

export type TradeExceptionRow = {
  id: number;
  label: string;
  amount: number;
  remaining: number;
  /** Rule 7.3 — earned here, and expires a year later. */
  createdAt: string;
  expiresAt: string;
  team: { id: number; name: string; abbr: string };
};

/** Rule 12.6 — what happens in the year a protection holds. */
export type ProtectionOutcome = "rollover" | "convert" | "end";

export type ProposeTradeInput = {
  assets: {
    kind: TradeAssetKind;
    fromTeamId: number;
    toTeamId: number;
    leaguePlayerId?: number;
    tradeExceptionId?: number;
    draftPickId?: number;
    // Rules 12.5-12.7 — the terms agreed on a pick. Only ever set on a pick,
    // and the server refuses a protection with no outcome.
    protectedTopN?: number;
    protectionOutcome?: ProtectionOutcome;
    protectionFinalYear?: number;
    protectionNote?: string;
  }[];
  message?: string;
};

/** One cap threshold measured against where a team lands after the trade. */
export type CapLine = {
  label: string;
  threshold: number;
  difference: number;
  isOver: boolean;
};

export type EvaluatedTeam = {
  teamId: number;
  teamName: string;
  teamAbbr: string | null;
  /** "Celtics" out of "Boston Celtics" — what the rule lines call the team. */
  shortName: string;
  tier: Tier;
  tierLabel: string;
  /** The card leads with the move, so it carries both ends of it. */
  tierBefore: Tier;
  tierBeforeLabel: string;
  tierChanged: boolean;
  playersIn: number;
  playersOut: number;
  incoming: number;
  outgoing: number;
  salaryBefore: number;
  salaryAfter: number;
  /** Net salary was the same number under another name, so only this is sent. */
  capImpact: number;
  rosterBefore: number;
  rosterAfter: number;
  maxRosterSize: number;
  rosterMinimum: number;
  /** Rule 4.9 — the two-way pool, which holds none of the standard spots. */
  twoWayBefore: number;
  twoWayAfter: number;
  maxTwoWay: number;
  lines: CapLine[];
  /** Rule 5 — the most this team may take back, when salary matching is on. */
  maxIncoming: number | null;
  /** The rule that set the limit, e.g. "Taxpayer rule". */
  maxIncomingRule: string | null;
  /** Its arithmetic, e.g. "110% of $7,767,857 + $100,000 = $8,644,642". */
  maxIncomingFormula: string | null;
  hardCap: { label: string; amount: number; trigger: string } | null;
};

export type TradeEvaluation = {
  isLegal: boolean;
  capIsSet: boolean;
  salaryMatching: boolean;
  apronRules: boolean;
  deadlinePassed: boolean;
  deadlineLabel: string | null;
  checks: TradeCheck[];
  teams: EvaluatedTeam[];
};

export type EvaluateTradeInput = {
  teamIds: number[];
  assets: ProposeTradeInput["assets"];
};

export type TradeBlockEntry = {
  id: number;
  note: string | null;
  listedAt: string;
  team: {
    id: number;
    name: string;
    abbr: string;
    color: string;
    logo: string | null;
  };
  leaguePlayerId: number;
  playerId: number;
  name: string;
  position: string | null;
  headshot: string | null;
  nbaTeam: string | null;
  birdYears: number;
  contractType: string | null;
  yearsLeft: number | null;
  capHit: number | null;
};

export type TradeBlock = {
  myTeamId: number | null;
  seasonStartYear: number;
  entries: TradeBlockEntry[];
};

/** Everything a processed trade touches, so its tags can be written once. */
const SETTLED_TAGS = (leagueId: number) => [
  { type: "Trades" as const, id: leagueId },
  { type: "Rosters" as const, id: leagueId },
  { type: "Salaries" as const, id: leagueId },
  { type: "Overview" as const, id: leagueId },
];

export const tradeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueTrades: builder.query<
      Trade[],
      { leagueId: number; status?: TradeStatus; teamId?: number }
    >({
      query: ({ leagueId, status, teamId }) => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (teamId) params.set("teamId", String(teamId));
        const qs = params.toString();
        return `/leagues/${leagueId}/trades${qs ? `?${qs}` : ""}`;
      },
      transformResponse: (r: ApiResponse<Trade[]>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),

    // One trade, judged again as it is read: a detail opened tomorrow has to
    // answer against tomorrow's rosters, not the ones the proposal saw.
    trade: builder.query<
      Trade & { evaluation: TradeEvaluation | null },
      { leagueId: number; tradeId: number }
    >({
      query: ({ leagueId, tradeId }) =>
        `/leagues/${leagueId}/trades/${tradeId}`,
      transformResponse: (
        r: ApiResponse<Trade & { evaluation: TradeEvaluation | null }>,
      ) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),

    tradeExceptions: builder.query<
      TradeExceptionRow[],
      { leagueId: number; teamId?: number }
    >({
      query: ({ leagueId, teamId }) =>
        teamId
          ? `/leagues/${leagueId}/trades/exceptions?teamId=${teamId}`
          : `/leagues/${leagueId}/trades/exceptions`,
      transformResponse: (r: ApiResponse<TradeExceptionRow[]>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),

    /**
     * A commissioner records an exception the app did not create itself.
     *
     * Article 7 writes one out of every trade processed here. This is for one
     * that came from somewhere else — a league carried over, or a deal settled
     * off the record — which otherwise could not be entered at all.
     */
    createTradeException: builder.mutation<
      TradeExceptionRow,
      {
        leagueId: number;
        teamId: number;
        amount: number;
        remaining?: number;
        expiresAt?: string;
        label?: string;
      }
    >({
      query: ({ leagueId, ...body }) => ({
        url: `/leagues/${leagueId}/trades/exceptions`,
        method: "POST",
        body,
      }),
      transformResponse: (r: ApiResponse<TradeExceptionRow>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
      ],
    }),

    /** Retires one. Deactivated, never deleted: a past trade may point at it. */
    retireTradeException: builder.mutation<
      { id: number; isActive: boolean },
      { leagueId: number; exceptionId: number }
    >({
      query: ({ leagueId, exceptionId }) => ({
        url: `/leagues/${leagueId}/trades/exceptions/${exceptionId}`,
        method: "DELETE",
      }),
      transformResponse: (r: ApiResponse<{ id: number; isActive: boolean }>) =>
        unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
      ],
    }),

    proposeTrade: builder.mutation<
      Trade,
      { leagueId: number; trade: ProposeTradeInput }
    >({
      query: ({ leagueId, trade }) => ({
        url: `/leagues/${leagueId}/trades`,
        method: "POST",
        body: trade,
      }),
      transformResponse: (r: ApiResponse<Trade>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),

    respondToTrade: builder.mutation<
      Trade,
      { leagueId: number; tradeId: number; teamId: number; accept: boolean }
    >({
      query: ({ leagueId, tradeId, teamId, accept }) => ({
        url: `/leagues/${leagueId}/trades/${tradeId}/teams/${teamId}/${accept ? "accept" : "decline"}`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<Trade>) => unwrap(r),
      // Accepting the last outstanding reply can process the trade outright
      // when the league does not require approval, so this invalidates
      // everything a settled trade touches.
      invalidatesTags: (_result, _error, { leagueId }) =>
        SETTLED_TAGS(leagueId),
    }),

    withdrawTrade: builder.mutation<
      Trade,
      { leagueId: number; tradeId: number }
    >({
      query: ({ leagueId, tradeId }) => ({
        url: `/leagues/${leagueId}/trades/${tradeId}/withdraw`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<Trade>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),

    approveTrade: builder.mutation<
      Trade,
      { leagueId: number; tradeId: number }
    >({
      query: ({ leagueId, tradeId }) => ({
        url: `/leagues/${leagueId}/trades/${tradeId}/approve`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<Trade>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) =>
        SETTLED_TAGS(leagueId),
    }),

    rejectTrade: builder.mutation<
      Trade,
      { leagueId: number; tradeId: number; reason?: string }
    >({
      query: ({ leagueId, tradeId, reason }) => ({
        url: `/leagues/${leagueId}/trades/${tradeId}/reject`,
        method: "POST",
        body: { reason },
      }),
      transformResponse: (r: ApiResponse<Trade>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),
    /**
     * What the rules say about a trade nobody has sent yet.
     *
     * A mutation rather than a query: it is a POST with a body, and the
     * builder wants the answer for exactly what is on screen now, not a
     * cached answer for something it asked about earlier.
     */
    evaluateTrade: builder.mutation<
      TradeEvaluation,
      { leagueId: number; trade: EvaluateTradeInput }
    >({
      query: ({ leagueId, trade }) => ({
        url: `/leagues/${leagueId}/trades/evaluate`,
        method: "POST",
        body: trade,
      }),
      transformResponse: (r: ApiResponse<TradeEvaluation>) => unwrap(r),
    }),

    tradeBlock: builder.query<TradeBlock, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/trades/block`,
      transformResponse: (r: ApiResponse<TradeBlock>) => unwrap(r),
      providesTags: (_result, _error, { leagueId }) => [
        { type: "TradeBlock" as const, id: leagueId },
      ],
    }),

    listOnTradeBlock: builder.mutation<
      TradeBlock,
      { leagueId: number; leaguePlayerId: number; note?: string }
    >({
      query: ({ leagueId, leaguePlayerId, note }) => ({
        url: `/leagues/${leagueId}/trades/block`,
        method: "POST",
        body: { leaguePlayerId, note },
      }),
      transformResponse: (r: ApiResponse<TradeBlock>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "TradeBlock" as const, id: leagueId },
      ],
    }),

    removeFromTradeBlock: builder.mutation<
      TradeBlock,
      { leagueId: number; leaguePlayerId: number }
    >({
      query: ({ leagueId, leaguePlayerId }) => ({
        url: `/leagues/${leagueId}/trades/block/${leaguePlayerId}`,
        method: "DELETE",
      }),
      transformResponse: (r: ApiResponse<TradeBlock>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "TradeBlock" as const, id: leagueId },
      ],
    }),
  }),
});

export const {
  useLeagueTradesQuery,
  useTradeQuery,
  useTradeExceptionsQuery,
  useCreateTradeExceptionMutation,
  useRetireTradeExceptionMutation,
  useProposeTradeMutation,
  useRespondToTradeMutation,
  useWithdrawTradeMutation,
  useApproveTradeMutation,
  useRejectTradeMutation,
  useEvaluateTradeMutation,
  useTradeBlockQuery,
  useListOnTradeBlockMutation,
  useRemoveFromTradeBlockMutation,
} = tradeApi;

export type FinderStats = {
  season: number;
  gamesPlayed: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  threes: number;
  fgPct: number;
  ftPct: number;
};

export type FinderPlayer = {
  id: number;
  playerId: number;
  name: string;
  position: string | null;
  nbaTeam: string | null;
  headshot: string | null;
  team: { id: number; name: string; abbr: string; logo: string | null } | null;
  /** Null until a Super Admin has imported the birthdate. */
  age: number | null;
  salary: number | null;
  capHit: number | null;
  years: number;
  /** Null when no game lines have been synced for the season. */
  stats: FinderStats | null;
  isMine: boolean;
};

export type TradeFinderListing = {
  seasonStartYear: number;
  /** Which season the averages are from, or null when none exist. */
  statsSeason: number | null;
  myTeamId: number | null;
  players: FinderPlayer[];
};

export const tradeFinderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    tradeFinder: builder.query<TradeFinderListing, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/trades/finder`,
      transformResponse: (r: ApiResponse<TradeFinderListing>) => unwrap(r),
      // TradeBlock too: listing/unlisting must refresh the finder, not only
      // the block tab — otherwise a just-listed player stays invisible.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "TradeBlock" as const, id: leagueId },
        { type: "Rosters" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useTradeFinderQuery } = tradeFinderApi;
