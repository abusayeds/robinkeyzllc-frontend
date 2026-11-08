import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type TransactionType =
  | "Trade Accepted"
  | "Player Signed"
  | "Free Agent Signed"
  | "Player Waived"
  | "Draft Pick Traded";

/** The page's tabs group the types; a type belongs to exactly one. */
export type TransactionCategory = "Trades" | "Signings" | "Waivers";

export type TransactionItem = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  /** "Celtics ↔ Hawks" for a trade, one team's name otherwise. */
  teams: string | null;
  description: string;
  date: string;
  /** Whether the viewer's own team is in it. */
  mine: boolean;
  teamIds: number[];
};

export type LeagueTransactions = {
  /** Null when the viewer holds no team, which hides the "mine" filter. */
  myTeamId: number | null;
  transactions: TransactionItem[];
};

export const transactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueTransactions: builder.query<
      LeagueTransactions,
      { leagueId: number; take?: number }
    >({
      query: ({ leagueId, take }) =>
        `/leagues/${leagueId}/transactions${take ? `?take=${take}` : ""}`,
      transformResponse: (r: ApiResponse<LeagueTransactions>) => unwrap(r),
      // Everything in the feed is written by a trade, a signing, a waive or a
      // pick move, and each of those already invalidates one of these.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
        { type: "Rosters" as const, id: leagueId },
        { type: "DraftPicks" as const },
      ],
    }),
  }),
});

export const { useLeagueTransactionsQuery } = transactionsApi;
