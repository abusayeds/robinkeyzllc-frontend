import { baseApi, unwrap } from "../baseApi";
import type {
  ApiResponse,
  AuthUser,
  ListQuery,
  ListResult,
  TokenOnly,
} from "../types";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Returns only a token: the OTP email is sent after the response, so the
    // account does not exist in a usable form until it is verified.
    register: builder.mutation<
      TokenOnly,
      { name: string; email: string; password: string; phone?: string }
    >({
      query: (body) => ({ url: "/users/register", method: "POST", body }),
      transformResponse: (response: ApiResponse<TokenOnly>) => unwrap(response),
    }),

    verifyEmailOtp: builder.mutation<AuthUser, { otp: string; token: string }>({
      query: ({ otp, token }) => ({
        url: "/users/verify-email-otp",
        method: "POST",
        body: { otp },
        headers: { Authorization: `Bearer ${token}` },
      }),
      transformResponse: (response: ApiResponse<AuthUser>) => unwrap(response),
    }),

    resendEmailOtp: builder.mutation<unknown, { token: string }>({
      query: ({ token }) => ({
        url: "/users/resend-email-otp",
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    }),

    myProfile: builder.query<AuthUser, void>({
      query: () => "/users/me",
      transformResponse: (response: ApiResponse<AuthUser>) => unwrap(response),
      providesTags: ["User"],
    }),

    allUsers: builder.query<ListResult<AuthUser>, ListQuery | void>({
      query: (params) => ({ url: "/users/all-user", params: params ?? {} }),
      // pagination sits beside data in the envelope, so both are kept.
      transformResponse: (response: ApiResponse<AuthUser[]>) => ({
        items: response.data ?? [],
        pagination: response.pagination,
      }),
      providesTags: ["Users"],
    }),

    singleUser: builder.query<AuthUser, number>({
      query: (id) => `/users/${id}`,
      transformResponse: (response: ApiResponse<AuthUser>) => unwrap(response),
      providesTags: (_result, _error, id) => [{ type: "Users", id }],
    }),

    updateMyProfile: builder.mutation<
      AuthUser,
      { name?: string; phone?: string; image?: string | null }
    >({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      transformResponse: (response: ApiResponse<AuthUser>) => unwrap(response),
      invalidatesTags: ["User", "Users"],
    }),

    deleteUser: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyEmailOtpMutation,
  useResendEmailOtpMutation,
  useMyProfileQuery,
  useUpdateMyProfileMutation,
  useAllUsersQuery,
  useSingleUserQuery,
  useDeleteUserMutation,
} = userApi;
