import { baseApi, unwrap } from "../baseApi";
import type { ApiPagination, ApiResponse, ListResult } from "../types";

export type NotificationType =
  | "tradeProposal"
  | "freeAgency"
  | "announcement"
  | "lineupReminder"
  | "waiverResult"
  | "leagueInvite"
  | "system";

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  detail: string;
  link: string | null;
  leagueId: number | null;
  unread: boolean;
  createdAt: string;
};

export type NotificationQuery = {
  page?: number;
  limit?: number;
  leagueId?: number;
  unreadOnly?: boolean;
};

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    notifications: builder.query<
      ListResult<AppNotification>,
      NotificationQuery | void
    >({
      query: (params) => ({ url: "/notifications", params: params ?? {} }),
      transformResponse: (
        r: ApiResponse<AppNotification[]> & { pagination?: ApiPagination },
      ) => ({ items: unwrap(r), pagination: r.pagination }),
      providesTags: ["Notifications"],
    }),

    unreadNotificationCount: builder.query<
      { unreadCount: number },
      { leagueId?: number } | void
    >({
      query: (params) => ({
        url: "/notifications/unread-count",
        params: params ?? {},
      }),
      transformResponse: (r: ApiResponse<{ unreadCount: number }>) => unwrap(r),
      providesTags: ["Notifications"],
    }),

    markNotificationRead: builder.mutation<AppNotification, number>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: "PATCH" }),
      transformResponse: (r: ApiResponse<AppNotification>) => unwrap(r),
      invalidatesTags: ["Notifications"],
    }),

    markAllNotificationsRead: builder.mutation<
      { updated: number },
      { leagueId?: number } | void
    >({
      query: (params) => ({
        url: "/notifications/read-all",
        method: "PATCH",
        params: params ?? {},
      }),
      transformResponse: (r: ApiResponse<{ updated: number }>) => unwrap(r),
      invalidatesTags: ["Notifications"],
    }),
  }),
});

export const {
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
