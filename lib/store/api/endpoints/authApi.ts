import { baseApi, unwrap } from "../baseApi";
import type {
  ApiResponse,
  AuthUser,
  LoginResult,
  TokenOnly,
} from "../types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<
      LoginResult,
      { email: string; password: string; isRememberMe?: boolean }
    >({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (response: ApiResponse<LoginResult>) =>
        unwrap(response),
      invalidatesTags: ["User"],
    }),

    me: builder.query<AuthUser, void>({
      query: () => "/auth/me",
      transformResponse: (response: ApiResponse<AuthUser>) => unwrap(response),
      providesTags: ["User"],
    }),

    forgetPassword: builder.mutation<TokenOnly, { email: string }>({
      query: (body) => ({
        url: "/auth/forget-password",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<TokenOnly>) =>
        unwrap(response),
    }),

    // The otp token is passed in explicitly: it is a short-lived flow token,
    // not the stored session token.
    verifyForgetOtp: builder.mutation<
      TokenOnly,
      { otp: string; token: string }
    >({
      query: ({ otp, token }) => ({
        url: "/auth/verify-forget-otp",
        method: "POST",
        body: { otp },
        headers: { Authorization: `Bearer ${token}` },
      }),
      transformResponse: (response: ApiResponse<TokenOnly>) =>
        unwrap(response),
    }),

    resendForgetOtp: builder.mutation<unknown, { token: string }>({
      query: ({ token }) => ({
        url: "/auth/resend-otp",
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }),
    }),

    resetPassword: builder.mutation<
      unknown,
      { password: string; confirmPassword: string; token: string }
    >({
      query: ({ token, ...body }) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
        headers: { Authorization: `Bearer ${token}` },
      }),
    }),

    changePassword: builder.mutation<
      unknown,
      { oldPassword: string; newPassword: string; confirmPassword: string }
    >({
      query: (body) => ({
        url: "/auth/change-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useMeQuery,
  useLazyMeQuery,
  useForgetPasswordMutation,
  useVerifyForgetOtpMutation,
  useResendForgetOtpMutation,
  useResetPasswordMutation,
  useChangePasswordMutation,
} = authApi;
