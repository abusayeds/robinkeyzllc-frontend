"use client";

import { baseApi } from "./api/baseApi";
import { logout, setCredentials } from "./features/authSlice";
import type { AppDispatch } from "./store";

type Credentials = Parameters<typeof setCredentials>[0];

/**
 * Signing in replaces the whole session, not just the token.
 *
 * Without this, logging in as a second account left the first one's cached
 * responses and active league sitting in the store, so the new user went on
 * seeing the previous user's leagues, teams and notifications until something
 * happened to refetch them. `logout()` clears the auth slice and, through its
 * extra reducer, the active league; `resetApiState()` drops every cached
 * response so each live query refetches under the new token.
 */
export function startSession(dispatch: AppDispatch, credentials: Credentials) {
  dispatch(logout());
  dispatch(baseApi.util.resetApiState());
  dispatch(setCredentials(credentials));
}

/** Signing out drops the cache for the same reason. */
export function endSession(dispatch: AppDispatch) {
  dispatch(logout());
  dispatch(baseApi.util.resetApiState());
}
