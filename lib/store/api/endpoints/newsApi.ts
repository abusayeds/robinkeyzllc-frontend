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

/** The transaction a Breaking News post is about. */
export type NewsItemType =
  | "trade"
  | "signing"
  | "extension"
  | "waiver"
  | "claim"
  | "offerSheet"
  | "draftPick"
  | "veto";

/** Reserved: every post is standard until tiers like Blockbuster arrive. */
export type NewsItemTier = "standard" | "blockbuster";

export type NewsPlayer = {
  name: string;
  position: string | null;
  salary: number | null;
  /** The last season of his deal, e.g. 2028. */
  throughSeasonStartYear: number | null;
};

export type NewsPick = {
  label: string;
  originalTeamAbbr: string | null;
};

export type NewsTeamLeg = {
  teamId: number;
  name: string;
  abbr: string;
  logo: string | null;
  /** What this team received. */
  players: NewsPlayer[];
  picks: NewsPick[];
  /** Null when the figures were not available when the post was written. */
  capBefore: number | null;
  capAfter: number | null;
  capSpaceAfter: number | null;
};

export type NewsPayload = {
  teams: NewsTeamLeg[];
  summary: string | null;
  status: string | null;
};

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
  /**
   * Set on a transaction post, which carries the Breaking News label and a
   * laid-out detail. An injury or a calendar date has none.
   */
  breaking: {
    itemId: number;
    type: NewsItemType;
    tier: NewsItemTier;
    payload: NewsPayload;
  } | null;
};

export type NewsItemDetail = {
  id: number;
  type: NewsItemType;
  tier: NewsItemTier;
  headline: string;
  autoHeadline: string;
  customHeadline: string | null;
  category: NewsCategory;
  excerpt: string;
  payload: NewsPayload;
  createdAt: string;
  previous: { id: number; headline: string } | null;
  next: { id: number; headline: string } | null;
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
    newsItem: builder.query<NewsItemDetail, { leagueId: number; itemId: number }>(
      {
        query: ({ leagueId, itemId }) =>
          `/leagues/${leagueId}/news/${itemId}`,
        transformResponse: (r: ApiResponse<NewsItemDetail>) => unwrap(r),
        providesTags: (_result, _error, { leagueId }) => [
          { type: "Trades" as const, id: leagueId },
        ],
      },
    ),

    setNewsHeadline: builder.mutation<
      NewsItemDetail,
      { leagueId: number; itemId: number; headline: string | null }
    >({
      query: ({ leagueId, itemId, headline }) => ({
        url: `/leagues/${leagueId}/news/${itemId}/headline`,
        method: "PATCH",
        body: { headline: headline ?? undefined },
      }),
      transformResponse: (r: ApiResponse<NewsItemDetail>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Trades" as const, id: leagueId },
      ],
    }),
  }),
});

export const {
  useLeagueNewsQuery,
  useNewsItemQuery,
  useSetNewsHeadlineMutation,
} = newsApi;
