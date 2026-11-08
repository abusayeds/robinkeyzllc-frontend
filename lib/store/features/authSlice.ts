import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser } from "../api/types";

export type UserRole = "owner" | "commissioner" | "admin";

export const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Team Owner",
  commissioner: "Commissioner",
  admin: "Super Admin",
};

export const ROLE_HOME: Record<UserRole, string> = {
  owner: "/dashboard",
  commissioner: "/home",
  admin: "/platform",
};

type AuthState = {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUser | null;
  role: UserRole;
};

// Exported so the store can merge a restored session onto it. A partial
// saved shape would otherwise leave fields undefined.
export const authInitialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  role: "owner",
};

// The backend role is platform level only. Commissioner and Team Owner are
// per league, so a signed-in account starts as owner until a league is opened.
const toUiRole = (user?: AuthUser | null): UserRole =>
  user?.role === "superAdmin" ? "admin" : "owner";

const authSlice = createSlice({
  name: "auth",
  initialState: authInitialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        token: string;
        user?: AuthUser | null;
        role?: UserRole;
      }>,
    ) {
      state.token = action.payload.token;
      state.isAuthenticated = true;

      if (action.payload.user !== undefined) {
        state.user = action.payload.user;
      }

      state.role =
        action.payload.role ??
        (action.payload.user ? toUiRole(action.payload.user) : state.role);
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      if (action.payload) state.role = toUiRole(action.payload);
    },
    setRole(state, action: PayloadAction<UserRole>) {
      state.role = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.role = "owner";
    },
  },
});

export const { setCredentials, setUser, setRole, logout } = authSlice.actions;
export default authSlice.reducer;
