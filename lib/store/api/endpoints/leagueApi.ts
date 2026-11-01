import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type ScoringType = "headToHead9Cat";
export type DraftType = "snake";
export type LeagueVisibility = "private" | "public";
export type ApiLeagueRole = "commissioner" | "coCommissioner" | "member";
export type UiLeagueRole = "Team Owner" | "Commissioner";

export const SCORING_TYPE_LABEL: Record<ScoringType, string> = {
  headToHead9Cat: "Head to Head 9 Category",
};

export const DRAFT_TYPE_LABEL: Record<DraftType, string> = {
  snake: "Snake",
};

export const VISIBILITY_LABEL: Record<LeagueVisibility, string> = {
  private: "Private",
  public: "Public",
};

export type ApiLeague = {
  id: number;
  name: string;
  logo: string | null;
  teamCount: number;
  season: string;
  scoringType: ScoringType;
  draftType: DraftType;
  visibility: LeagueVisibility;
  leagueRole: ApiLeagueRole;
  roles: UiLeagueRole[];
  team: {
    id: number;
    name: string;
    logo: string | null;
    role: "owner" | "coOwner";
  } | null;
  createdAt: string;
};

/** A league the user can manage, so it belongs under My Leagues. */
export const managesLeague = (league: ApiLeague) =>
  league.leagueRole === "commissioner" ||
  league.leagueRole === "coCommissioner";

export type CreateLeagueBody = {
  name: string;
  logo?: string;
  teamCount?: number;
  scoringType?: ScoringType;
  draftType?: DraftType;
  visibility?: LeagueVisibility;
};

export const leagueApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    myLeagues: builder.query<ApiLeague[], void>({
      query: () => "/leagues/my",
      transformResponse: (response: ApiResponse<ApiLeague[]>) =>
        unwrap(response) ?? [],
      providesTags: ["Leagues"],
    }),

    createLeague: builder.mutation<ApiLeague, CreateLeagueBody>({
      query: (body) => ({ url: "/leagues", method: "POST", body }),
      transformResponse: (response: ApiResponse<ApiLeague>) =>
        unwrap(response),
      invalidatesTags: ["Leagues"],
    }),
  }),
});

export const { useMyLeaguesQuery, useCreateLeagueMutation } = leagueApi;
