import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type PlatformRole = "Commissioner" | "Owner";
export type LeagueStatus = "Active" | "Draft" | "Archived";

export type PlatformUser = {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  leagues: number;
  created: string;
};

export type PlatformLeague = {
  id: string;
  name: string;
  commissioner: string;
  teams: number;
  status: LeagueStatus;
  created: string;
};

export type AdminViewingLeague = {
  id: string;
  name: string;
};

type PlatformState = {
  users: PlatformUser[];
  leagues: PlatformLeague[];
  adminViewingLeague: AdminViewingLeague | null;
};

const ROLES: PlatformRole[] = [
  "Commissioner",
  "Owner",
  "Commissioner",
  "Commissioner",
  "Owner",
  "Commissioner",
  "Owner",
  "Owner",
  "Owner",
];

const initialState: PlatformState = {
  users: ROLES.map((role) => ({
    id: nanoid(6),
    name: "Robin Keyz",
    email: "robin@avora.app",
    role,
    leagues: 3,
    created: "Jan 12, 2024",
  })),
  leagues: Array.from({ length: 8 }, () => ({
    id: nanoid(6),
    name: "Celtics Dynasty",
    commissioner: "Robin Keyz",
    teams: 12,
    status: "Active" as LeagueStatus,
    created: "Jan 12, 2024",
  })),
  adminViewingLeague: null,
};

const platformSlice = createSlice({
  name: "platform",
  initialState,
  reducers: {
    removePlatformUser(state, action: PayloadAction<string>) {
      state.users = state.users.filter((u) => u.id !== action.payload);
    },
    setUserRole(
      state,
      action: PayloadAction<{ id: string; role: PlatformRole }>,
    ) {
      const u = state.users.find((x) => x.id === action.payload.id);
      if (u) u.role = action.payload.role;
    },
    setLeagueStatus(
      state,
      action: PayloadAction<{ id: string; status: LeagueStatus }>,
    ) {
      const l = state.leagues.find((x) => x.id === action.payload.id);
      if (l) l.status = action.payload.status;
    },
    enterLeagueView(state, action: PayloadAction<AdminViewingLeague>) {
      state.adminViewingLeague = action.payload;
    },
    exitLeagueView(state) {
      state.adminViewingLeague = null;
    },
  },
  extraReducers: (builder) => {
    // An admin who was standing inside a league must not still be there when
    // the next account signs in. DashboardShell reads this to decide whether
    // to show the commissioner shell.
    builder.addCase("auth/logout", (state) => {
      state.adminViewingLeague = null;
    });
  },
});

export const {
  removePlatformUser,
  setUserRole,
  setLeagueStatus,
  enterLeagueView,
  exitLeagueView,
} = platformSlice.actions;
export default platformSlice.reducer;
