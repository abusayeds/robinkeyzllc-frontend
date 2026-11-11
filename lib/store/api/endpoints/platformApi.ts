import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

/**
 * Super Admin views. These are platform-wide, so none of them is scoped to a
 * league and none of them goes through the league guard.
 */

export type LeagueStatus = "Active" | "Draft" | "Archived";

export type PlatformLeague = {
  id: number;
  name: string;
  logo: string | null;
  season: string;
  visibility: "private" | "public";
  /** The limit the commissioner chose, against which `teams` is counted. */
  teamCount: number;
  teams: number;
  members: number;
  players: number;
  commissioner: { id: number; name: string; email: string } | null;
  status: LeagueStatus;
  createdAt: string;
};

export type PlatformUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  /** The platform role. A league role lives on the membership, not here. */
  role: "user" | "superAdmin";
  isEmailVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  /** How many leagues they belong to. */
  leagues: number;
  /** The strongest role they hold in any league. */
  leagueRole: "Commissioner" | "Co-Commissioner" | "Owner" | "Member";
};

export type Pagination = {
  page: number;
  limit: number;
  totalPage: number;
  totalItem: number;
};

export type PlatformUserList = {
  users: PlatformUser[];
  pagination: Pagination | null;
};

export const platformApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    platformLeagues: builder.query<PlatformLeague[], void>({
      query: () => "/leagues/all",
      transformResponse: (r: ApiResponse<PlatformLeague[]>) => unwrap(r),
      providesTags: ["Leagues"],
    }),

    /**
     * The user list is paginated and searched on the server, so the page sends
     * its query rather than filtering a full download.
     */
    platformUsers: builder.query<
      PlatformUserList,
      { page?: number; limit?: number; searchTerm?: string }
    >({
      query: ({ page = 1, limit = 20, searchTerm }) => {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(limit));
        if (searchTerm?.trim()) params.set("searchTerm", searchTerm.trim());
        return `/users/all-user?${params.toString()}`;
      },
      // The envelope carries `pagination` beside `data`, which `unwrap` drops,
      // so both are read here.
      transformResponse: (
        r: ApiResponse<PlatformUser[]> & { pagination?: Pagination },
      ) => ({
        users: unwrap(r),
        pagination: r.pagination ?? null,
      }),
      providesTags: ["Users"],
    }),

    deletePlatformUser: builder.mutation<{ id: number }, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      transformResponse: (r: ApiResponse<{ id: number }>) => unwrap(r),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  usePlatformLeaguesQuery,
  usePlatformUsersQuery,
  useDeletePlatformUserMutation,
} = platformApi;

export type PlatformStats = {
  totalLeagues: number;
  activeLeagues: number;
  archivedLeagues: number;
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  /** Distinct people, not memberships. */
  commissioners: number;
  newThisMonth: number;
};

export type SeriesPoint = { label: string; value: number };

export type RecentLeague = {
  id: number;
  name: string;
  owner: string;
  teams: number;
  teamCount: number;
  status: LeagueStatus;
  createdAt: string;
};

export type RecentUser = {
  id: number;
  name: string;
  image: string | null;
  createdAt: string;
  role: "Commissioner" | "Owner" | "Member";
};

export type PlatformOverview = {
  stats: PlatformStats;
  /** Cumulative leagues, twelve months. */
  growth: SeriesPoint[];
  /** New users per month, six months. */
  signups: SeriesPoint[];
  recentLeagues: RecentLeague[];
  recentUsers: RecentUser[];
};

export const platformOverviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    platformOverview: builder.query<PlatformOverview, void>({
      query: () => "/platform/overview",
      transformResponse: (r: ApiResponse<PlatformOverview>) => unwrap(r),
      providesTags: ["Leagues", "Users"],
    }),
  }),
});

export const { usePlatformOverviewQuery } = platformOverviewApi;
