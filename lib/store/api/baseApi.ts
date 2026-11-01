import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { logout } from "../features/authSlice";
import type { ApiErrorBody, ApiResponse } from "./types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:7000/api/v1";

// These run before a session exists, or during a password reset, so they must
// not be given the stored session token.
const FLOW_ENDPOINTS = new Set([
  "login",
  "register",
  "forgetPassword",
  "verifyForgetOtp",
  "resendForgetOtp",
  "resetPassword",
  "verifyEmailOtp",
  "resendEmailOtp",
  "getManagementByType",
]);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState, endpoint }) => {
    const state = getState() as { auth?: { token?: string | null } };
    const token = state.auth?.token;

    // Flow endpoints carry their own short-lived token, passed per request.
    const carriesOwnToken = FLOW_ENDPOINTS.has(endpoint);

    if (token && !carriesOwnToken) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// A rejected session is cleared here rather than in every component, so any
// expired or deleted account lands back on the login screen the same way.
const baseQueryWithAuthGuard: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  const isSessionRequest = !FLOW_ENDPOINTS.has(api.endpoint);

  if (result.error?.status === 401 && isSessionRequest) {
    api.dispatch(logout());
    // The cache goes with the session, or the rejected account's data stays on
    // screen behind the login redirect.
    api.dispatch(baseApi.util.resetApiState());
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuthGuard,
  tagTypes: [
    "User",
    "Users",
    "Management",
    "LeagueContent",
    "LeagueSettings",
    "LeagueMembers",
    "Calendar",
    "Notifications",
    "League",
    "Leagues",
    "Team",
    "Teams",
    "Invites",
    "MyInvites",
    "PlayerImport",
    "Rosters",
    "Salaries",
    "FreeAgency",
    "Overview",
    "Trades",
  ],
  refetchOnReconnect: true,
  endpoints: () => ({}),
});

// Every endpoint answers with the same envelope, so the payload is pulled out
// in one place instead of in each component.
export const unwrap = <T>(response: ApiResponse<T>) => response.data;

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  if (!error) return fallback;

  const candidate = error as {
    status?: number | string;
    data?: ApiErrorBody | string;
    error?: string;
  };

  if (typeof candidate.data === "string" && candidate.data) {
    return candidate.data;
  }

  if (candidate.data && typeof candidate.data === "object") {
    const body = candidate.data as ApiErrorBody;
    if (body.errorSources?.length) return body.errorSources[0].message;
    if (body.message) return body.message;
  }

  // status is "FETCH_ERROR" when the request never reached the server, which in
  // the browser is also what a blocked CORS origin looks like.
  if (candidate.status === "FETCH_ERROR") {
    return "Cannot reach the server. Please check your connection and try again.";
  }

  return fallback;
};

export const getApiErrorStatus = (error: unknown) => {
  const status = (error as { status?: number | string } | undefined)?.status;
  return typeof status === "number" ? status : undefined;
};
