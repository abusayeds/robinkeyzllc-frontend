import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export const LEAGUE_CONTENT_TYPES = [
  "help",
  "privacy",
  "terms",
  "about",
] as const;

export type LeagueContentType = (typeof LEAGUE_CONTENT_TYPES)[number];

export const LEAGUE_CONTENT_LABEL: Record<LeagueContentType, string> = {
  help: "Help & Support",
  privacy: "Privacy Policy",
  terms: "Term & Conditions",
  about: "About Us",
};

/** Where the text shown actually came from. */
export type LeagueContentSource = "league" | "platform" | null;

export type LeagueContentEntry = {
  type: LeagueContentType;
  description: string;
  source: LeagueContentSource;
  updatedAt: string | null;
  updatedBy: { id: number; name: string } | null;
};

export const leagueContentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueContent: builder.query<LeagueContentEntry[], number>({
      query: (leagueId) => `/management/league/${leagueId}`,
      transformResponse: (r: ApiResponse<LeagueContentEntry[]>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "LeagueContent" as const, id: leagueId },
      ],
    }),

    saveLeagueContent: builder.mutation<
      LeagueContentEntry,
      { leagueId: number; type: LeagueContentType; description: string }
    >({
      query: ({ leagueId, type, description }) => ({
        url: `/management/league/${leagueId}/${type}`,
        method: "PUT",
        body: { description },
      }),
      transformResponse: (r: ApiResponse<LeagueContentEntry>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "LeagueContent" as const, id: leagueId },
      ],
    }),
  }),
});

export const { useLeagueContentQuery, useSaveLeagueContentMutation } =
  leagueContentApi;
