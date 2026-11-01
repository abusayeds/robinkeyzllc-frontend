import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type TeamRole = "owner" | "coOwner";

export const TEAM_ROLE_LABEL: Record<TeamRole, string> = {
  owner: "Owner",
  coOwner: "Co-Owner",
};

export type TeamHolder = {
  userId: number;
  name: string;
  email: string;
  image: string | null;
  role: TeamRole;
};

export type Team = {
  id: number;
  leagueId: number;
  name: string;
  abbr: string;
  color: string;
  logo: string | null;
  owner: TeamHolder | null;
  coOwner: TeamHolder | null;
  createdAt: string;
};

export type TeamList = {
  teamCount: number;
  maxRosterSize: number;
  teams: Team[];
};

export type TeamInput = {
  name: string;
  abbr: string;
  color?: string;
  logo?: string | null;
};

export const DEFAULT_TEAM_COLOR = "#2563EB";

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    leagueTeams: builder.query<TeamList, number>({
      query: (leagueId) => `/leagues/${leagueId}/teams`,
      transformResponse: (r: ApiResponse<TeamList>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "Teams" as const, id: leagueId },
      ],
    }),

    createTeam: builder.mutation<Team, { leagueId: number; team: TeamInput }>({
      query: ({ leagueId, team }) => ({
        url: `/leagues/${leagueId}/teams`,
        method: "POST",
        body: team,
      }),
      transformResponse: (r: ApiResponse<Team>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Teams" as const, id: leagueId },
      ],
    }),

    updateTeam: builder.mutation<
      Team,
      { leagueId: number; teamId: number; patch: Partial<TeamInput> }
    >({
      query: ({ leagueId, teamId, patch }) => ({
        url: `/leagues/${leagueId}/teams/${teamId}`,
        method: "PATCH",
        body: patch,
      }),
      transformResponse: (r: ApiResponse<Team>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Teams" as const, id: leagueId },
      ],
    }),

    deleteTeam: builder.mutation<
      { id: number; name: string },
      { leagueId: number; teamId: number }
    >({
      query: ({ leagueId, teamId }) => ({
        url: `/leagues/${leagueId}/teams/${teamId}`,
        method: "DELETE",
      }),
      transformResponse: (r: ApiResponse<{ id: number; name: string }>) =>
        unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Teams" as const, id: leagueId },
        { type: "LeagueMembers" as const, id: leagueId },
        // Deleting a team takes its owner's franchise with it.
        "Leagues",
      ],
    }),

    // One call covers assigning an empty team and reassigning a taken one,
    // which is why the UI can offer a single Assign / Reassign action.
    assignTeamMember: builder.mutation<
      Team,
      { leagueId: number; teamId: number; userId: number; role: TeamRole }
    >({
      query: ({ leagueId, teamId, userId, role }) => ({
        url: `/leagues/${leagueId}/teams/${teamId}/${
          role === "owner" ? "owner" : "co-owner"
        }`,
        method: "PUT",
        body: { userId },
      }),
      transformResponse: (r: ApiResponse<Team>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Teams" as const, id: leagueId },
        // hasTeam on the member list moves with this.
        { type: "LeagueMembers" as const, id: leagueId },
        // So does the My Team section on Avora Home.
        "Leagues",
      ],
    }),

    removeTeamMember: builder.mutation<
      Team,
      { leagueId: number; teamId: number; role: TeamRole }
    >({
      query: ({ leagueId, teamId, role }) => ({
        url: `/leagues/${leagueId}/teams/${teamId}/${
          role === "owner" ? "owner" : "co-owner"
        }`,
        method: "DELETE",
      }),
      transformResponse: (r: ApiResponse<Team>) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Teams" as const, id: leagueId },
        { type: "LeagueMembers" as const, id: leagueId },
        "Leagues",
      ],
    }),
  }),
});

export const {
  useLeagueTeamsQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAssignTeamMemberMutation,
  useRemoveTeamMemberMutation,
} = teamApi;
