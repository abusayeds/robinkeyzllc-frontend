import { baseApi, unwrap } from "../baseApi";
import type { ApiResponse } from "../types";

export type InviteStatus = "pending" | "accepted" | "declined" | "cancelled";

export const INVITE_STATUS_LABEL: Record<InviteStatus, string> = {
  pending: "Pending",
  accepted: "Joined",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** A row on the commissioner's invite list. */
export type LeagueInvite = {
  id: number;
  status: InviteStatus;
  user: {
    userId: number;
    name: string;
    email: string;
    image: string | null;
  };
  invitedBy: string | null;
  createdAt: string;
  respondedAt: string | null;
};

/** A card on the invited user's Avora Home. */
export type MyInvite = {
  id: number;
  leagueId: number;
  leagueName: string;
  leagueLogo: string | null;
  season: string;
  invitedBy: string | null;
  createdAt: string;
};

export type UserSearchHit = {
  userId: number;
  name: string;
  email: string;
  image: string | null;
  inLeague: boolean;
  invited: boolean;
};

export const inviteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // The invitee is not a league member yet, so the league member list cannot
    // find them — this searches every signed-up user instead.
    searchUsers: builder.query<
      UserSearchHit[],
      { q: string; leagueId?: number }
    >({
      query: ({ q, leagueId }) => ({
        url: "/users/search",
        params: leagueId ? { q, leagueId } : { q },
      }),
      transformResponse: (r: ApiResponse<UserSearchHit[]>) => unwrap(r),
    }),

    leagueInvites: builder.query<LeagueInvite[], number>({
      query: (leagueId) => `/leagues/${leagueId}/invites`,
      transformResponse: (r: ApiResponse<LeagueInvite[]>) => unwrap(r),
      providesTags: (_result, _error, leagueId) => [
        { type: "Invites" as const, id: leagueId },
      ],
    }),

    sendLeagueInvite: builder.mutation<
      { id: number; userId: number; status: InviteStatus },
      { leagueId: number; userId: number }
    >({
      query: ({ leagueId, userId }) => ({
        url: `/leagues/${leagueId}/invites`,
        method: "POST",
        body: { userId },
      }),
      transformResponse: (
        r: ApiResponse<{ id: number; userId: number; status: InviteStatus }>,
      ) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Invites" as const, id: leagueId },
      ],
    }),

    cancelLeagueInvite: builder.mutation<
      { id: number; userId: number; status: InviteStatus },
      { leagueId: number; userId: number }
    >({
      query: ({ leagueId, userId }) => ({
        url: `/leagues/${leagueId}/invites/${userId}`,
        method: "DELETE",
      }),
      transformResponse: (
        r: ApiResponse<{ id: number; userId: number; status: InviteStatus }>,
      ) => unwrap(r),
      invalidatesTags: (_result, _error, { leagueId }) => [
        { type: "Invites" as const, id: leagueId },
      ],
    }),

    myInvites: builder.query<MyInvite[], void>({
      query: () => "/invites/my",
      transformResponse: (r: ApiResponse<MyInvite[]>) => unwrap(r),
      providesTags: ["MyInvites"],
    }),

    acceptInvite: builder.mutation<
      { id: number; leagueId: number; leagueName: string },
      number
    >({
      query: (inviteId) => ({
        url: `/invites/${inviteId}/accept`,
        method: "POST",
      }),
      transformResponse: (
        r: ApiResponse<{ id: number; leagueId: number; leagueName: string }>,
      ) => unwrap(r),
      // Accepting adds a league, so the home page list has to refetch too.
      invalidatesTags: ["MyInvites", "Leagues", "Notifications"],
    }),

    declineInvite: builder.mutation<{ id: number }, number>({
      query: (inviteId) => ({
        url: `/invites/${inviteId}/decline`,
        method: "POST",
      }),
      transformResponse: (r: ApiResponse<{ id: number }>) => unwrap(r),
      invalidatesTags: ["MyInvites", "Notifications"],
    }),
  }),
});

export const {
  useSearchUsersQuery,
  useLeagueInvitesQuery,
  useSendLeagueInviteMutation,
  useCancelLeagueInviteMutation,
  useMyInvitesQuery,
  useAcceptInviteMutation,
  useDeclineInviteMutation,
} = inviteApi;
