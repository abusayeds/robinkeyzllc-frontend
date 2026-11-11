import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

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

export type TradeCheck = {
  /** Null for a rule about the whole trade rather than one team. */
  teamId: number | null;
  label: string;
  pass: boolean;
  detail?: string;
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
  expiresAt: string;
  team: { id: number; name: string; abbr: string };
};

export type ProposeTradeInput = {
  assets: {
    kind: TradeAssetKind;
    fromTeamId: number;
    toTeamId: number;
    leaguePlayerId?: number;
    tradeExceptionId?: number;
    draftPickId?: number;
  }[];
  message?: string;
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
  }),
});

export const {
  useLeagueTradesQuery,
  useTradeExceptionsQuery,
  useProposeTradeMutation,
  useRespondToTradeMutation,
  useWithdrawTradeMutation,
  useApproveTradeMutation,
  useRejectTradeMutation,
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
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Rosters" as const, id: leagueId },
        { type: "Salaries" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useTradeFinderQuery } = tradeFinderApi;
