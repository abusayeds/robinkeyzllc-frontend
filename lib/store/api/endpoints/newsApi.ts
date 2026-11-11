import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

/**
 * Seven categories, four sources, nothing written by hand.
 *
 * Trade / Signing / Waiver / Draft come from the transactions feed, Injury
 * from the nightly balldontlie pull, Commissioner from announcements sent to
 * the league, and League Update from the league calendar.
 */
export type NewsCategory =
  | "Trade"
  | "Signing"
  | "Waiver"
  | "Injury"
  | "Commissioner"
  | "Draft"
  | "League Update";

export type NewsArticle = {
  id: string;
  category: NewsCategory;
  headline: string;
  excerpt: string;
  body: string;
  timestamp: string;
  tags: string[];
  teams: string[];
  players: string[];
  /** An injury, or a date running right now. */
  alert: boolean;
};

export type LeagueNews = {
  league: { id: number; name: string; season: string };
  myTeamId: number | null;
  articles: NewsArticle[];
  counts: Partial<Record<NewsCategory, number>>;
};

export const newsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueNews: builder.query<LeagueNews, { leagueId: number }>({
      query: ({ leagueId }) => `/leagues/${leagueId}/news`,
      transformResponse: (r: ApiResponse<LeagueNews>) => unwrap(r),
      // Every source is written by something that already invalidates one of
      // these, so no new tag has to be minted.
      providesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
        { type: "Rosters" as const, id: leagueId },
        { type: "Calendar" as const, id: leagueId },
        { type: "Notifications" as const },
      ],
    }),
  }),
});

export const { useLeagueNewsQuery } = newsApi;
